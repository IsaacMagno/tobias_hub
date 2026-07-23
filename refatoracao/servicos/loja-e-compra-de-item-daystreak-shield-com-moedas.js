import { createAdminClient } from "@/lib/supabase/admin";
import { getChampionById } from "@/lib/services/champions";

export async function buyDaystreakShield(buyData) {
  const supabase = createAdminClient();
  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", buyData.itemId)
    .single();

  const champion = await getChampionById(buyData.id);

  if (champion.daystreakShield >= 3) {
    return { error: { message: "Campeão já tem 3 shields!" } };
  }

  const { error } = await supabase
    .from("champions")
    .update({
      daystreakShield: champion.daystreakShield + 1,
      tobiasCoins: champion.tobiasCoins - item.price,
    })
    .eq("id", buyData.id);

  if (error) throw error;
  return true;
}
