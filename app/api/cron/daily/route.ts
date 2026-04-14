import { runDailyAutomationLoop } from "@/lib/ai/daily-automation-loop";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // DISABLE AUTH UNTUK TEST
// const secret = request.headers.get("x-cron-secret");
// if (secret !== process.env.CRON_SECRET) {
//   return new Response("Unauthorized", { status: 401 });
// }
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await runDailyAutomationLoop();
    return NextResponse.json({ ok: true, ...report });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
