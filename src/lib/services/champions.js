/**
 * Perfil, atributos, visibilidade e community card (Caps 9–12).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateLevel } from "@/lib/helpers/calculateLevel";
import {
  grantPrimaryStat,
  normalizePrimaryStat,
  pickDominantTitle,
} from "@/lib/helpers/attributes";

const LEVEL_FACTOR = 35;

const CHAMPION_SELECT = `
  *,
  files(*)
`;

function normalizeOne(value) {
  if (value == null) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
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

  data.files = normalizeOne(data.files);
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
  const boostPct = actual.xpBoost || 0;
  const xpBoost = championExp.xp * (boostPct / 100);
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

export async function getOrCreateStatistics(championId) {
  const id = Number(championId);
  const supabase = createAdminClient();
  const { data: existing, error } = await supabase
    .from("statistics")
    .select("*")
    .eq("champion_id", id)
    .maybeSingle();
  if (error) throw error;
  if (existing) return existing;

  const { data: created, error: cErr } = await supabase
    .from("statistics")
    .insert({
      champion_id: id,
      strength: 0,
      agility: 0,
      inteligence: 0,
      vitality: 0,
      wisdom: 0,
    })
    .select("*")
    .single();
  if (cErr) throw cErr;
  return created;
}

export async function applyStatGrant(championId, primaryStat, amount) {
  const key = normalizePrimaryStat(primaryStat);
  const amt = Math.max(0, Number(amount) || 0);
  if (!amt) {
    const stats = await getOrCreateStatistics(championId);
    return { stats, attrGained: 0, primaryStat: key, title: null };
  }

  const current = await getOrCreateStatistics(championId);
  const next = grantPrimaryStat(current, key, amt);
  const title = pickDominantTitle(next);

  const supabase = createAdminClient();
  const [{ error: sErr }, { error: tErr }] = await Promise.all([
    supabase
      .from("statistics")
      .update({
        strength: next.strength,
        agility: next.agility,
        inteligence: next.inteligence,
        vitality: next.vitality,
        wisdom: next.wisdom,
      })
      .eq("champion_id", championId),
    supabase.from("champions").update({ title }).eq("id", championId),
  ]);
  if (sErr) throw sErr;
  if (tErr) throw tErr;

  return {
    stats: { ...next, champion_id: Number(championId) },
    attrGained: amt,
    primaryStat: key,
    title,
  };
}

export async function getMyProfile(championId) {
  const [champion, statistics, pins, achievements] = await Promise.all([
    getChampionByIdFull(championId),
    getOrCreateStatistics(championId),
    listChampionPins(championId),
    listChampionAchievements(championId),
  ]);

  return {
    id: champion.id,
    name: champion.name,
    title: champion.title,
    xp: champion.xp,
    level: champion.level,
    biography: champion.biography || "",
    profile_visibility: champion.profile_visibility || "private",
    files: champion.files,
    statistics: {
      strength: statistics.strength,
      agility: statistics.agility,
      inteligence: statistics.inteligence,
      vitality: statistics.vitality,
      wisdom: statistics.wisdom,
    },
    pins,
    achievements,
  };
}

export async function updateProfileVisibility(championId, visibility) {
  const value = visibility === "public" ? "public" : "private";
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("champions")
    .update({ profile_visibility: value })
    .eq("id", championId);
  if (error) throw error;
  return getMyProfile(championId);
}

function campaignProgressPercent(chapters) {
  const missions = (chapters ?? []).flatMap((ch) => ch.missions ?? []);
  if (!missions.length) return 0;
  const done = missions.filter((m) => m.status === "completed").length;
  return Math.round((done / missions.length) * 100);
}

export async function getPublicProfileCard(championId) {
  const id = Number(championId);
  if (!id || Number.isNaN(id)) return null;

  const supabase = createAdminClient();
  const { data: champion, error } = await supabase
    .from("champions")
    .select("id, name, title, xp, level, biography, profile_visibility")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!champion) return null;
  if ((champion.profile_visibility || "private") !== "public") return null;

  const [statistics, pins, { data: campaigns }] = await Promise.all([
    getOrCreateStatistics(id),
    listChampionPins(id),
    supabase
      .from("campaigns")
      .select(
        `
        id, title, status, visibility,
        campaign_chapters (
          id,
          missions ( id, status )
        )
      `
      )
      .eq("champion_id", id)
      .eq("visibility", "public")
      .neq("status", "archived"),
  ]);

  const publicCampaigns = (campaigns ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    status: c.status,
    progressPercent: campaignProgressPercent(c.campaign_chapters),
  }));

  return {
    id: champion.id,
    name: champion.name,
    title: champion.title,
    xp: champion.xp,
    level: champion.level,
    biography: champion.biography || "",
    statistics: {
      strength: statistics.strength,
      agility: statistics.agility,
      inteligence: statistics.inteligence,
      vitality: statistics.vitality,
      wisdom: statistics.wisdom,
    },
    pins,
    campaigns: publicCampaigns,
  };
}

export async function listPublicChampions() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("champions")
    .select("id, name, title, level")
    .eq("profile_visibility", "public")
    .order("level", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listChampionAchievements(championId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("champion_achievements")
    .select(
      `
      earned_at,
      achievement_defs ( id, slug, title, description, kind )
    `
    )
    .eq("champion_id", championId)
    .order("earned_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    earned_at: row.earned_at,
    ...(normalizeOne(row.achievement_defs) || {}),
  }));
}

export async function listChampionPins(championId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("champion_pins")
    .select(
      `
      slot,
      achievement_defs ( id, slug, title, description, kind )
    `
    )
    .eq("champion_id", championId)
    .order("slot", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    slot: row.slot,
    ...(normalizeOne(row.achievement_defs) || {}),
  }));
}

export async function setChampionPins(championId, achievementIds) {
  const ids = (achievementIds || [])
    .map(Number)
    .filter((n) => n && !Number.isNaN(n))
    .slice(0, 3);

  const owned = await listChampionAchievements(championId);
  const ownedIds = new Set(owned.map((a) => Number(a.id)));
  for (const aid of ids) {
    if (!ownedIds.has(aid)) {
      throw new Error("Só é possível fixar conquistas desbloqueadas");
    }
  }

  const supabase = createAdminClient();
  await supabase.from("champion_pins").delete().eq("champion_id", championId);

  if (ids.length) {
    const { error } = await supabase.from("champion_pins").insert(
      ids.map((achievement_id, i) => ({
        champion_id: championId,
        achievement_id,
        slot: i + 1,
      }))
    );
    if (error) throw error;
  }

  return listChampionPins(championId);
}

export async function evaluateAchievements(championId) {
  const id = Number(championId);
  const supabase = createAdminClient();

  const [
    { data: defs },
    { data: already },
    stats,
    champ,
    { count: sessionCount },
    { data: completedCampaigns },
    { count: publicCampaigns },
    { data: ownedCampaignIds },
  ] = await Promise.all([
    supabase.from("achievement_defs").select("id, slug, title"),
    supabase
      .from("champion_achievements")
      .select("achievement_id")
      .eq("champion_id", id),
    getOrCreateStatistics(id),
    getChampionById(id),
    supabase
      .from("work_sessions")
      .select("id", { count: "exact", head: true })
      .eq("champion_id", id)
      .eq("status", "completed"),
    supabase
      .from("campaigns")
      .select("id")
      .eq("champion_id", id)
      .eq("status", "completed"),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("champion_id", id)
      .eq("visibility", "public"),
    supabase.from("campaigns").select("id").eq("champion_id", id),
  ]);

  const cids = (ownedCampaignIds ?? []).map((c) => c.id);
  let stepDoneCount = 0;
  let chapterDoneCount = 0;

  if (cids.length) {
    const { data: chRows } = await supabase
      .from("campaign_chapters")
      .select("id, status")
      .in("campaign_id", cids);
    chapterDoneCount = (chRows ?? []).filter(
      (c) => c.status === "completed"
    ).length;
    const chapterIds = (chRows ?? []).map((c) => c.id);
    if (chapterIds.length) {
      const { data: missions } = await supabase
        .from("missions")
        .select("id")
        .in("chapter_id", chapterIds);
      const mids = (missions ?? []).map((m) => m.id);
      if (mids.length) {
        const { count } = await supabase
          .from("mission_steps")
          .select("id", { count: "exact", head: true })
          .in("mission_id", mids)
          .eq("status", "done");
        stepDoneCount = count || 0;
      }
    }
  }

  const earnedSet = new Set(
    (already ?? []).map((r) => Number(r.achievement_id))
  );
  const bySlug = Object.fromEntries((defs ?? []).map((d) => [d.slug, d]));

  const checks = {
    first_step: stepDoneCount >= 1,
    first_chapter: chapterDoneCount >= 1,
    first_campaign_complete: (completedCampaigns ?? []).length >= 1,
    sessions_10: (sessionCount || 0) >= 10,
    sessions_50: (sessionCount || 0) >= 50,
    attr_str_10: Number(stats.strength || 0) >= 10,
    attr_int_10: Number(stats.inteligence || 0) >= 10,
    wis_5: Number(stats.wisdom || 0) >= 5,
    first_public_campaign: (publicCampaigns || 0) >= 1,
    level_5: Number(champ.level || 0) >= 5,
  };

  const newly = [];
  for (const [slug, ok] of Object.entries(checks)) {
    const def = bySlug[slug];
    if (!def || !ok || earnedSet.has(Number(def.id))) continue;
    const { error } = await supabase.from("champion_achievements").insert({
      champion_id: id,
      achievement_id: def.id,
    });
    if (!error) {
      newly.push({ id: def.id, slug, title: def.title || slug });
    }
  }

  return newly;
}
