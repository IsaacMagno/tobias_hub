import { createAdminClient } from "@/lib/supabase/admin";

export async function getStatsDetailsById(championId) {
  const id = Number(championId);
  if (!id || Number.isNaN(id)) {
    return { statsDetails: null, statsDetailsFromId: null };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("StatsDetails")
    .select("*")
    .eq("champion_id", id)
    .maybeSingle();

  if (error) throw error;
  return { statsDetails: data, statsDetailsFromId: data };
}
