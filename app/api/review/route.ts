import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function GET() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: allTx } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", DEFAULT_USER_ID)
    .eq("month", currentMonth);

  const totalIncome =
    allTx
      ?.filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;

  const totalExpense =
    allTx
      ?.filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;

  // simple score
  let score = 100;
  if (totalIncome > 0) {
    const ratio = totalExpense / totalIncome;
    score -= Math.min(70, ratio * 100);
  }

  let insightSummary = "You're doing okay.";

  if (totalExpense > totalIncome) {
    insightSummary = "⚠️ You spent more than you earned.";
  } else if (totalExpense > totalIncome * 0.7) {
    insightSummary = "⚠️ High spending this month.";
  } else {
    insightSummary = "✅ Good financial control.";
  }

  return NextResponse.json({
    totalIncome,
    totalExpense,
    score: Math.round(score),
    insightSummary,
  });
}
