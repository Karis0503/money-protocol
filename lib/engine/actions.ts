import { supabaseAdmin } from "@/lib/db/supabase";
import { EngineEvaluation } from "@/types/domain";

export async function createActions(userId: string, evaluation: EngineEvaluation) {
  const rows = evaluation.priorities.map((item) => ({
    user_id: userId,
    action_type: item.priority === "high" ? "critical" : item.priority === "medium" ? "primary" : "secondary",
    command: item.message,
    status: "pending"
  }));

  if (rows.length === 0) return;
  await supabaseAdmin.from("actions").insert(rows);
}
