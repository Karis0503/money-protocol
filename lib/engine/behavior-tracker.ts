import { MemoryRecord } from "@/types/domain";

interface BehaviorResult {
  escalations: string[];
  counters: Array<{ key: string; value: number }>;
}

function getCounter(memories: MemoryRecord[], key: string): number {
  const row = memories.find((m) => m.key === key);
  return row ? Number.parseInt(row.value, 10) || 0 : 0;
}

export function trackBehaviorPatterns(warnings: string[], memories: MemoryRecord[]): BehaviorResult {
  const escalations: string[] = [];
  const counters: Array<{ key: string; value: number }> = [];

  const foodExceeded = warnings.some((w) => w.toLowerCase().includes("food"));
  const deficitRisk = warnings.some((w) => w.toLowerCase().includes("projected spending exceeds"));

  const foodCount = foodExceeded ? getCounter(memories, "habit_food_overuse_count") + 1 : 0;
  const deficitCount = deficitRisk ? getCounter(memories, "habit_deficit_risk_count") + 1 : 0;

  counters.push({ key: "habit_food_overuse_count", value: foodCount });
  counters.push({ key: "habit_deficit_risk_count", value: deficitCount });

  if (foodCount >= 3) {
    escalations.push("Repeated food overspending detected (3+ cycles). Escalate to strict no-delivery policy.");
  }

  if (deficitCount >= 2) {
    escalations.push("Repeated deficit-risk pattern detected. Escalate to hard spending block.");
  }

  return { escalations, counters };
}
