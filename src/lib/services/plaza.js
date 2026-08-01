/**
 * Praça: 1 post/dia (data America/Sao_Paulo).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { dateKeyInTz } from "@/lib/helpers/habitStreak";

const BODY_MAX = 120;

export async function createPlazaPost(championId, { body, campaignId = null }) {
  const text = String(body || "").trim();
  if (text.length < 1) throw new Error("Escreva algo para a Praça");
  if (text.length > BODY_MAX) {
    throw new Error(`Máximo ${BODY_MAX} caracteres`);
  }

  const supabase = createAdminClient();
  const postDate = dateKeyInTz();

  if (campaignId) {
    const { data: camp, error } = await supabase
      .from("campaigns")
      .select("id, champion_id, visibility, status")
      .eq("id", campaignId)
      .single();
    if (error || !camp) throw new Error("Campanha não encontrada");
    if (Number(camp.champion_id) !== Number(championId)) {
      throw new Error("Só pode vincular campanha sua");
    }
    if (camp.status === "archived") {
      throw new Error("Campanha arquivada");
    }
  }

  const { data: existing } = await supabase
    .from("plaza_posts")
    .select("id")
    .eq("champion_id", championId)
    .eq("post_date", postDate)
    .maybeSingle();
  if (existing) {
    throw new Error("Você já postou hoje na Praça (1 por dia)");
  }

  const { data, error: insErr } = await supabase
    .from("plaza_posts")
    .insert({
      champion_id: championId,
      campaign_id: campaignId || null,
      body: text,
      post_date: postDate,
    })
    .select("*")
    .single();
  if (insErr) {
    if (insErr.code === "23505") {
      throw new Error("Você já postou hoje na Praça (1 por dia)");
    }
    throw insErr;
  }

  return mapPost(data);
}

/**
 * Feed recente; paginação “carregar anteriores” (máx. 30 por página).
 * @param {{ limit?: number, before?: string }} opts before = created_at ISO
 */
export async function listPlazaPosts({ limit = 30, before = null } = {}) {
  const supabase = createAdminClient();
  const take = Math.min(30, Math.max(1, Number(limit) || 30));

  let q = supabase
    .from("plaza_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(take);

  if (before) {
    q = q.lt("created_at", before);
  }

  const { data, error } = await q;
  if (error) throw error;

  const rows = data || [];
  const champIds = [...new Set(rows.map((r) => r.champion_id))];
  const campIds = [
    ...new Set(rows.map((r) => r.campaign_id).filter(Boolean)),
  ];

  const names = {};
  if (champIds.length) {
    const { data: champs } = await supabase
      .from("champions")
      .select("id, name")
      .in("id", champIds);
    for (const c of champs || []) names[c.id] = c.name;
  }

  const campTitles = {};
  if (campIds.length) {
    const { data: camps } = await supabase
      .from("campaigns")
      .select("id, title")
      .in("id", campIds);
    for (const c of camps || []) campTitles[c.id] = c.title;
  }

  return rows.map((row) => ({
    ...mapPost(row),
    championName: names[row.champion_id] || "Campeão",
    campaignTitle: row.campaign_id
      ? campTitles[row.campaign_id] || null
      : null,
  }));
}

export async function listMyPlazaCampaignOptions(championId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, title, visibility, status")
    .eq("champion_id", championId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(40);
  if (error) throw error;
  return (data || []).map((c) => ({
    id: c.id,
    title: c.title,
    visibility: c.visibility,
  }));
}

function mapPost(row) {
  return {
    id: row.id,
    championId: row.champion_id,
    campaignId: row.campaign_id,
    body: row.body,
    postDate: row.post_date,
    createdAt: row.created_at,
  };
}
