import { FinancialState } from "@/types/domain";

export interface ScoreInput {
  state: FinancialState;
  monthlySavingsRate: number;
  warningCount: number;
  consistency: number;
}

export function calculateFinancialScore(input: ScoreInput): number {
  let score = 100;

  score += Math.round(input.monthlySavingsRate * 40);
  score -= input.warningCount * 8;
  score += Math.round(input.consistency * 20);

  if (input.state.balance < 0) score -= 20;
  if (input.state.monthlyExpense > input.state.monthlyIncome) score -= 10;

  return Math.max(0, Math.min(100, score));
}
