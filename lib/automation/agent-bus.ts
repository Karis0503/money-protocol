import { supabaseAdmin } from "@/lib/db/supabase";
import { AgentMessage } from "@/types/domain";

export async function publishAgentMessages(messages: AgentMessage[]) {
  if (messages.length === 0) return;
  const { error } = await supabaseAdmin.from("agent_messages").insert(messages);
  if (error) throw error;
}
