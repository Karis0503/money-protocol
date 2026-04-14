import { Decision, FinancialState, Insight } from "@/types/domain";

export function generateDecisions(userId: string, state: FinancialState, insights: Insight[]): Decision[] {
  const decisions: Decision[] = [];

  if (state.balance <= 0) {
    decisions.push({
      user_id: userId,
      severity: "high",
      command: "Do not spend today",
      reason: "Balance is non-positive. Immediate spending freeze required."
    });
  }

  const foodWaste = insights.find((i) => i.content.toLowerCase().includes("food"));
  if (foodWaste) {
    decisions.push({
      user_id: userId,
      severity: "medium",
      command: "Stop ordering food",
      reason: "Food spending pattern is flagged as wasteful."
    });
  }

  if (state.monthlyExpense > state.monthlyIncome * 0.9) {
    decisions.push({
      user_id: userId,
      severity: "high",
      command: "Activate strict mode: only essentials",
      reason: "Expense pressure is too high versus monthly income."
    });
  }

  if (decisions.length === 0) {
    decisions.push({
      user_id: userId,
      severity: "low",
      command: "Maintain current spending plan",
      reason: "No critical risk detected."
    });
  }

  return decisions;
}
