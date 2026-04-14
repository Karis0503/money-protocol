import { createActions } from "@/lib/engine/actions";
import { applyIncomeAllocation, evaluateUser } from "@/lib/engine/runtime";
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

    const allocation = parsed.type === "income" ? await applyIncomeAllocation(userId, parsed.amount) : [];
    const runtime = await evaluateUser(userId);
    await createActions(userId, runtime.evaluation);

    return NextResponse.json({ parsed, allocation, ...runtime });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
