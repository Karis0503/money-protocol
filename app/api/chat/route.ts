import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: Request) {
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

  const topDecision = data.decisions?.[0];

  // =========================
  // 🧠 HITUNG TOTAL
  // =========================
  const { data: allTx } = await supabase
    .from("transactions")
    .select("*");

  const totalExpense =
    allTx
      ?.filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;

  const foodExpense =
    allTx
      ?.filter((t) => t.category === "food")
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;

  const ratio = totalExpense > 0 ? foodExpense / totalExpense : 0;

  // =========================
  // 🎯 SEVERITY
  // =========================
  let severity = "low";

  if (ratio > 0.25 && foodExpense > 200000) {
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
  // ❄️ COOLDOWN SYSTEM
  // =========================
  const { data: lastAction } = await supabase
    .from("actions")
    .select("*")
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

  if (mode === "strict") {
    shouldBlock = severity === "high";
  }

  if (mode === "brutal") {
    shouldBlock = severity === "medium" || severity === "high";
  }

  // =========================
  // 🚫 INSERT ACTION (BLOCK)
  // =========================
  if (shouldInsert && shouldBlock) {
    await supabase.from("actions").insert({
      user_id: DEFAULT_USER_ID,
      command: "Stop ordering food",
      status: "pending"
    });
  }

  // =========================
  // 💾 SAVE DECISION
  // =========================
  await supabase.from("decisions").insert({
    user_id: DEFAULT_USER_ID,
    severity,
    reason: `Food ratio ${(ratio * 100).toFixed(0)}%`,
    category: "food",
    action: "stop ordering food"
  });

  // =========================
  // 🧾 RESPONSE
  // =========================
  return NextResponse.json({
     parsed: data.parsed,
     insight: {
    ratio,
    severity,
    mode,
  },
    message: [
      `Recorded ${data.parsed.type} ${data.parsed.amount} in ${data.parsed.category}.`,
      `Food ratio: ${(ratio * 100).toFixed(0)}%`,
      `Severity: ${severity.toUpperCase()}`,
      `Mode: ${mode}`,
      shouldBlock ? "🚫 Action: STOP ORDERING FOOD" : "✅ Allowed",
      `Agent messages: ${data.mailboxSize ?? 0}`
    ].join("\n")
  });
}
