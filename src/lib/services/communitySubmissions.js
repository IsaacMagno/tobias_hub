/**
 * Publicação de campanhas na Comunidade (submit + review + accept).
 * Moderador: COMMUNITY_MODERATOR_CHAMPION_ID (default 2).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createFullCampaign,
  serializeCampaignTree,
} from "@/lib/services/campaignFactory";
import {
  updateChampionExp,
  applyStatGrant,
} from "@/lib/services/champions";
import { STAT_LABELS } from "@/lib/helpers/attributes";

export function getModeratorChampionId() {
  return Number(process.env.COMMUNITY_MODERATOR_CHAMPION_ID || 2);
}

export function assertModerator(championId) {
  if (Number(championId) !== getModeratorChampionId()) {
    throw new Error("Acesso de moderador necessário");
  }
}

export async function submitCampaignToCommunity(
  championId,
  campaignId,
  blurb
) {
  const text = String(blurb || "").trim();
  if (text.length < 10) {
    throw new Error("Escreva um resumo com pelo menos 10 caracteres");
  }
  if (text.length > 280) {
    throw new Error("Resumo muito longo (máx. 280)");
  }

  const supabase = createAdminClient();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("id, champion_id, title, status, primary_stat")
    .eq("id", campaignId)
    .single();
  if (error) throw error;
  if (Number(campaign.champion_id) !== Number(championId)) {
    throw new Error("Acesso negado à campanha");
  }
  if (campaign.status !== "active" && campaign.status !== "paused") {
    throw new Error("Só campanhas ativas/pausadas podem ser enviadas");
  }

  const { data: pending } = await supabase
    .from("community_campaign_submissions")
    .select("id")
    .eq("source_campaign_id", campaignId)
    .eq("status", "pending")
    .maybeSingle();
  if (pending) {
    throw new Error("Já existe um envio pendente desta campanha");
  }

  const snapshot = await serializeCampaignTree(campaignId);

  const { data, error: insErr } = await supabase
    .from("community_campaign_submissions")
    .insert({
      source_campaign_id: campaignId,
      submitter_champion_id: championId,
      title: campaign.title,
      blurb: text,
      primary_stat: campaign.primary_stat || "inteligence",
      status: "pending",
      snapshot_json: snapshot,
    })
    .select("*")
    .single();
  if (insErr) throw insErr;

  return mapSubmission(data);
}

export async function getSubmissionForCampaign(championId, campaignId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("community_campaign_submissions")
    .select("*")
    .eq("source_campaign_id", campaignId)
    .eq("submitter_champion_id", championId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSubmission(data) : null;
}

export async function listPendingSubmissions(moderatorId) {
  assertModerator(moderatorId);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("community_campaign_submissions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const ids = [...new Set((data || []).map((r) => r.submitter_champion_id))];
  let names = {};
  if (ids.length) {
    const { data: champs } = await supabase
      .from("champions")
      .select("id, name")
      .in("id", ids);
    for (const c of champs || []) names[c.id] = c.name;
  }

  return (data || []).map((row) => ({
    ...mapSubmission(row),
    submitterName: names[row.submitter_champion_id] || "Campeão",
    review: buildReviewPreview(row),
  }));
}

/**
 * Resumo do snapshot para o moderador saber o que está aprovando.
 */
function buildReviewPreview(row) {
  const snap = row.snapshot_json || {};
  const chapters = Array.isArray(snap.chapters) ? snap.chapters : [];
  let missionCount = 0;
  let stepCount = 0;
  let plannedMinutes = 0;
  const outline = [];

  for (const ch of chapters) {
    const missions = Array.isArray(ch.missions) ? ch.missions : [];
    missionCount += missions.length;
    const missionLines = [];
    for (const m of missions) {
      const steps = Array.isArray(m.steps) ? m.steps : [];
      stepCount += steps.length;
      for (const s of steps) {
        const mins = Number(s.planned_minutes);
        if (Number.isFinite(mins) && mins > 0) plannedMinutes += mins;
      }
      const weekdays = Array.isArray(m.weekdays) ? m.weekdays : [];
      missionLines.push({
        title: m.title || "Missão",
        why: m.why || null,
        weekdays,
        timeOfDay: m.time_of_day || null,
        plannedMinutes: m.planned_minutes ?? null,
        stepCount: steps.length,
        steps: steps.slice(0, 8).map((s) => ({
          surface: s.surface || "(sem texto)",
          detail: s.detail || null,
          plannedMinutes: s.planned_minutes ?? null,
        })),
        stepsTruncated: steps.length > 8,
      });
    }
    outline.push({
      title: ch.title || "Capítulo",
      objective: ch.objective || null,
      missions: missionLines,
    });
  }

  return {
    why: snap.why || null,
    result: snap.result || null,
    primaryStat: snap.primary_stat || row.primary_stat,
    primaryStatLabel:
      STAT_LABELS[snap.primary_stat || row.primary_stat] ||
      snap.primary_stat ||
      row.primary_stat,
    chapterCount: chapters.length,
    missionCount,
    stepCount,
    plannedMinutesTotal: plannedMinutes || null,
    outline,
  };
}

