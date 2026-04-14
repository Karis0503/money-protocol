import { Decision, FinancialState, Insight } from "@/types/domain";

export type AgentName = "state_builder" | "analysis_engine" | "decision_engine" | "warning_engine";

export interface AgentMessage {
  from: AgentName;
  to: AgentName | "orchestrator";
  topic: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AgentContext {
  userId: string;
  state: FinancialState;
  insights: Insight[];
  decisions: Decision[];
  memory: string[];
  mailbox: AgentMessage[];
}
