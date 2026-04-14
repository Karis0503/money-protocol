import { AgentMessage } from "@/lib/ai/agents/types";
import { prioritizeDecisions } from "@/lib/ai/prioritization";
import { Decision, FinancialState, Insight } from "@/types/domain";

export function generateDecisions(
  userId: string,
  state: FinancialState,
  insights: Insight[],
  mailbox: AgentMessage[] = [],
  memory: string[] = []
): Decision[] {
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

  if (memory.some((m) => m.toLowerCase().includes("missed budget"))) {
    decisions.push({
      user_id: userId,
      severity: "high",
      command: "Lock discretionary spending for 72 hours",
      reason: "Memory system detected repeated missed budgets."
    });
  }

  if (mailbox.length > 2) {
    decisions.push({
      user_id: userId,
      severity: "medium",
      command: "Review agent warning summary before any purchase",
      reason: "Multi-agent network reported elevated coordination signals."
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

  return prioritizeDecisions(decisions);
}
