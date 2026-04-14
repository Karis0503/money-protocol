import { evaluateUser } from "@/lib/engine/runtime";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId ?? process.env.MONEY_PROTOCOL_DEFAULT_USER_ID;
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    const runtime = await evaluateUser(userId);
    return NextResponse.json(runtime.evaluation);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
