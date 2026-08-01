/**
 * Sugestões de campanha (Fase 1: catálogo oficial no código).
 * Aceitar = clonar estrutura + bônus de XP/atributo (uma vez).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { createFullCampaign } from "@/lib/services/campaignFactory";
import {
  updateChampionExp,
  applyStatGrant,
} from "@/lib/services/champions";
import {
  getOfficialTemplateById,
  listOfficialTemplateCards,
} from "@/lib/campaignSuggestions/officialTemplates";

async function ownedTitles(championId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, title, status")
    .eq("champion_id", championId)
    .neq("status", "archived");

  if (error) throw error;
  return data || [];
}

/**
 * Lista cards do catálogo + se o usuário já aceitou (mesmo título ativo).
 */
export async function listSuggestedCampaigns(championId) {
  const owned = await ownedTitles(championId);
  const titleSet = new Set(owned.map((c) => c.title));

  return listOfficialTemplateCards().map((card) => ({
    ...card,
    alreadyAccepted: titleSet.has(card.title),
    existingCampaignId: owned.find((c) => c.title === card.title)?.id ?? null,
  }));
}

/**
 * Clona o template oficial para o champion.
 * Na primeira aceitação: concede XP e atributo de boas-vindas.
 * Idempotente por título: se já existe (não arquivada), devolve a existente.
 */
export async function acceptSuggestedCampaign(championId, templateId) {
  const template = getOfficialTemplateById(templateId);
  if (!template) {
    throw new Error("Sugestão não encontrada");
  }

  const owned = await ownedTitles(championId);
  const existing = owned.find((c) => c.title === template.title);
  if (existing) {
    return {
      created: false,
      campaignId: existing.id,
      title: template.title,
      reward: null,
    };
  }

  const supabase = createAdminClient();
  const campaignId = await createFullCampaign(
    supabase,
    championId,
    template.def
  );

  const xp = Math.max(0, Number(template.acceptBonusXp) || 0);
  const attr = Math.max(0, Number(template.acceptBonusAttr) || 0);
  const primaryStat = template.primary_stat || template.def?.primary_stat;

  let reward = {
    xpGained: 0,
    attrGained: 0,
    primaryStat,
    primary_stat_label: template.primary_stat_label,
  };

  if (xp > 0) {
    await updateChampionExp(championId, { xp });
    reward.xpGained = xp;
  }
  if (attr > 0 && primaryStat) {
    const attrResult = await applyStatGrant(championId, primaryStat, attr);
    reward.attrGained = attrResult.attrGained;
    reward.primaryStat = attrResult.primaryStat;
  }

  try {
    const { recordAcceptEvent } = await import(
      "@/lib/services/communityMilestones"
    );
    await recordAcceptEvent(championId, { templateId });
  } catch {
    /* não bloquear aceite */
  }

  return {
    created: true,
    campaignId,
    title: template.title,
    reward,
  };
}
