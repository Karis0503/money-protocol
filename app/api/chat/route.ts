import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // =========================
    // 📦 KIRIM KE TRANSACTIONS
    // =========================
    const res = await fetch(`${new URL(request.url).origin}/api/transactions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });

    // =========================
    // 🧠 AMBIL TRANSAKSI USER
    // =========================
    const { data: allTx } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", DEFAULT_USER_ID);

    // =========================
// 🧠 HABIT DETECTION
// =========================

// ambil 20 transaksi terakhir
const recentTx = allTx?.slice(0, 20) ?? [];

// hitung berapa kali makan
const foodCount = recentTx.filter(
  (t) => t.type === "expense" && t.category === "food"
).length;

// detect habit
let habitWarning: string | null = null;

if (foodCount >= 5) {
  habitWarning = "You are frequently spending on food recently";
}

    // =========================
    // 🧠 FILTER EXPENSE ONLY
    // =========================
    const expenseTx =
      allTx?.filter((t) => t.type === "expense") ?? [];

    const totalExpense = expenseTx.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    const foodExpense = expenseTx
      .filter((t) => t.category === "food")
      .reduce((sum, t) => sum + t.amount, 0);

    // =========================
    // 📊 RATIO
    // =========================
    const ratio = totalExpense > 0 ? foodExpense / totalExpense : 0;

    // =========================
    // 🎯 SEVERITY
    // =========================
    let severity: "low" | "medium" | "high" = "low";

    if (totalExpense === 0) {
      severity = "low";
    } else if (ratio > 0.25 && foodExpense > 200000) {
      severity = "high";
    } else if (ratio > 0.15) {
      severity = "medium";
    }

    // =========================
// 🧠 CATEGORY BREAKDOWN
// =========================
const categoryExpenseMap: Record<string, number> = {};

expenseTx.forEach((t) => {
  if (!categoryExpenseMap[t.category]) {
    categoryExpenseMap[t.category] = 0;
  }
  categoryExpenseMap[t.category] += t.amount;
});

    // =========================
    // 👤 USER MODE
    // =========================
    const { data: user } = await supabase
      .from("users")
      .select("mode")
      .eq("id", DEFAULT_USER_ID)
      .single();

    const mode = user?.mode || "relaxed";

    // =========================
    // ❄️ COOLDOWN
    // =========================
    const { data: lastAction } = await supabase
      .from("actions")
      .select("*")
      .eq("user_id", DEFAULT_USER_ID)
      .order("created_at", { ascending: false })
      .limit(1);

    let shouldInsert = true;

    if (lastAction?.[0]) {
      const lastTime = new Date(lastAction[0].created_at).getTime();
      const now = Date.now();
      const diff = (now - lastTime) / 1000;

      if (diff < 300) {
        shouldInsert = false;
      }
    }
    

    // =========================
    // 🧠 MODE LOGIC
    // =========================
    let shouldBlock = false;

    if (mode === "relaxed") {
      shouldBlock = false;
    } else if (mode === "strict") {
      shouldBlock = severity === "high";
    } else if (mode === "brutal") {
      shouldBlock = severity === "medium" || severity === "high";
    }

    // =========================
    // 🚫 INSERT ACTION
    // =========================
    if (shouldInsert && shouldBlock) {
      await supabase.from("actions").insert({
        user_id: DEFAULT_USER_ID,
        command: "Stop ordering food",
        status: "pending"
      });
    }

    // 🔥 CLEAR ACTION KALO UDAH GAK PERLU
    if (!shouldBlock) {
      await supabase
        .from("actions")
        .delete()
        .eq("user_id", DEFAULT_USER_ID);
    }    

    // =========================
    // 💾 SAVE DECISION
    // =========================
    await supabase.from("decisions").insert({
      user_id: DEFAULT_USER_ID,
      severity,
      reason: `Food spending is ${(ratio * 100).toFixed(
        0
      )}% of total expenses.`,
      category: "food",
      action: "stop ordering food"
    });

    // =========================
    // 🧠 INSIGHT
    // =========================

    // 🧠 AI SCORE (0–100)
let score = 100;

// smooth penalty dari ratio
score -= Math.min(50, ratio * 70);

// severity penalty (lebih ringan)
if (severity === "high") score -= 15;
if (severity === "medium") score -= 8;

// clamp
if (score < 0) score = 0;

    // ✅ BARU TARO DI SINI
const prevScore = 100;
const delta = score - prevScore;

    // =========================
    // 🧾 RESPONSE
    // =========================
   const totalIncome =
  allTx
    ?.filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0) ?? 0;
    
    const allocation = {
  essentials: totalIncome * 0.5,
  investment: totalIncome * 0.25,
  stability: totalIncome * 0.15,
  joy: totalIncome * 0.1,
};

    const allocationUsed = {
  essentials: categoryExpenseMap["food"] || 0,
  joy: categoryExpenseMap["entertainment"] || 0,
  stability: categoryExpenseMap["bills"] || 0,
  investment: 0 // nanti kita isi kalau ada
};

    const allocationLimit = {
  essentials: totalIncome * 0.5,
  investment: totalIncome * 0.25,
  stability: totalIncome * 0.15,
  joy: totalIncome * 0.1,
};

    let warnings: string[] = [];

if (allocationUsed.joy > allocationLimit.joy) {
  warnings.push("⚠️ Joy limit exceeded");
}

if (allocationUsed.essentials > allocationLimit.essentials) {
  warnings.push("⚠️ Essentials too high");
}

  const insight = {
  habitWarning,
  ratio,
  severity,
  mode,
  shouldBlock,
  score,
  delta,

  recommendation:
    severity === "high"
      ? "Reduce food spending this week"
      : severity === "medium"
      ? "Monitor food expenses"
      : "Spending is under control",

  // 🔥 TAMBAHAN BARU
  warnings,
  allocationUsed,
  allocationLimit,
};

return NextResponse.json({
  insight,          // 🔥 WAJIB
  parsed: data.parsed
});
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", detail: String(err) },
      { status: 500 }
    );
  }
}
