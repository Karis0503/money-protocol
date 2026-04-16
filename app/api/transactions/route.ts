import { runMoneyProtocolCycle } from "@/lib/ai/orchestrator";
import { parseChatTransaction } from "@/lib/core/parser";
import { supabaseAdmin } from "@/lib/db/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId ?? process.env.MONEY_PROTOCOL_DEFAULT_USER_ID;
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    const parsed = parseChatTransaction(body.text ?? "");
    if (!parsed.amount || parsed.amount <= 0) {
      return NextResponse.json({ error: "Unable to parse transaction amount" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      amount: parsed.amount,
      type: parsed.type,
      category: parsed.category,
      source_text: parsed.source_text
    });

    if (error) throw error;

    const result = await runMoneyProtocolCycle(userId);
    return NextResponse.json({ parsed, ...result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


    // =========================
    // 🧠 AMBIL TRANSAKSI USER
    // =========================
    const { data: allTx } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", DEFAULT_USER_ID);

       }

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

    // =========================
// 🎭 TONE SYSTEM (TARO DI SINI)
// =========================
let tone = "calm";

if (insight.score >= 80) {
  tone = "chill";
} else if (insight.score >= 50) {
  tone = "calm";
} else {
  tone = "strict";
}

    // =========================
// 🧠 AI SYSTEM PROMPT
// =========================
const systemPrompt = `
You are a personal finance AI assistant.

Tone rules:
- chill → santai, friendly, kayak temen
- calm → normal, simple
- strict → tegas, agak nyindir dikit tapi masih bantu
Always respond in casual Indonesian language.
Use slang like: gw, lo, santai, dll.

Current tone: ${tone}

User condition:
- Score: ${insight.score}
- Severity: ${insight.severity}

Speak Indonesian casual.
Short, natural, human-like.
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
  "Gw dengerin kok, tapi belum kebaca jelas. Coba jelasin dikit lagi ya.";

return NextResponse.json({
  insight,
  parsed: data.parsed,
  reply: aiReply,
});
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", detail: String(err) },
      { status: 500 }
    );
  }
}

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

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body.text.toLowerCase();

    // =========================
    // 🧠 PARSE TRANSAKSI
    // =========================
    const isIncome = text.includes("gaji") || text.includes("income");

    const amountMatch = text.match(/\d+/);
    const amount = amountMatch ? parseInt(amountMatch[0]) * 1000 : 0;

    const category = text.includes("makan")
      ? "food"
      : text.includes("game")
      ? "entertainment"
      : "other";

    const type = isIncome ? "income" : "expense";

    // =========================
    // 💾 SAVE KE DB
    // =========================
    await supabase.from("transactions").insert({
      user_id: DEFAULT_USER_ID,
      amount,
      type,
      category,
    });

    // =========================
    // 🧠 AMBIL SEMUA TRANSAKSI
    // =========================
    const { data: allTx } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", DEFAULT_USER_ID);

    // =========================
    // 🧠 SCORING
    // =========================
    const expenseTx = allTx?.filter((t) => t.type === "expense") ?? [];

    const totalExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);

    const foodExpense = expenseTx
      .filter((t) => t.category === "food")
      .reduce((sum, t) => sum + t.amount, 0);

    const ratio = totalExpense > 0 ? foodExpense / totalExpense : 0;

    let severity: "low" | "medium" | "high" = "low";

    if (ratio > 0.25) severity = "high";
    else if (ratio > 0.15) severity = "medium";

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
    // 🧠 AI PROMPT
    // =========================
    const systemPrompt = `
Lu financial assistant.

Tone:
- chill → santai
- calm → normal
- strict → tegas dikit

Sekarang tone: ${tone}

Score user: ${score}
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

    // =========================
    // 📤 RESPONSE
    // =========================
    return NextResponse.json({
      parsed: { amount, type, category },
      insight: {
        score,
        severity,
        ratio,
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
