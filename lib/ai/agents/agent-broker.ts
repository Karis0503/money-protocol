import { AgentContext, AgentMessage, AgentName } from "@/lib/ai/agents/types";
import { runAnalysis } from "@/lib/ai/analysis-engine";
import { generateDecisions } from "@/lib/ai/decision-engine";
import { buildWarnings } from "@/lib/ai/warning-system";

function newMessage(from: AgentName, to: AgentName | "orchestrator", topic: string, payload: Record<string, unknown>): AgentMessage {
  return {
    from,
    to,
    topic,
    payload,
    createdAt: new Date().toISOString()
  };
}

export function runAgentNetwork(context: AgentContext) {
  const mailbox: AgentMessage[] = [...context.mailbox];

  mailbox.push(
    newMessage("state_builder", "analysis_engine", "state_ready", {
      monthlyExpense: context.state.monthlyExpense,
      monthlyIncome: context.state.monthlyIncome,
      avgDailyExpense: context.state.avgDailyExpense,
      memorySignals: context.memory.slice(0, 5)
    })
  );

  const insights = runAnalysis(context.userId, context.state, mailbox, context.memory);
  mailbox.push(
    newMessage("analysis_engine", "decision_engine", "insights_ready", {
      insightCount: insights.length,
      insights: insights.map((i) => i.content)
    })
  );

  const decisions = generateDecisions(context.userId, context.state, insights, mailbox, context.memory);
  mailbox.push(
    newMessage("decision_engine", "warning_engine", "decisions_ready", {
      decisionCount: decisions.length,
      topDecision: decisions[0]?.command ?? "none"
    })
  );

  const warnings = buildWarnings(decisions, mailbox);
  mailbox.push(newMessage("warning_engine", "orchestrator", "warnings_ready", { warningCount: warnings.length }));

  return { mailbox, insights, decisions, warnings };
}
