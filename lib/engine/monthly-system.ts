import { supabaseAdmin } from "@/lib/db/supabase";

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function ensureMonthlySnapshot(userId: string, date = new Date()) {
  const current = monthKey(date);
  const previousDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
  const previous = monthKey(previousDate);

  const { data: existing } = await supabaseAdmin
    .from("monthly_summaries")
    .select("id")
    .eq("user_id", userId)
    .eq("month_key", previous)
    .maybeSingle();

  if (existing) return;

  const periodStart = `${previous}-01`;
  const periodEnd = `${current}-01`;

  const { data: txs, error } = await supabaseAdmin
    .from("transactions")
    .select("type, amount")
    .eq("user_id", userId)
    .gte("created_at", periodStart)
    .lt("created_at", periodEnd);

  if (error) throw error;

  const income = (txs ?? []).filter((tx) => tx.type === "income").reduce((sum, tx) => sum + tx.amount, 0);
  const expense = (txs ?? []).filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0);

  if (income === 0 && expense === 0) return;

  await supabaseAdmin.from("monthly_summaries").upsert(
    {
      user_id: userId,
      month_key: previous,
      total_income: income,
      total_expense: expense,
      net: income - expense
    },
    { onConflict: "user_id,month_key" }
  );
}
