/**
 * Streaks personalizadas privadas por campeão.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import {
  dateKeyInTz,
  computeStreakStats,
  isMarkedToday,
  clampShields,
  shieldsEarnedForStreak,
  MAX_SHIELDS,
} from "@/lib/helpers/habitStreak";

const STREAK_SELECT = `
  id,
  champion_id,
  title,
  kind,
  emoji,
  current_streak,
  best_streak,
  last_log_date,
  shields,
  created_at,
  updated_at
`;

async function getOwnedStreak(championId, streakId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("habit_streaks")
    .select(STREAK_SELECT)
    .eq("id", streakId)
    .eq("champion_id", championId)
    .single();

  if (error || !data) {
    throw new Error("Sequência não encontrada");
  }
  return data;
}

async function fetchLogDates(streakId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("habit_streak_logs")
    .select("log_date")
    .eq("streak_id", streakId)
    .order("log_date", { ascending: true });

  if (error) throw error;
  return (data || []).map((r) =>
    typeof r.log_date === "string" ? r.log_date.slice(0, 10) : r.log_date
  );
}

async function fetchShieldGaps(streakId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("habit_streak_shield_gaps")
    .select("gap_date")
    .eq("streak_id", streakId)
    .order("gap_date", { ascending: true });

  if (error) throw error;
  return (data || []).map((r) =>
    typeof r.gap_date === "string" ? r.gap_date.slice(0, 10) : r.gap_date
  );
}

async function fetchLogsAndShieldsBatch(streakIds) {
  if (!streakIds.length) {
    return { logs: {}, shields: {} };
  }
  const supabase = createAdminClient();
  const [logsRes, shieldsRes] = await Promise.all([
    supabase
      .from("habit_streak_logs")
      .select("streak_id, log_date")
      .in("streak_id", streakIds)
      .order("log_date", { ascending: true }),
    supabase
      .from("habit_streak_shield_gaps")
      .select("streak_id, gap_date")
      .in("streak_id", streakIds)
      .order("gap_date", { ascending: true }),
  ]);

  if (logsRes.error) throw logsRes.error;
  if (shieldsRes.error) throw shieldsRes.error;

  const logs = {};
  const shields = {};
  for (const row of logsRes.data || []) {
    if (!logs[row.streak_id]) logs[row.streak_id] = [];
    const key =
      typeof row.log_date === "string"
        ? row.log_date.slice(0, 10)
        : row.log_date;
    logs[row.streak_id].push(key);
  }
  for (const row of shieldsRes.data || []) {
    if (!shields[row.streak_id]) shields[row.streak_id] = [];
    const key =
      typeof row.gap_date === "string"
        ? row.gap_date.slice(0, 10)
        : row.gap_date;
    shields[row.streak_id].push(key);
  }
  return { logs, shields };
}

async function syncStreakCounts(streakId) {
  const logDates = await fetchLogDates(streakId);
  const existingShieldGaps = await fetchShieldGaps(streakId);
  const todayKey = dateKeyInTz();

  const supabase = createAdminClient();
  const { data: row, error: rowErr } = await supabase
    .from("habit_streaks")
    .select("shields")
    .eq("id", streakId)
    .single();
  if (rowErr) throw rowErr;

  let shieldsBalance = clampShields(row.shields ?? 1);

  const { current, best, shieldsToApply } = computeStreakStats(
    logDates,
    todayKey,
    { shieldGaps: existingShieldGaps, shieldsBalance }
  );

  const newGaps = shieldsToApply.filter(
    (g) => !existingShieldGaps.includes(g)
  );
  if (newGaps.length) {
    await supabase.from("habit_streak_shield_gaps").insert(
      newGaps.map((gap_date) => ({ streak_id: streakId, gap_date }))
    );
    shieldsBalance = clampShields(shieldsBalance - newGaps.length);
  }

  const earned = shieldsEarnedForStreak(current);
  const targetShields = clampShields(Math.max(shieldsBalance, earned));
  if (targetShields !== shieldsBalance) {
    shieldsBalance = targetShields;
  }

  const lastLogDate = logDates.length ? logDates[logDates.length - 1] : null;

  const { data, error } = await supabase
    .from("habit_streaks")
    .update({
      current_streak: current,
      best_streak: best,
      last_log_date: lastLogDate,
      shields: shieldsBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", streakId)
    .select(STREAK_SELECT)
    .single();

  if (error) throw error;
  return data;
}

async function fetchCampaignLinks(streakIds) {
  if (!streakIds.length) return {};
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("habit_streak_campaigns")
    .select("streak_id, campaign_id, campaigns(id, title)")
    .in("streak_id", streakIds);

  if (error) throw error;

  const map = {};
  for (const row of data || []) {
    const sid = row.streak_id;
    if (!map[sid]) map[sid] = [];
    const camp = row.campaigns;
    if (camp) {
      map[sid].push({ id: camp.id, title: camp.title });
    }
  }
  return map;
}

function enrichStreak(
  row,
  campaignMap,
  todayKey,
  logDates = [],
  shieldGaps = []
) {
  const campaigns = campaignMap[row.id] || [];
  const markedToday = isMarkedToday(row.last_log_date, todayKey);
  return {
    ...row,
    shields: clampShields(row.shields ?? 1),
    markedToday,
    campaigns,
    campaignIds: campaigns.map((c) => c.id),
    logDates,
    shieldGaps,
  };
}

export async function listMyStreaks(championId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("habit_streaks")
    .select(STREAK_SELECT)
    .eq("champion_id", championId)
    .order("current_streak", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const rows = data || [];
  const ids = rows.map((r) => r.id);

  await Promise.all(ids.map((id) => syncStreakCounts(id)));

  const { data: refreshed, error: refreshErr } = await supabase
    .from("habit_streaks")
    .select(STREAK_SELECT)
    .eq("champion_id", championId)
    .order("current_streak", { ascending: false })
    .order("updated_at", { ascending: false });

  if (refreshErr) throw refreshErr;

  const freshRows = refreshed || [];
  const freshIds = freshRows.map((r) => r.id);
  const campaignMap = await fetchCampaignLinks(freshIds);
  const { logs, shields } = await fetchLogsAndShieldsBatch(freshIds);
  const todayKey = dateKeyInTz();

  return freshRows.map((row) =>
    enrichStreak(
      row,
      campaignMap,
      todayKey,
      logs[row.id] || [],
      shields[row.id] || []
    )
  );
}

export async function createStreak(championId, { title, kind = "build", emoji = null }) {
  const trimmed = String(title || "").trim();
  if (!trimmed) throw new Error("Nome da sequência é obrigatório");

  const normalizedKind = kind === "break" ? "break" : "build";

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("habit_streaks")
    .insert({
      champion_id: championId,
      title: trimmed,
      kind: normalizedKind,
      emoji: emoji ? String(emoji).trim().slice(0, 32) : null,
      shields: 1,
    })
    .select(STREAK_SELECT)
    .single();

  if (error) throw error;
  return enrichStreak(data, {}, dateKeyInTz(), [], []);
}

export async function updateStreak(championId, streakId, patch = {}) {
  await getOwnedStreak(championId, streakId);

  const updates = { updated_at: new Date().toISOString() };
  if (patch.title != null) {
    const trimmed = String(patch.title).trim();
    if (!trimmed) throw new Error("Nome da sequência é obrigatório");
    updates.title = trimmed;
  }
  if (patch.kind != null) {
    updates.kind = patch.kind === "break" ? "break" : "build";
  }
  if (patch.emoji != null) {
    updates.emoji = patch.emoji ? String(patch.emoji).trim().slice(0, 32) : null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("habit_streaks")
    .update(updates)
    .eq("id", streakId)
    .eq("champion_id", championId)
    .select(STREAK_SELECT)
    .single();

  if (error) throw error;

  const campaignMap = await fetchCampaignLinks([streakId]);
  const logDates = await fetchLogDates(streakId);
  const shieldGaps = await fetchShieldGaps(streakId);
  return enrichStreak(data, campaignMap, dateKeyInTz(), logDates, shieldGaps);
}

export async function deleteStreak(championId, streakId) {
  await getOwnedStreak(championId, streakId);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("habit_streaks")
    .delete()
    .eq("id", streakId)
    .eq("champion_id", championId);

  if (error) throw error;
  return { ok: true };
}

export async function markStreakDay(
  championId,
  streakId,
  { source = "manual" } = {}
) {
  await getOwnedStreak(championId, streakId);

  const todayKey = dateKeyInTz();
  const normalizedSource = source === "campaign" ? "campaign" : "manual";

  const supabase = createAdminClient();
  const { error } = await supabase.from("habit_streak_logs").upsert(
    {
      streak_id: streakId,
      log_date: todayKey,
      source: normalizedSource,
    },
    { onConflict: "streak_id,log_date", ignoreDuplicates: true }
  );

  if (error) throw error;

  const updated = await syncStreakCounts(streakId);
  const campaignMap = await fetchCampaignLinks([streakId]);
  const logDates = await fetchLogDates(streakId);
  const shieldGaps = await fetchShieldGaps(streakId);
  return enrichStreak(updated, campaignMap, todayKey, logDates, shieldGaps);
}

export async function unmarkStreakDay(championId, streakId) {
  await getOwnedStreak(championId, streakId);

  const todayKey = dateKeyInTz();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("habit_streak_logs")
    .delete()
    .eq("streak_id", streakId)
    .eq("log_date", todayKey);

  if (error) throw error;

  const updated = await syncStreakCounts(streakId);
  const campaignMap = await fetchCampaignLinks([streakId]);
  const logDates = await fetchLogDates(streakId);
  const shieldGaps = await fetchShieldGaps(streakId);
  return enrichStreak(updated, campaignMap, todayKey, logDates, shieldGaps);
}

export async function setStreakCampaigns(championId, streakId, campaignIds = []) {
  await getOwnedStreak(championId, streakId);

  const ids = [...new Set(campaignIds.map((id) => Number(id)).filter(Boolean))];

  const supabase = createAdminClient();

  if (ids.length) {
    const { data: owned, error: ownedErr } = await supabase
      .from("campaigns")
      .select("id")
      .eq("champion_id", championId)
      .in("id", ids);

    if (ownedErr) throw ownedErr;
    const ownedIds = new Set((owned || []).map((c) => c.id));
    const invalid = ids.filter((id) => !ownedIds.has(id));
    if (invalid.length) {
      throw new Error("Uma ou mais campanhas não pertencem a você");
    }
  }

  const { error: delErr } = await supabase
    .from("habit_streak_campaigns")
    .delete()
    .eq("streak_id", streakId);

  if (delErr) throw delErr;

  if (ids.length) {
    const { error: insErr } = await supabase.from("habit_streak_campaigns").insert(
      ids.map((campaignId) => ({ streak_id: streakId, campaign_id: campaignId }))
    );
    if (insErr) throw insErr;
  }

  const streak = await getOwnedStreak(championId, streakId);
  const campaignMap = await fetchCampaignLinks([streakId]);
  const logDates = await fetchLogDates(streakId);
  const shieldGaps = await fetchShieldGaps(streakId);
  return enrichStreak(streak, campaignMap, dateKeyInTz(), logDates, shieldGaps);
}

export async function autoMarkFromCampaign(championId, campaignId) {
  const supabase = createAdminClient();
  const { data: links, error } = await supabase
    .from("habit_streak_campaigns")
    .select("streak_id, habit_streaks!inner(champion_id)")
    .eq("campaign_id", campaignId);

  if (error) throw error;

  const streakIds = (links || [])
    .filter((l) => Number(l.habit_streaks?.champion_id) === Number(championId))
    .map((l) => l.streak_id);

  if (!streakIds.length) return [];

  const results = [];
  for (const streakId of streakIds) {
    try {
      const row = await markStreakDay(championId, streakId, { source: "campaign" });
      results.push(row);
    } catch {
      /* ignore individual failures */
    }
  }
  return results;
}

export { MAX_SHIELDS };
