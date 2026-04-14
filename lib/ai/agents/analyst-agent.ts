import { AgentContext, ProtocolAgent } from "@/lib/ai/agents/types";

export const analystAgent: ProtocolAgent = {
  id: "analyst_agent",
  run(context: AgentContext) {
    const insights = [];

    if (context.state.monthlyExpense > context.state.monthlyIncome * 0.8) {
      insights.push({
        user_id: context.userId,
        kind: "habit" as const,
        content: "Expense ratio is above 80% of income. Financial discipline is weakening.",
        confidence: 0.9,
        agent: "analyst_agent"
      });
    }

    const top = context.state.topExpenseCategories[0];
    if (top && top.total > context.state.monthlyExpense * 0.35) {
      insights.push({
        user_id: context.userId,
        kind: "waste" as const,
        content: `Spending concentration detected in '${top.category}' at ${top.total}.`,
        confidence: 0.82,
        agent: "analyst_agent"
      });
    }

    const projected = context.state.avgDailyExpense * 30;
    if (context.state.monthlyIncome > 0 && projected > context.state.monthlyIncome) {
      insights.push({
        user_id: context.userId,
        kind: "prediction" as const,
        content: `Predicted monthly spending (${projected}) exceeds income. Deficit risk is high.`,
        confidence: 0.76,
        agent: "analyst_agent"
      });
    }

    return {
      insights,
      outboundMessages: insights.map((i) => ({
        to: "strategist_agent",
        type: "analysis" as const,
        payload: i.content
      }))
    };
  }
};
