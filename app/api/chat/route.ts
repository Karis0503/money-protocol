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

    const isTransaction =
  /\d/.test(text) &&
  (
    text.includes("makan") ||
    text.includes("beli") ||
    text.includes("gaji") ||
    text.includes("topup") ||
    text.includes("bayar")
  );

    console.log("USER TEXT:", text);
    console.log("IS TRANSACTION:", isTransaction);

    // =========================
    // 💬 CHAT MODE
    // =========================
    if (!isTransaction) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Lu asisten keuangan santai. Ngobrol casual, pake bahasa Indonesia santai.",
          },
          {
            role: "user",
            content: body.text,
          },
        ],
      });

      const aiReply =
        completion.choices?.[0]?.message?.content ||
        "Ngomong aja santai, gw dengerin 😄";

      return NextResponse.json({
        insight: null,
        parsed: null,
        reply: aiReply,
      });
    }

    // =========================
    // 💰 TRANSACTION MODE
    // =========================
    const res = await fetch(
      `${new URL(request.url).origin}/api/transactions`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    return NextResponse.json({
      insight: data.insight,
      parsed: data.parsed,
      reply: data.reply || "Transaksi dicatat 👍",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", detail: String(err) },
      { status: 500 }
    );
  }
}
