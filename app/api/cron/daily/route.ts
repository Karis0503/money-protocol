import { runDailyAutomationLoop } from "@/lib/automation/daily-loop";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const execution = await runDailyAutomationLoop();
    return NextResponse.json({ ok: true, processed: execution.length, execution });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
