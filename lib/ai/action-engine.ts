import { supabaseAdmin } from "@/lib/db/supabase";

export async function executeActions(userId: string, decisions: any[]) {
  if (!decisions || decisions.length === 0) return;

  const top = decisions[0];

  // simpan ke table actions
  await supabaseAdmin.from("actions").insert({
    user_id: userId,
    command: top.command,
    status: "pending"
  });

  return {
    message: top.command
  };
}
