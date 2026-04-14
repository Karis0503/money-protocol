import { createActions } from "@/lib/engine/actions";
import { evaluateUser } from "@/lib/engine/runtime";
import { supabaseAdmin } from "@/lib/db/supabase";

export async function runDailyAutomationLoop() {
  const { data: users, error } = await supabaseAdmin.from("users").select("id");
  if (error) throw error;

  const execution = [];

  for (const user of users ?? []) {
    const result = await evaluateUser(user.id);
    await createActions(user.id, result.evaluation);

    execution.push({
      userId: user.id,
      blocked: result.evaluation.blocked,
      score: result.evaluation.score,
      warnings: result.evaluation.warnings,
      decisions: result.autonomous.decisions.slice(0, 3),
      messages: result.autonomous.messages.length
    });
  }

  return execution;
}
