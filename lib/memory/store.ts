import { supabaseAdmin } from "@/lib/db/supabase";
import { MemoryRecord } from "@/types/domain";

export async function getUserMemories(userId: string): Promise<MemoryRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("memories")
    .select("user_id, memory_type, key, value, score")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as MemoryRecord[];
}

export async function upsertMemory(memory: MemoryRecord) {
  const { error } = await supabaseAdmin.from("memories").upsert(memory, {
    onConflict: "user_id,key"
  });

  if (error) throw error;
}
