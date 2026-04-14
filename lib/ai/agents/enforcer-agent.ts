import { AgentContext, ProtocolAgent } from "@/lib/ai/agents/types";

export const enforcerAgent: ProtocolAgent = {
  id: "enforcer_agent",
  run(context: AgentContext) {
    const strictMemory = context.memories.find((m) => m.key === "strict_mode_streak");
    const streak = strictMemory ? Number.parseInt(strictMemory.value, 10) || 0 : 0;

    if (context.state.balance < 0 && streak < 3) {
      return {
        outboundMessages: [
          {
            to: "memory_agent",
            type: "warning",
            payload: "Increase strict_mode_streak due to negative balance"
          }
        ]
      };
    }

    return {
      outboundMessages: [
        {
          to: "memory_agent",
          type: "warning",
          payload: "No strict escalation needed"
        }
      ]
    };
  }
};
