import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log({
  amount,
  type,
  category,
  ratio,
  severity,
  score,
});

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body.text.toLowerCase();

    // =========================
    // 🧠 PARSE
    // =========================
    const isIncome = text.includes("gaji") || text.includes("income");

    const amountMatch = text.match(/\d+/);
    let amount = 0;

const num = text.match(/\d+/)?.[0];

if (num) {
  amount = parseInt(num);

  if (text.includes("jt") || text.includes("juta")) {
    amount *= 1_000_000;
  } else if (text.includes("k") || text.includes("rb")) {
    amount *= 1_000;
  }
}

   const category =
  text.includes("makan") || text.includes("minum")
    ? "food"
    : text.includes("game")
    ? "entertainment"
    : "other";

    const type = isIncome ? "income" : "expense";

    // =========================
    // 💾 SAVE
    // =========================
    await supabase.from("transactions").insert({
      user_id: DEFAULT_USER_ID,
      amount,
      type,
      category,
    });

    // =========================
    // 🧠 FETCH
    // =========================
    const { data: allTx } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", DEFAULT_USER_ID);

    const expenseTx = allTx?.filter((t) => t.type === "expense") ?? [];

    const totalExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);

    const foodExpense = expenseTx
      .filter((t) => t.category === "food")
      .reduce((sum, t) => sum + t.amount, 0);

    const ratio = totalExpense > 0 ? foodExpense / totalExpense : 0;

    let severity: "low" | "medium" | "high" = "low";

    if (ratio > 0.25) severity = "high";
    else if (ratio > 0.15) severity = "medium";

    const shouldBlock = severity === "high";

    // =========================
    // 🧠 SCORE
    // =========================
    let score = 100;
    score -= Math.min(50, ratio * 70);

    if (severity === "high") score -= 15;
    if (severity === "medium") score -= 8;

    if (score < 0) score = 0;

    // =========================
    // 🎭 TONE
    // =========================
    let tone = "calm";

    if (score >= 80) tone = "chill";
    else if (score >= 50) tone = "calm";
    else tone = "strict";

    // =========================
    // 🧠 AI
    // =========================
    const systemPrompt = `
Lu financial assistant.

Tone:
- chill → santai
- calm → biasa aja
- strict → tegas dikit

Sekarang tone: ${tone}
Score user: ${score}

Ngomong santai pakai bahasa Indonesia.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: body.text },
      ],
    });

    const aiReply =
      completion.choices?.[0]?.message?.content ||
      "Transaksi dicatat 👍";

    return NextResponse.json({
      parsed: { amount, type, category },
      insight: {
        score,
        severity,
        ratio,
        shouldBlock,
      },
      reply: aiReply,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal error", detail: String(err) },
      { status: 500 }
    );
  }
}
