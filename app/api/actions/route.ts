import { supabaseAdmin } from "@/lib/db/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data } = await supabaseAdmin
    .from("actions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json(data);
}
