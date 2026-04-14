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

  const topDecision = data.decisions?.[0];

  return NextResponse.json({
    message: [
      `Recorded ${data.parsed.type} ${data.parsed.amount} in ${data.parsed.category}.`,
      `Top Command [P${topDecision?.priority_rank ?? "-"}]: ${topDecision?.command ?? "No command generated"}`,
      `Reason: ${topDecision?.reason ?? "No reason"}`,
      `Agent messages this cycle: ${data.mailboxSize ?? 0}`
    ].join("\n")
  });
}
