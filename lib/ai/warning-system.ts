import { Decision } from "@/types/domain";

export function buildWarnings(decisions: Decision[]): string[] {
  return decisions
    .filter((d) => d.severity !== "low")
    .map((d) => `[${d.severity.toUpperCase()}] ${d.command}: ${d.reason}`);
}
