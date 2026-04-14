import { analystAgent } from "@/lib/ai/agents/analyst-agent";
import { enforcerAgent } from "@/lib/ai/agents/enforcer-agent";
import { memoryAgent } from "@/lib/ai/agents/memory-agent";
import { strategistAgent } from "@/lib/ai/agents/strategist-agent";
import { prioritizeDecisions } from "@/lib/ai/decision-prioritizer";
import { buildFinancialState } from "@/lib/ai/state-builder";
import { publishAgentMessages } from "@/lib/automation/agent-bus";
import { supabaseAdmin } from "@/lib/db/supabase";
import { getUserMemories, upsertMemory } from "@/lib/memory/store";
import { AgentMessage, Decision, Insight } from "@/types/domain";

const AGENT_ORDER = [analystAgent, strategistAgent, enforcerAgent, memoryAgent];

export async function runMoneyProtocolCycle(userId: string) {
  const state = await buildFinancialState(userId);
  const memories = await getUserMemories(userId);

  const insights: Insight[] = [];
  const decisions: Decision[] = [];
  const messages: AgentMessage[] = [];

  for (let loop = 0; loop < 2; loop += 1) {
    for (const agent of AGENT_ORDER) {
      const result = agent.run({
        userId,
        state,
        memories,
        sharedInsights: insights
      });

      if (result.insights?.length) insights.push(...result.insights);
      if (result.decisions?.length) decisions.push(...result.decisions);
      if (result.outboundMessages?.length) {
        messages.push(
          ...result.outboundMessages.map((msg) => ({
            user_id: userId,
            from_agent: agent.id,
            to_agent: msg.to,
            message_type: msg.type,
            payload: msg.payload
          }))
        );
      }
    }
  }

  const prioritizedDecisions = prioritizeDecisions(decisions);

  if (insights.length > 0) {
    await supabaseAdmin.from("insights").insert(insights);
  }

  if (prioritizedDecisions.length > 0) {
    await supabaseAdmin.from("decisions").insert(prioritizedDecisions);
  }

  await publishAgentMessages(messages);

  const strictModeMentions = messages.filter((m) => m.payload.includes("strict_mode_streak")).length;
  await upsertMemory({
    user_id: userId,
    memory_type: "short_term",
    key: "strict_mode_streak",
    value: String(strictModeMentions),
    score: strictModeMentions >= 3 ? 0.9 : 0.4
  });

  const warnings = prioritizedDecisions
    .filter((d) => d.severity !== "low")
    .map((d) => `[P${d.priority_score}] ${d.command}: ${d.reason}`);

  return { state, insights, decisions: prioritizedDecisions, warnings, messages };
}
