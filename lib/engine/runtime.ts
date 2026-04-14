import { runMoneyProtocolCycle } from "@/lib/ai/orchestrator";
import { evaluateFinancialState } from "@/lib/engine/evaluate-financial-state";
import { ensureMonthlySnapshot } from "@/lib/engine/monthly-system";
import { allocateIncome } from "@/lib/rules/allocation";
import { supabaseAdmin } from "@/lib/db/supabase";
import { buildFinancialState } from "@/lib/ai/state-builder";
import { getUserMemories, upsertMemory } from "@/lib/memory/store";

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function applyIncomeAllocation(userId: string, incomeAmount: number, at = new Date()) {
  const key = monthKey(at);
  const allocationRows = allocateIncome(incomeAmount);

  await supabaseAdmin.from("allocation_ledgers").insert(
    allocationRows.map((row) => ({
      user_id: userId,
      month_key: key,
      bucket: row.bucket,
      amount: row.amount,
      ratio: row.ratio
    }))
  );

  return allocationRows;
}

async function getBudgetByBucket(userId: string, key: string): Promise<Record<string, number>> {
  const { data } = await supabaseAdmin.from("allocation_ledgers").select("bucket, amount").eq("user_id", userId).eq("month_key", key);

  return (data ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.bucket] = (acc[row.bucket] ?? 0) + row.amount;
    return acc;
  }, {});
}

async function getCategoryTotals(userId: string, key: string): Promise<Record<string, number>> {
  const start = `${key}-01`;
  const [year, month] = key.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month, 1));
  const end = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}-01`;

  const { data } = await supabaseAdmin
    .from("transactions")
    .select("category, amount, type")
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("created_at", start)
    .lt("created_at", end);

  return (data ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + row.amount;
    return acc;
  }, {});
}

export async function evaluateUser(userId: string) {
  await ensureMonthlySnapshot(userId);

  const [state, memories] = await Promise.all([buildFinancialState(userId), getUserMemories(userId)]);
  const key = monthKey(new Date());
  const [categoryTotals, budgetByBucket] = await Promise.all([getCategoryTotals(userId, key), getBudgetByBucket(userId, key)]);

  const evaluation = evaluateFinancialState({
    state,
    categoryTotals,
    budgetByBucket,
    memories,
    consistency: 0.75
  });

  await Promise.all([
    ...evaluation.behaviorCounters.map((counter) =>
      upsertMemory({
        user_id: userId,
        memory_type: "short_term",
        key: counter.key,
        value: String(counter.value),
        score: counter.value >= 2 ? 0.8 : 0.5
      })
    ),
    ...evaluation.escalations.map((escalation, idx) =>
      upsertMemory({
        user_id: userId,
        memory_type: "long_term",
        key: `escalation_${idx}`,
        value: escalation,
        score: 0.9
      })
    )
  ]);

  const autonomous = await runMoneyProtocolCycle(userId);

  return {
    state,
    evaluation,
    autonomous,
    categoryTotals,
    budgetByBucket
  };
}
