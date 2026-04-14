import { supabaseAdmin } from "@/lib/db/supabase";

const MAX_MEMORY_ITEMS = 20;

export async function loadAgentMemory(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("memory")
    .select("key, value, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_MEMORY_ITEMS);

  if (error) throw error;

  return (data ?? []).map((row) => `${row.key}: ${row.value}`);
}

export async function storeMemoryEntries(
  userId: string,
  entries: Array<{ key: string; value: string; source: string }>
): Promise<void> {
  if (entries.length === 0) return;

  const payload = entries.map((entry) => ({
    user_id: userId,
    key: entry.key,
    value: entry.value,
    source: entry.source
  }));

  const { error } = await supabaseAdmin.from("memory").insert(payload);
  if (error) throw error;
}
