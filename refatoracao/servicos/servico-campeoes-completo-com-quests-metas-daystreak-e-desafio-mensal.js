import moment from "moment";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateLevel } from "@/lib/helpers/calculateLevel";

const TIMEZONE = process.env.TIMEZONE || "America/Sao_Paulo";
const LEVEL_FACTOR = 35;
const DAILY_XP_INCREMENT = 25;

const CHAMPION_SELECT = `
  *,
  statistics(*),
  activities(*),
  files(*),
  goals(*),
  achievementscompleted(*),
  quests(*),
  monthlychallenge(*)
`;

function normalizeOne(value) {
  if (value == null) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function attachMonthlyChallenge(champion) {
  if (!champion) return champion;
  champion.monthlyChallenge = normalizeOne(
    champion.monthlyChallenge ?? champion.monthlychallenge
  );
  return champion;
}

export async function getChampionByIdFull(id) {
  const championId = Number(id);
  if (!championId || Number.isNaN(championId)) {
    throw new Error("ID do campeão inválido");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("champions")
    .select(CHAMPION_SELECT)
    .eq("id", championId)
    .single();

  if (error) throw error;

  data.statistics = normalizeOne(data.statistics);
  data.activities = normalizeOne(data.activities);
  data.files = normalizeOne(data.files);
  attachMonthlyChallenge(data);

  if (Array.isArray(data.goals)) data.goal = data.goals;
  else if (data.goals) data.goal = [data.goals].flat();

  return data;
}

export async function getChampionById(id) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("champions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getAllChampionsMonthlyChallenge() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("champions")
    .select("*, monthlychallenge(*)");

  if (error) throw error;
  return (data ?? []).map(attachMonthlyChallenge);
}

export async function updateChampionBiography(id, bio) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("champions")
    .update({ biography: bio })
    .eq("id", id);

  if (error) throw error;
  return getChampionById(id);
}

export async function updateChampionExp(id, championExp) {
  const actual = await getChampionById(id);
  const xpBoost = championExp.xp * (actual.xpBoost / 100);
  const updatedXp =
    parseFloat(actual.xp) + parseFloat(championExp.xp) + parseFloat(xpBoost);
  const level = calculateLevel(updatedXp, LEVEL_FACTOR);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("champions")
    .update({ xp: updatedXp, level })
    .eq("id", id);

  if (error) throw error;
  return getChampionById(id);
}

async function updateDaystreakAndShield(id, daystreak, shield, today) {
  const supabase = createAdminClient();
  await supabase
    .from("champions")
    .update({
      daystreak,
      daystreakShield: shield,
      lastDaystreakUpdate: today.toISOString(),
    })
    .eq("id", id);
}

function calculateDaystreaks(daystreak, daystreakShield, diff) {
  let newDaystreak = daystreak;
  let newDaystreakShield = daystreakShield;

  if (daystreakShield === 0) {
    newDaystreak = 1;
  } else if (diff === daystreakShield) {
    newDaystreakShield = 1;
    newDaystreak += 1;
  } else if (diff > daystreakShield) {
    newDaystreakShield = 0;
    newDaystreak = 1;
  } else {
    newDaystreakShield -= diff - 1;
    newDaystreak += 1;
  }

  return { newDaystreak, newDaystreakShield };
}

export async function updateChampionDaystreak(id) {
  const supabase = createAdminClient();

  const { data: stat } = await supabase
    .from("statistics")
    .select("wisdom")
    .eq("champion_id", id)
    .single();

  const champion = await getChampionById(id);
  const today = moment().tz(TIMEZONE).startOf("day");
  const lastUpdate = moment(champion.lastDaystreakUpdate).tz(TIMEZONE).startOf("day");
  const diff = today.diff(lastUpdate, "days");

  if (!lastUpdate.isSame(today, "day")) {
    await updateChampionExp(id, { xp: DAILY_XP_INCREMENT });
  }

  if (diff > 1) {
    const updated = calculateDaystreaks(
      champion.daystreak,
      champion.daystreakShield,
      diff
    );
    await updateDaystreakAndShield(
      id,
      updated.newDaystreak,
      updated.newDaystreakShield,
      today
    );
  } else if (!lastUpdate.isSame(today, "day")) {
    await supabase
      .from("champions")
      .update({
        daystreak: champion.daystreak + 1,
        lastDaystreakUpdate: today.toISOString(),
      })
      .eq("id", id);
  }

  const { handleUpdateExpBoost } = await import("@/lib/helpers/statsRefactor");
  const refreshed = await getChampionById(id);
  await handleUpdateExpBoost(id, stat?.wisdom, refreshed.daystreak);

  return getChampionById(id);
}
