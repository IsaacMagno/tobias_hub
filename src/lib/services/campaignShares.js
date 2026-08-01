/**
 * Códigos de compartilhamento de campanha (clone por código CP-XXXX-XXXX).
 */
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { cloneCampaignTree } from "@/lib/services/campaignFactory";

function makeShareCode() {
  const raw = randomBytes(5).toString("hex").toUpperCase();
  return `CP-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

export async function createShareCode(championId, campaignId) {
  const supabase = createAdminClient();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("id, champion_id, title, status")
    .eq("id", campaignId)
    .single();
  if (error) throw error;
  if (Number(campaign.champion_id) !== Number(championId)) {
    throw new Error("Acesso negado à campanha");
  }
  if (campaign.status === "archived") {
    throw new Error("Não é possível compartilhar campanha arquivada");
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = makeShareCode();
    const { data, error: insErr } = await supabase
      .from("campaign_share_codes")
      .insert({
        code,
        source_campaign_id: campaignId,
        owner_champion_id: championId,
        max_uses: 10,
        use_count: 0,
      })
      .select("*")
      .single();

    if (!insErr && data) {
      return {
        id: data.id,
        code: data.code,
        campaignId: data.source_campaign_id,
        campaignTitle: campaign.title,
        maxUses: data.max_uses,
        useCount: data.use_count,
      };
    }
    if (insErr?.code === "23505") continue;
    throw insErr;
  }
  throw new Error("Não foi possível gerar código");
}

export async function listShareCodesForCampaign(championId, campaignId) {
  const supabase = createAdminClient();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("id, champion_id")
    .eq("id", campaignId)
    .single();
  if (error) throw error;
  if (Number(campaign.champion_id) !== Number(championId)) {
    throw new Error("Acesso negado à campanha");
  }

  const { data, error: listErr } = await supabase
    .from("campaign_share_codes")
    .select("*")
    .eq("source_campaign_id", campaignId)
    .eq("owner_champion_id", championId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (listErr) throw listErr;

  return (data || []).map((row) => ({
    id: row.id,
    code: row.code,
    maxUses: row.max_uses,
    useCount: row.use_count,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}

/**
 * Resgata código: clona campanha para o champion (idempotente por título).
 */
export async function redeemShareCode(championId, rawCode) {
  const code = String(rawCode || "")
    .trim()
    .toUpperCase();
  if (!code) throw new Error("Informe o código");

  const supabase = createAdminClient();
  const { data: share, error } = await supabase
    .from("campaign_share_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  if (!share) throw new Error("Código inválido");

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    throw new Error("Código expirado");
  }
  if (Number(share.use_count) >= Number(share.max_uses)) {
    throw new Error("Código esgotado");
  }
  if (Number(share.owner_champion_id) === Number(championId)) {
    throw new Error("Você não pode resgatar o próprio código");
  }

  const { data: source, error: srcErr } = await supabase
    .from("campaigns")
    .select("id, title, status")
    .eq("id", share.source_campaign_id)
    .single();
  if (srcErr) throw srcErr;
  if (source.status === "archived") {
    throw new Error("Campanha de origem arquivada");
  }

  const { data: existing } = await supabase
    .from("campaigns")
    .select("id, title")
    .eq("champion_id", championId)
    .eq("title", source.title)
    .neq("status", "archived")
    .maybeSingle();

  if (existing) {
    return {
      created: false,
      campaignId: existing.id,
      title: existing.title,
      code: share.code,
    };
  }

  const campaignId = await cloneCampaignTree(
    share.source_campaign_id,
    championId
  );

  await supabase
    .from("campaign_share_codes")
    .update({ use_count: Number(share.use_count) + 1 })
    .eq("id", share.id);

  return {
    created: true,
    campaignId,
    title: source.title,
    code: share.code,
  };
}