export async function listApprovedCommunityCampaigns(championId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("community_campaign_submissions")
    .select("*")
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false });
  if (error) throw error;

  const ownedTitles = new Set();
  const { data: ownedCampaigns } = await supabase
    .from("campaigns")
    .select("id, title")
    .eq("champion_id", championId)
    .neq("status", "archived");
  for (const c of ownedCampaigns || []) ownedTitles.add(c.title);

  return (data || []).map((row) => {
    const accepted = ownedTitles.has(row.title);
    const match = (ownedCampaigns || []).find((c) => c.title === row.title);
    return {
      id: `community-${row.id}`,
      submissionId: row.id,
      source: "community",
      title: row.title,
      blurb: row.blurb,
      difficulty: "medium",
      primary_stat: row.primary_stat,
      primary_stat_label: STAT_LABELS[row.primary_stat] || row.primary_stat,
      tags: ["comunidade"],
      scheduleHint: "Publicada pela comunidade",
      authorLabel: "Comunidade",
      acceptBonusXp: 40,
      acceptBonusAttr: 3,
      estimatedXp: null,
      alreadyAccepted: accepted,
      existingCampaignId: match?.id ?? null,
    };
  });
}

/**
 * Fluxo: submit → approve → accept (clone do snapshot).
 */
export async function reviewSubmission(
  moderatorId,
  submissionId,
  decision,
  note = ""
) {
  assertModerator(moderatorId);
  const status = decision === "approve" ? "approved" : "rejected";
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("community_campaign_submissions")
    .update({
      status,
      reviewer_note: note ? String(note).trim() : null,
      reviewed_by: moderatorId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .eq("status", "pending")
    .select("*")
    .single();
  if (error) throw error;
  return mapSubmission(data);
}

export async function acceptCommunitySubmission(championId, submissionId) {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("community_campaign_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("status", "approved")
    .maybeSingle();
  if (error) throw error;
  if (!row) throw new Error("Publicação não encontrada ou ainda não aprovada");

  const snapshot = row.snapshot_json;
  if (!snapshot?.title) throw new Error("Snapshot inválido");

  const { data: existing } = await supabase
    .from("campaigns")
    .select("id, title")
    .eq("champion_id", championId)
    .eq("title", snapshot.title)
    .neq("status", "archived")
    .maybeSingle();

  if (existing) {
    return {
      created: false,
      campaignId: existing.id,
      title: existing.title,
      reward: null,
    };
  }

  const campaignId = await createFullCampaign(supabase, championId, snapshot);

  await updateChampionExp(championId, { xp: 40 });
  await applyStatGrant(championId, row.primary_stat || "inteligence", 3);

  try {
    const { recordAcceptEvent } = await import(
      "@/lib/services/communityMilestones"
    );
    await recordAcceptEvent(championId, { submissionId: row.id });
  } catch {
    /* não bloquear aceite */
  }

  return {
    created: true,
    campaignId,
    title: snapshot.title,
    reward: {
      xpGained: 40,
      attrGained: 3,
      primaryStat: row.primary_stat,
      primary_stat_label: STAT_LABELS[row.primary_stat],
    },
  };
}

function mapSubmission(row) {
  return {
    id: row.id,
    sourceCampaignId: row.source_campaign_id,
    submitterChampionId: row.submitter_champion_id,
    title: row.title,
    blurb: row.blurb,
    primaryStat: row.primary_stat,
    status: row.status,
    reviewerNote: row.reviewer_note,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

export function isCommunityModerator(championId) {
  return Number(championId) === getModeratorChampionId();
}
