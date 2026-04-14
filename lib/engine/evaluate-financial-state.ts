import { runAgentSimulation } from "@/lib/engine/agent-simulation";
import { trackBehaviorPatterns } from "@/lib/engine/behavior-tracker";
import { detectWastePatterns, evaluateCategoryLimits } from "@/lib/rules/expense-intelligence";
import { calculateFinancialScore } from "@/lib/scoring/financial-score";
import { EngineEvaluation, FinancialState, MemoryRecord, PriorityDecision } from "@/types/domain";

export interface EvaluationInput {
  state: FinancialState;
  categoryTotals: Record<string, number>;
  budgetByBucket: Record<string, number>;
  memories?: MemoryRecord[];
  consistency?: number;
}

function dedupePriorities(items: PriorityDecision[]): PriorityDecision[] {
  const seen = new Set<string>();
  const order = { high: 0, medium: 1, low: 2 };
  return items
    .filter((item) => {
      const key = `${item.priority}:${item.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => order[a.priority] - order[b.priority]);
}

export function evaluateFinancialState(data: EvaluationInput): EngineEvaluation {
  const wasteWarnings = detectWastePatterns(data.state);
  const limitWarnings = evaluateCategoryLimits({
    categoryTotals: data.categoryTotals,
    budgetByBucket: data.budgetByBucket
  });

  const warnings = [...wasteWarnings, ...limitWarnings];
  const savingsRate =
    data.state.monthlyIncome > 0 ? (data.state.monthlyIncome - data.state.monthlyExpense) / data.state.monthlyIncome : 0;

  const score = calculateFinancialScore({
    state: data.state,
    monthlySavingsRate: savingsRate,
    warningCount: warnings.length,
    consistency: data.consistency ?? 0.7
  });

  const behavior = trackBehaviorPatterns(warnings, data.memories ?? []);
  const agentDecisions = runAgentSimulation({ state: data.state, warnings, score });

  const base: PriorityDecision[] = [
    ...(data.state.balance <= 0 ? [{ priority: "high" as const, message: "Do not spend today", source: "core-engine" }] : []),
    ...(warnings.length > 0 ? [{ priority: "medium" as const, message: warnings[0], source: "core-engine" }] : []),
    { priority: "low" as const, message: "Maintain disciplined spending plan", source: "core-engine" }
  ];

  const escalationPriorities: PriorityDecision[] = behavior.escalations.map((text) => ({
    priority: "high",
    message: text,
    source: "behavior-tracker"
  }));

  const priorities = dedupePriorities([...base, ...agentDecisions, ...escalationPriorities]);
  const suggestions = priorities.filter((p) => p.priority !== "high").map((p) => p.message);

  return {
    blocked: priorities.some((p) => p.priority === "high") || score < 45,
    warnings,
    suggestions,
    score,
    priorities,
    escalations: behavior.escalations,
    behaviorCounters: behavior.counters
  };
}
