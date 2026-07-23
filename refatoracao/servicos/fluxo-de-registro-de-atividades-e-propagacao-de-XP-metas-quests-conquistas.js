import { createAdminClient } from "@/lib/supabase/admin";
import { statsRefactor } from "@/lib/helpers/statsRefactor";
import {
  getChampionById,
  getChampionByIdFull,
  updateChampionDaystreak,
  updateChampionExp,
} from "@/lib/services/champions";
import { updateGoalByLink } from "@/lib/services/goals";
import {
  updateQuestByLink,
  updateMonthlyChallengeByLink,
} from "@/lib/services/quests";
import { updateAchievementByLink } from "@/lib/services/achievements";

const expBase = {
  kmRun: 150,
  jumpRope: 0.5,
  kmBike: 50,
  upperLimb: 2,
  abs: 2,
  lowerLimb: 3.5,
  meals: 25,
  drinks: 5,
  sleep: 1.5,
  study: 200,
  meditation: 1000,
  reading: 300,
};

const activitiesDivision = {
  kmRun: 5,
  jumpRope: 1800,
  kmBike: 20,
  upperLimb: 300,
  abs: 500,
  lowerLimb: 300,
  study: 5,
  meditation: 1,
  reading: 3,
  meals: 8,
  drinks: 10,
  sleep: 240,
};

const statsDetailsKeys = {
  study: "intFromStudy",
  meditation: "intFromMeditation",
  reading: "intFromReading",
  upperLimb: "strFromUpper",
  lowerLimb: "strFromLower",
  abs: "strFromAbs",
  jumpRope: "dexFromRope",
  kmBike: "dexFromBike",
  kmRun: "dexFromRun",
  meals: "conFromMeals",
  drinks: "conFromDrinks",
  sleep: "conFromSleep",
};

export async function findActivityById(championId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("champion_id", championId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getDailyActivitiesById(championId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("DailyActivities")
    .select("*")
    .eq("champion_id", championId);

  if (error) throw error;
  return data;
}

async function handleUpdateExpAndDaystreak(id, stats, value) {
  const xp = expBase[stats] * value;
  await updateChampionExp(id, { xp });
  await updateChampionDaystreak(id);
}

async function updateDailyActivities(championId, stats, value) {
  const supabase = createAdminClient();
  const date = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("DailyActivities")
    .select("*")
    .eq("champion_id", championId)
    .eq("date", date)
    .maybeSingle();

  if (!existing) {
    await supabase.from("DailyActivities").insert({
      champion_id: championId,
      date,
      [stats]: parseFloat(value),
    });
    return;
  }

  const current = parseFloat(existing[stats] || 0);
  await supabase
    .from("DailyActivities")
    .update({ [stats]: current + parseFloat(value) })
    .eq("id", existing.id);
}

const intensityMultipliers = {
  alta: (v) => v * 2,
  media: (v) => v * 1.5,
  baixa: (v) => v,
};

export async function updateActivitiesIntensity(
  championId,
  stats,
  value,
  intensity
) {
  const supabase = createAdminClient();
  const { data: old, error } = await supabase
    .from("activitiesintensity")
    .select("*")
    .eq("champion_id", championId)
    .single();

  if (error || !old) throw new Error("Intensidade não encontrada");

  const calc = intensityMultipliers[intensity];
  if (!calc) throw new Error("Intensidade inválida");

  const updatedValue = calc(value);
  const newVal = parseFloat(updatedValue) + parseFloat(old[stats] || 0);

  await supabase
    .from("activitiesintensity")
    .update({ [stats]: newVal })
    .eq("champion_id", championId);

  const { data: updated } = await supabase
    .from("activitiesintensity")
    .select("*")
    .eq("champion_id", championId)
    .single();

  const statsKeys = Object.keys(updated).filter(
    (k) => k !== "id" && k !== "champion_id"
  );

  for (const stat of statsKeys) {
    const key = statsDetailsKeys[stat];
    if (!key) continue;
    const val = updated[stat] / activitiesDivision[stat];
    await supabase
      .from("StatsDetails")
      .update({ [key]: val })
      .eq("champion_id", championId);
  }

  return updated;
}

export async function updateActivities(championId, stats, value) {
  const old = await findActivityById(championId);
  if (!old) throw new Error("Atividades não encontradas");

  const newVal = parseFloat(value) + parseFloat(old[stats] || 0);
  const supabase = createAdminClient();

  await supabase
    .from("activities")
    .update({ [stats]: newVal })
    .eq("champion_id", championId);

  await handleUpdateExpAndDaystreak(championId, stats, value);
  await updateDailyActivities(championId, stats, value);

  return findActivityById(championId);
}

export async function updateActivityFlow(championId, body) {
  const statKey = Object.keys(body).find((k) => k !== "activitieIntensity");
  const value = body[statKey];
  const activitieIntensity = body.activitieIntensity;

  await updateActivities(championId, statKey, value);
  const intensityRow = await updateActivitiesIntensity(
    championId,
    statKey,
    value,
    activitieIntensity
  );

  await updateGoalByLink(championId, statKey, value);
  await updateQuestByLink(championId, statKey, value);
  await updateMonthlyChallengeByLink(championId, statKey, value);

  const achievementCompleted = await updateAchievementByLink(
    championId,
    statKey
  );

  const supabase = createAdminClient();
  const { data: actualStats } = await supabase
    .from("statistics")
    .select("*")
    .eq("champion_id", championId);

  const valuesToUpdate = await statsRefactor(
    { ...intensityRow, id: championId },
    actualStats,
    championId
  );

  for (const [stat, val] of Object.entries(valuesToUpdate)) {
    await supabase
      .from("statistics")
      .update({ [stat]: val })
      .eq("champion_id", championId);
  }

  const championUpdated = await getChampionByIdFull(championId);
  return { championUpdated, achievementCompleted };
}
