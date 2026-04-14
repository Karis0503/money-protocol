import { FinancialState, Insight } from "@/types/domain";

export function runAnalysis(userId: string, state: FinancialState): Insight[] {
  const insights: Insight[] = [];

  if (state.monthlyExpense > state.monthlyIncome * 0.8) {
    insights.push({
      user_id: userId,
      kind: "habit",
      content: "Expense ratio is above 80% of income. Your savings discipline is weak."
    });
  }

  const top = state.topExpenseCategories[0];
  if (top && top.total > state.monthlyExpense * 0.35) {
    insights.push({
      user_id: userId,
      kind: "waste",
      content: `Category '${top.category}' dominates spending at ${top.total}. This is likely wasteful.`
    });
  }

  const projected = state.avgDailyExpense * 30;
  if (projected > state.monthlyIncome && state.monthlyIncome > 0) {
    insights.push({
      user_id: userId,
      kind: "prediction",
      content: `Projected monthly expense is ${projected}, exceeding income. You are on track for a deficit.`
    });
  }

  return insights;
}
