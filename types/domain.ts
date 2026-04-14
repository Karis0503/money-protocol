export type TransactionType = "income" | "expense";
export type AllocationBucket = "essentials" | "investment" | "stability" | "joy";
export type PriorityLevel = "high" | "medium" | "low";

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
  confidence: number;
  agent: string;
}

export interface Decision {
  user_id: string;
  severity: "low" | "medium" | "high";
  command: string;
  reason: string;
  priority_score: number;
  agent: string;
}

export interface MemoryRecord {
  user_id: string;
  memory_type: "short_term" | "long_term";
  key: string;
  value: string;
  score: number;
}

export interface AgentMessage {
  user_id: string;
  from_agent: string;
  to_agent: string;
  message_type: "state" | "analysis" | "decision" | "warning";
  payload: string;
}

export interface PriorityDecision {
  priority: PriorityLevel;
  message: string;
  source: string;
}

export interface EngineEvaluation {
  blocked: boolean;
  warnings: string[];
  suggestions: string[];
  score: number;
  priorities: PriorityDecision[];
  escalations: string[];
  behaviorCounters: Array<{ key: string; value: number }>;
}
