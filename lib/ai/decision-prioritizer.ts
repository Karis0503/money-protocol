import { Decision } from "@/types/domain";

const severityWeight: Record<Decision["severity"], number> = {
  low: 1,
  medium: 2,
  high: 3
};

function urgencyBoost(command: string): number {
  const lower = command.toLowerCase();
  if (lower.includes("today") || lower.includes("now")) return 2;
  if (lower.includes("stop") || lower.includes("freeze")) return 1;
  return 0;
}

export function prioritizeDecisions(decisions: Decision[]): Decision[] {
  return decisions
    .map((decision) => ({
      ...decision,
      priority_score: severityWeight[decision.severity] * 10 + urgencyBoost(decision.command)
    }))
    .sort((a, b) => b.priority_score - a.priority_score);
}
