import { AgentMessage } from "@/lib/ai/agents/types";
import { Decision } from "@/types/domain";

export function buildWarnings(decisions: Decision[], mailbox: AgentMessage[] = []): string[] {
  const warnings = decisions
    .filter((d) => d.severity !== "low")
    .map((d) => `[${d.severity.toUpperCase()}] ${d.command}: ${d.reason}`);

  if (mailbox.length > 0) {
    warnings.unshift(`[NETWORK] ${mailbox.length} agent-to-agent messages processed.`);
  }

  return warnings;
}
