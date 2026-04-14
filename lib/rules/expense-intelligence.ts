import { FinancialState } from "@/types/domain";

export interface CategoryLimit {
  category: string;
  budgetBucket: "essentials" | "investment" | "stability" | "joy";
  limitRatio: number;
}

export const DEFAULT_CATEGORY_LIMITS: CategoryLimit[] = [
  { category: "food", budgetBucket: "joy", limitRatio: 0.1 },
  { category: "coffee", budgetBucket: "joy", limitRatio: 0.05 },
  { category: "transport", budgetBucket: "essentials", limitRatio: 0.3 }
];

export function detectWastePatterns(state: FinancialState): string[] {
  const warnings: string[] = [];
  const top = state.topExpenseCategories[0];

  if (top && top.total > state.monthlyExpense * 0.35) {
    warnings.push(`High concentration: ${top.category} dominates spending.`);
  }

  if (state.avgDailyExpense > 0 && state.monthlyIncome > 0 && state.avgDailyExpense * 30 > state.monthlyIncome) {
    warnings.push("Projected spending exceeds monthly income.");
  }

  return warnings;
}

export function evaluateCategoryLimits(input: {
  categoryTotals: Record<string, number>;
  budgetByBucket: Record<string, number>;
  limits?: CategoryLimit[];
}): string[] {
  const limits = input.limits ?? DEFAULT_CATEGORY_LIMITS;

  return limits.flatMap((limit) => {
    const spent = input.categoryTotals[limit.category] ?? 0;
    const bucketBudget = input.budgetByBucket[limit.budgetBucket] ?? 0;
    const threshold = Math.round(bucketBudget * limit.limitRatio);

    if (bucketBudget > 0 && spent > threshold) {
      return [`${limit.category} spending exceeded ${Math.round(limit.limitRatio * 100)}% of ${limit.budgetBucket} budget`];
    }

    return [];
  });
}
