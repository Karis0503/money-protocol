import { Decision } from "@/types/domain";

const severityScore: Record<Decision["severity"], number> = {
  low: 1,
  medium: 2,
  high: 3
};

export function prioritizeDecisions(decisions: Decision[]): Decision[] {
  return [...decisions].sort((a, b) => {
    const scoreDiff = severityScore[b.severity] - severityScore[a.severity];
    if (scoreDiff !== 0) return scoreDiff;

    return b.command.length - a.command.length;
  });
}
