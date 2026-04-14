import { supabaseAdmin } from "@/lib/db/supabase";
import { FinancialState } from "@/types/domain";

export async function buildFinancialState(userId: string): Promise<FinancialState> {
  const { data, error } = await supabaseAdmin
    .from("transactions")
    .select("amount, type, category, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  let income = 0;
  let expense = 0;
  const categoryTotals = new Map<string, number>();

  for (const tx of data ?? []) {
    const date = new Date(tx.created_at);
    if (date.getMonth() === month && date.getFullYear() === year) {
      if (tx.type === "income") income += tx.amount;
      if (tx.type === "expense") {
        expense += tx.amount;
        categoryTotals.set(tx.category, (categoryTotals.get(tx.category) ?? 0) + tx.amount);
      }
    }
  }

  const daysElapsed = Math.max(1, now.getDate());
  const topExpenseCategories = [...categoryTotals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  return {
    balance: income - expense,
    monthlyIncome: income,
    monthlyExpense: expense,
    topExpenseCategories,
    avgDailyExpense: Math.round(expense / daysElapsed)
  };
}
