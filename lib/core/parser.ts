import { z } from "zod";

const chatInputSchema = z.string().min(1);

const categoryMap: Record<string, string> = {
  makan: "food",
  food: "food",
  gaji: "salary",
  salary: "salary",
  transport: "transport",
  bensin: "transport",
  kopi: "coffee"
};

function parseAmount(raw: string): number {
  const lower = raw.toLowerCase().trim();
  const tokens = lower.split(/\s+/);
  const amountToken = tokens.find((t) => /\d/.test(t));
  if (!amountToken) return 0;

  const normalized = amountToken.replace(/[^\d.,]/g, "").replace(/,/g, ".");
  const base = Number.parseFloat(normalized);
  if (Number.isNaN(base)) return 0;

  if (lower.includes("juta")) return Math.round(base * 1_000_000);
  if (lower.includes("rb") || lower.includes("ribu") || lower.endsWith("k")) return Math.round(base * 1_000);
  return Math.round(base);
}

export function parseChatTransaction(input: string) {
  const safe = chatInputSchema.parse(input);
  const lower = safe.toLowerCase();

  const type = /gaji|salary|bonus|masuk/.test(lower) ? "income" : "expense";
  const amount = parseAmount(lower);
  const category = Object.keys(categoryMap).find((key) => lower.includes(key));

  return {
    type,
    amount,
    category: category ? categoryMap[category] : type === "income" ? "other_income" : "other_expense",
    source_text: safe
  };
}
