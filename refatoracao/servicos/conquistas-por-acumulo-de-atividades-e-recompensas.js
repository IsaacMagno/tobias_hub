import { createAdminClient } from "@/lib/supabase/admin";
import { calculateLevel } from "@/lib/helpers/calculateLevel";
import { getChampionById } from "@/lib/services/champions";

const LEVEL_FACTOR = 35;

export async function getAllAchievements() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("achievements").select("*");
  if (error) throw error;
  return { achievements: data };
}

async function completeAchievementIfEligible(
  championId,
  list,
  statValue,
  completedIds
) {
  const supabase = createAdminClient();
  let completedAny = false;

  for (const achievement of list || []) {
    if (statValue < achievement.goal) continue;
    if (completedIds.has(achievement.id)) continue;

    const rewards =
      typeof achievement.rewards === "string"
        ? JSON.parse(achievement.rewards)
        : achievement.rewards;

    const champion = await getChampionById(championId);
    const xpBoost = rewards.xp * (champion.xpBoost / 100);
    const updatedXp =
      parseFloat(champion.xp) + parseFloat(rewards.xp) + parseFloat(xpBoost);
    const level = calculateLevel(updatedXp, LEVEL_FACTOR);

    await supabase
      .from("champions")
      .update({
        xp: updatedXp,
        level,
        tobiasCoins: (champion.tobiasCoins || 0) + rewards.tobiasCoins,
        achievementPoints:
          (champion.achievementPoints || 0) + rewards.achievementPoints,
      })
      .eq("id", championId);

    await supabase.from("achievementscompleted").insert({
      champion_id: championId,
      achievement_id: achievement.id,
      date: new Date().toISOString().slice(0, 10),
    });

    completedIds.add(achievement.id);
    completedAny = true;
  }

  return completedAny;
}

export async function updateAchievementByLink(championId, stats) {
  const supabase = createAdminClient();

  const { data: completedRows } = await supabase
    .from("achievementscompleted")
    .select("achievement_id")
    .eq("champion_id", championId);

  const completedIds = new Set(
    (completedRows ?? []).map((row) => row.achievement_id)
  );

  let completedAny = false;

  if (stats === "wisdom") {
    const { data: statistics, error } = await supabase
      .from("statistics")
      .select("*")
      .eq("champion_id", championId)
      .maybeSingle();

    if (error || !statistics) return false;

    const total = ["strength", "agility", "inteligence", "vitality", "wisdom"]
      .reduce((sum, key) => sum + (Number(statistics[key]) || 0), 0);

    const { data: list } = await supabase
      .from("achievements")
      .select("*")
      .eq("link", "wisdom");

    completedAny =
      (await completeAchievementIfEligible(
        championId,
        list,
        total,
        completedIds
      )) || completedAny;

    return completedAny;
  }

  const { data: activities, error: activitiesError } = await supabase
    .from("activities")
    .select("*")
    .eq("champion_id", championId)
    .single();

  if (activitiesError || !activities) return false;

  const statValue = activities[stats];
  const { data: list } = await supabase
    .from("achievements")
    .select("*")
    .eq("link", stats);

  completedAny =
    (await completeAchievementIfEligible(
      championId,
      list,
      statValue,
      completedIds
    )) || completedAny;

  const { data: wisdomList } = await supabase
    .from("achievements")
    .select("*")
    .eq("link", "wisdom");

  if (wisdomList?.length) {
    const { data: statistics } = await supabase
      .from("statistics")
      .select("*")
      .eq("champion_id", championId)
      .maybeSingle();

    if (statistics) {
      const total = ["strength", "agility", "inteligence", "vitality", "wisdom"]
        .reduce((sum, key) => sum + (Number(statistics[key]) || 0), 0);

      completedAny =
        (await completeAchievementIfEligible(
          championId,
          wisdomList,
          total,
          completedIds
        )) || completedAny;
    }
  }

  return completedAny;
}
