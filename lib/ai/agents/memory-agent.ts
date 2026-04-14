import { AgentContext, ProtocolAgent } from "@/lib/ai/agents/types";
import { MemoryRecord } from "@/types/domain";

export const memoryAgent: ProtocolAgent = {
  id: "memory_agent",
  run(context: AgentContext) {
    const negativeBalance = context.state.balance < 0;
    const existing = context.memories.find((m) => m.key === "strict_mode_streak");
    const current = existing ? Number.parseInt(existing.value, 10) || 0 : 0;
    const nextValue = negativeBalance ? current + 1 : 0;

    const memory: MemoryRecord = {
      user_id: context.userId,
      memory_type: "short_term",
      key: "strict_mode_streak",
      value: String(nextValue),
      score: nextValue >= 3 ? 0.9 : 0.5
    };

    return {
      outboundMessages: [
        {
          to: "strategist_agent",
          type: "analysis",
          payload: `strict_mode_streak=${nextValue}`
        }
      ],
      insights: [
        {
          user_id: context.userId,
          kind: "habit",
          content: `Memory updated: strict_mode_streak=${nextValue}`,
          confidence: 0.95,
          agent: "memory_agent"
        }
      ],
      decisions: []
    };
  }
};
