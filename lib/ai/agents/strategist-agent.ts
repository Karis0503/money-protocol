import { AgentContext, ProtocolAgent } from "@/lib/ai/agents/types";

export const strategistAgent: ProtocolAgent = {
  id: "strategist_agent",
  run(context: AgentContext) {
    const decisions = [];
    const hasWaste = context.sharedInsights.some((i) => i.kind === "waste");

    if (context.state.balance <= 0) {
      decisions.push({
        user_id: context.userId,
        severity: "high" as const,
        command: "Do not spend today",
        reason: "Balance is non-positive. Immediate spending freeze required.",
        priority_score: 0,
        agent: "strategist_agent"
      });
    }

    if (hasWaste) {
      decisions.push({
        user_id: context.userId,
        severity: "medium" as const,
        command: "Stop ordering food",
        reason: "Waste pattern detected and needs immediate behavior correction.",
        priority_score: 0,
        agent: "strategist_agent"
      });
    }

    if (context.state.monthlyExpense > context.state.monthlyIncome * 0.9) {
      decisions.push({
        user_id: context.userId,
        severity: "high" as const,
        command: "Activate strict mode: essentials only",
        reason: "Expense pressure is near income ceiling.",
        priority_score: 0,
        agent: "strategist_agent"
      });
    }

    if (decisions.length === 0) {
      decisions.push({
        user_id: context.userId,
        severity: "low" as const,
        command: "Maintain current spending plan",
        reason: "No critical financial risk detected.",
        priority_score: 0,
        agent: "strategist_agent"
      });
    }

    return {
      decisions,
      outboundMessages: decisions.map((d) => ({
        to: "enforcer_agent",
        type: "decision" as const,
        payload: `${d.command} | ${d.reason}`
      }))
    };
  }
};
