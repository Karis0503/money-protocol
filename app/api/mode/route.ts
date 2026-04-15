import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: Request) {
  const { mode } = await request.json();

  await supabase
    .from("users")
    .update({ mode })
    .eq("id", DEFAULT_USER_ID);

  return NextResponse.json({ success: true });
}
