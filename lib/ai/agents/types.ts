import { Decision, FinancialState, Insight, MemoryRecord } from "@/types/domain";

export interface AgentContext {
  userId: string;
  state: FinancialState;
  memories: MemoryRecord[];
  sharedInsights: Insight[];
}

export interface AgentResult {
  insights?: Insight[];
  decisions?: Decision[];
  outboundMessages?: Array<{ to: string; type: "analysis" | "decision" | "warning"; payload: string }>;
}

export interface ProtocolAgent {
  id: string;
  run(context: AgentContext): AgentResult;
}
