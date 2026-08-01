/**
 * Marcos coletivos: contadores de aceites (oficial / publicação).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getOfficialTemplateById } from "@/lib/campaignSuggestions/officialTemplates";

/** Thresholds celebrados (banner). */
export const MILESTONE_THRESHOLDS = [10, 50, 100];

/** Templates populares com banner. */
export const MILESTONE_TEMPLATE_IDS = [
  "saitama",
  "rope-skip-challenge",
  "baki-champion",
];

export async function recordAcceptEvent(
  championId,
  { templateId = null, submissionId = null }
) {
  if (!templateId && !submissionId) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("community_accept_events")
    .insert({
      champion_id: championId,
      template_id: templateId || null,
      submission_id: submissionId || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function countAcceptsByTemplate(templateId) {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("community_accept_events")
    .select("*", { count: "exact", head: true })
    .eq("template_id", templateId);
  if (error) throw error;
  return count || 0;
}

/**
 * Banners ativos: threshold cruzado mais alto por template popular.
 */
export async function listMilestoneBanners() {
  const banners = [];
  for (const templateId of MILESTONE_TEMPLATE_IDS) {
    const count = await countAcceptsByTemplate(templateId);
    const crossed = MILESTONE_THRESHOLDS.filter((t) => count >= t);
    if (!crossed.length) continue;
    const threshold = crossed[crossed.length - 1];
    const tmpl = getOfficialTemplateById(templateId);
    banners.push({
      templateId,
      title: tmpl?.title || templateId,
      count,
      threshold,
      message: `Marco: ${count} pessoas aceitaram ${tmpl?.title || templateId}`,
    });
  }
  return banners;
}
