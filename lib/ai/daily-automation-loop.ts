import { runMoneyProtocolCycle } from "@/lib/ai/orchestrator";
import { supabaseAdmin } from "@/lib/db/supabase";

export async function runDailyAutomationLoop() {
  const { data: users, error } = await supabaseAdmin.from("users").select("id");
  if (error) throw error;

  const startedAt = new Date().toISOString();
  const results = [] as Array<{ userId: string; decisions: number; warnings: number; mailboxSize: number }>;

  for (const user of users ?? []) {
    const cycle = await runMoneyProtocolCycle(user.id);
    results.push({
      userId: user.id,
      decisions: cycle.decisions.length,
      warnings: cycle.warnings.length,
      mailboxSize: cycle.mailboxSize
    });
  }

  const finishedAt = new Date().toISOString();
  await supabaseAdmin.from("automation_runs").insert({
    started_at: startedAt,
    finished_at: finishedAt,
    users_processed: results.length,
    status: "completed",
    summary: results
  });

  return { startedAt, finishedAt, processed: results.length, results };
}
