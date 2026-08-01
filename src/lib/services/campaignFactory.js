/**
 * Cria campanha completa (capítulos → missões → passos) para um champion.
 * Usado por seeds Isaac, sugestões oficiais e clone por código.
 */
import { createAdminClient } from "@/lib/supabase/admin";

export async function insertMissionSteps(supabase, missionId, steps) {
  const { error } = await supabase.from("mission_steps").insert(
    (steps || []).map((s, i) => ({
      mission_id: missionId,
      surface: s.surface,
      detail: s.detail ?? null,
      planned_minutes: s.planned_minutes ?? null,
      status: i === 0 ? "current" : "pending",
      order_index: i,
    }))
  );
  if (error) throw error;
}

/**
 * @param {object} def
 * @returns {Promise<number>} campaign id
 */
export async function createFullCampaign(supabase, championId, def) {
  const now = new Date().toISOString();
  const { data: campaign, error: cErr } = await supabase
    .from("campaigns")
    .insert({
      champion_id: championId,
      title: def.title,
      status: "active",
      result: def.result ?? null,
      why: def.why ?? null,
      primary_stat: def.primary_stat || "inteligence",
      visibility: "private",
      updated_at: now,
    })
    .select("id")
    .single();
  if (cErr) throw cErr;

  for (let ci = 0; ci < (def.chapters || []).length; ci++) {
    const ch = def.chapters[ci];
    const { data: chapter, error: chErr } = await supabase
      .from("campaign_chapters")
      .insert({
        campaign_id: campaign.id,
        title: ch.title,
        status: ci === 0 ? "active" : "available",
        objective: ch.objective || def.result || null,
        order_index: ci,
      })
      .select("id")
      .single();
    if (chErr) throw chErr;

    for (let mi = 0; mi < (ch.missions || []).length; mi++) {
      const m = ch.missions[mi];
      const { data: mission, error: mErr } = await supabase
        .from("missions")
        .insert({
          chapter_id: chapter.id,
          title: m.title,
          status: m.status || "available",
          why: m.why || null,
          weekdays: m.weekdays || [],
          time_of_day: m.time_of_day || null,
          planned_minutes: m.planned_minutes ?? null,
          order_index: mi,
        })
        .select("id")
        .single();
      if (mErr) throw mErr;
      await insertMissionSteps(supabase, mission.id, m.steps || []);
    }
  }

  return campaign.id;
}

/**
 * Serializa campanha existente em def compatível com createFullCampaign.
 */
export async function serializeCampaignTree(campaignId) {
  const supabase = createAdminClient();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("id, title, result, why, primary_stat")
    .eq("id", campaignId)
    .single();
  if (error) throw error;

  const { data: chapters, error: chErr } = await supabase
    .from("campaign_chapters")
    .select("id, title, objective, order_index")
    .eq("campaign_id", campaignId)
    .order("order_index", { ascending: true });
  if (chErr) throw chErr;

  const chapterDefs = [];
  for (const ch of chapters || []) {
    const { data: missions, error: mErr } = await supabase
      .from("missions")
      .select(
        "id, title, why, weekdays, time_of_day, planned_minutes, order_index"
      )
      .eq("chapter_id", ch.id)
      .order("order_index", { ascending: true });
    if (mErr) throw mErr;

    const missionDefs = [];
    for (const m of missions || []) {
      const { data: steps, error: sErr } = await supabase
        .from("mission_steps")
        .select("surface, detail, planned_minutes, order_index")
        .eq("mission_id", m.id)
        .order("order_index", { ascending: true });
      if (sErr) throw sErr;

      missionDefs.push({
        title: m.title,
        why: m.why,
        weekdays: m.weekdays || [],
        time_of_day: m.time_of_day,
        planned_minutes: m.planned_minutes,
        status: "available",
        steps: (steps || []).map((s) => ({
          surface: s.surface,
          detail: s.detail,
          planned_minutes: s.planned_minutes,
        })),
      });
    }

    chapterDefs.push({
      title: ch.title,
      objective: ch.objective,
      missions: missionDefs,
    });
  }

  return {
    title: campaign.title,
    result: campaign.result,
    why: campaign.why,
    primary_stat: campaign.primary_stat || "inteligence",
    chapters: chapterDefs,
  };
}

/**
 * Clona árvore de campanha para outro champion (sempre private/active).
 */
export async function cloneCampaignTree(sourceCampaignId, targetChampionId) {
  const supabase = createAdminClient();
  const def = await serializeCampaignTree(sourceCampaignId);
  return createFullCampaign(supabase, targetChampionId, def);
}
