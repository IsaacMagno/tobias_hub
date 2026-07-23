import { createAdminClient } from "@/lib/supabase/admin";

function dayKey(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function median(nums) {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Agrega work_sessions completed por dia (Cap. 11).
 */
export async function getSessionAnalytics(
  championId,
  { days = 90, campaignId = null } = {}
) {
  const supabase = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - Number(days || 90));

  let sessionRows;

  if (campaignId) {
    const { data: chapters } = await supabase
      .from("campaign_chapters")
      .select("id")
      .eq("campaign_id", campaignId);
    const chapterIds = (chapters ?? []).map((c) => c.id);
    if (!chapterIds.length) {
      return { days: [], strongDays: [], weakDays: [], totalMinutes: 0, medianMinutes: 0 };
    }
    const { data: missions } = await supabase
      .from("missions")
      .select("id")
      .in("chapter_id", chapterIds);
    const missionIds = (missions ?? []).map((m) => m.id);
    if (!missionIds.length) {
      return { days: [], strongDays: [], weakDays: [], totalMinutes: 0, medianMinutes: 0 };
    }
    const { data: steps } = await supabase
      .from("mission_steps")
      .select("id")
      .in("mission_id", missionIds);
    const stepIds = (steps ?? []).map((s) => s.id);
    if (!stepIds.length) {
      return { days: [], strongDays: [], weakDays: [], totalMinutes: 0, medianMinutes: 0 };
    }
    const { data, error } = await supabase
      .from("work_sessions")
      .select("id, elapsed_seconds, started_at, ended_at, status, step_id")
      .eq("champion_id", championId)
      .eq("status", "completed")
      .in("step_id", stepIds)
      .gte("started_at", since.toISOString());
    if (error) throw error;
    sessionRows = data ?? [];
  } else {
    const { data, error } = await supabase
      .from("work_sessions")
      .select("id, elapsed_seconds, started_at, ended_at, status")
      .eq("champion_id", championId)
      .eq("status", "completed")
      .gte("started_at", since.toISOString());
    if (error) throw error;
    sessionRows = data ?? [];
  }

  const byDay = new Map();
  for (const row of sessionRows) {
    const key = dayKey(row.ended_at || row.started_at);
    const prev = byDay.get(key) || { date: key, seconds: 0, sessions: 0 };
    prev.seconds += Number(row.elapsed_seconds) || 0;
    prev.sessions += 1;
    byDay.set(key, prev);
  }

  const daysList = [...byDay.values()]
    .map((d) => ({
      date: d.date,
      minutes: Math.round(d.seconds / 60),
      sessions: d.sessions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const minuteValues = daysList.map((d) => d.minutes).filter((m) => m > 0);
  const med = median(minuteValues);
  const strongDays = daysList.filter((d) => d.minutes > med && d.minutes > 0);
  const weakDays = daysList.filter(
    (d) => d.minutes > 0 && d.minutes < med && med > 0
  );
  const totalMinutes = daysList.reduce((a, d) => a + d.minutes, 0);

  return {
    days: daysList,
    strongDays,
    weakDays,
    totalMinutes,
    medianMinutes: Math.round(med),
  };
}
