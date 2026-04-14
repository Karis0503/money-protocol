import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${new URL(request.url).origin}/api/transactions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const topPriority = data.evaluation?.priorities?.[0];
  const command = topPriority?.message ?? data.evaluation?.suggestions?.[0] ?? "No command generated";
  const warning = data.evaluation?.warnings?.[0] ?? "No warnings";

  return NextResponse.json({
    message: [
      `Recorded ${data.parsed.type} ${data.parsed.amount} in ${data.parsed.category}.`,
      `Priority: ${topPriority?.priority ?? "low"}`,
      `Command: ${command}`,
      `Warning: ${warning}`,
      `Score: ${data.evaluation?.score ?? "n/a"}`
    ].join("\n"),
    warnings: data.evaluation?.warnings ?? [],
    priorities: data.evaluation?.priorities ?? []
  });
}
