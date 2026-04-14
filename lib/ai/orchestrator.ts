import { runAgentNetwork } from "@/lib/ai/agents/agent-broker";
import { AgentContext } from "@/lib/ai/agents/types";
import { loadAgentMemory, storeMemoryEntries } from "@/lib/ai/memory-system";
import { buildFinancialState } from "@/lib/ai/state-builder";
import { supabaseAdmin } from "@/lib/db/supabase";

export async function runMoneyProtocolCycle(userId: string) {
  const state = await buildFinancialState(userId);
  const memory = await loadAgentMemory(userId);

  const context: AgentContext = {
    userId,
    state,
    insights: [],
    decisions: [],
    memory,
    mailbox: []
  };

  const { insights, decisions, warnings, mailbox } = runAgentNetwork(context);
  const rankedDecisions = decisions.map((decision, index) => ({ ...decision, priority_rank: index + 1 }));

  if (insights.length > 0) {
    await supabaseAdmin.from("insights").insert(insights);
  }

  if (rankedDecisions.length > 0) {
    await supabaseAdmin.from("decisions").insert(rankedDecisions);
  }

  if (mailbox.length > 0) {
    await supabaseAdmin.from("agent_messages").insert(
      mailbox.map((message) => ({
        user_id: userId,
        from_agent: message.from,
        to_agent: message.to,
        topic: message.topic,
        payload: message.payload
      }))
    );
  }

  await storeMemoryEntries(userId, [
    {
      key: "last_cycle_summary",
      value: `Insights=${insights.length}, Decisions=${rankedDecisions.length}, Warnings=${warnings.length}`,
      source: "orchestrator"
    },
    ...(rankedDecisions[0]
      ? [
          {
            key: "top_decision",
            value: rankedDecisions[0].command,
            source: "decision_engine"
          }
        ]
      : [])
  ]);

  return { state, insights, decisions: rankedDecisions, warnings, mailboxSize: mailbox.length };
}
