export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  source_text: string;
  created_at: string;
}

export interface FinancialState {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  topExpenseCategories: Array<{ category: string; total: number }>;
  avgDailyExpense: number;
}

export interface Insight {
  user_id: string;
  kind: "habit" | "waste" | "prediction";
  content: string;
}

export interface Decision {
  user_id: string;
  severity: "low" | "medium" | "high";
  command: string;
  reason: string;
  priority_rank?: number;
}
