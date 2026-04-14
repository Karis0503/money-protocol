import { supabaseAdmin } from "@/lib/db/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId") ?? process.env.MONEY_PROTOCOL_DEFAULT_USER_ID;
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("actions")
    .select("id, action_type, command, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ actions: data ?? [] });
}
