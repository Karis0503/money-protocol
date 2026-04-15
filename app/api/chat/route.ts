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
    const insight = {
      ratio,
      severity,
      mode,
      shouldBlock,
      recommendation:
        severity === "high"
          ? "Reduce food spending this week"
          : severity === "medium"
          ? "Monitor food expenses"
          : "Spending is under control"
    };

    // =========================
    // 🧾 RESPONSE
    // =========================
    return NextResponse.json({
      parsed: data.parsed,
      insight,
      message: [
        `Recorded ${data.parsed.type} ${data.parsed.amount} in ${data.parsed.category}.`,
        `Food ratio: ${(ratio * 100).toFixed(0)}%`,
        `Severity: ${severity.toUpperCase()}`,
        `Mode: ${mode}`,
        shouldBlock
          ? "🚫 Action: STOP ORDERING FOOD"
          : "✅ Allowed",
        `Agent messages: ${data.mailboxSize ?? 0}`
      ].join("\n")
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", detail: String(err) },
      { status: 500 }
    );
  }
}
