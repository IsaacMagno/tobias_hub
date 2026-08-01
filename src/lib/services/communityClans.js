/**
 * Clãs / duelos amigáveis: 2–5 pessoas, 7 dias, mesmo protocolo.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { dateKeyInTz } from "@/lib/helpers/habitStreak";
import { acceptSuggestedCampaign } from "@/lib/services/campaignSuggestions";
import { acceptCommunitySubmission } from "@/lib/services/communitySubmissions";
import {
  getOfficialTemplateById,
  listOfficialTemplateCards,
} from "@/lib/campaignSuggestions/officialTemplates";

function randomJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "CL-";
  for (let i = 0; i < 4; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  s += "-";
  for (let i = 0; i < 4; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

function endsIn7Days(startsOn) {
  const [y, m, d] = startsOn.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1, d));
  end.setUTCDate(end.getUTCDate() + 6);
  return end.toISOString().slice(0, 10);
}

function parseProtocolRef(protocolRef) {
  const raw = String(protocolRef || "");
  if (raw.startsWith("submission:")) {
    return { kind: "submission", id: Number(raw.slice("submission:".length)) };
  }
  if (raw.startsWith("template:")) {
    return { kind: "template", id: raw.slice("template:".length) };
  }
  // default: template id direto
  return { kind: "template", id: raw };
}

async function ensureProtocolClone(championId, protocolRef) {
  const parsed = parseProtocolRef(protocolRef);
  if (parsed.kind === "submission") {
    return acceptCommunitySubmission(championId, parsed.id);
  }
  return acceptSuggestedCampaign(championId, parsed.id);
}

export async function createClan(championId, { name, protocolRef }) {
  const clanName = String(name || "").trim();
  if (clanName.length < 2) throw new Error("Nome do clã muito curto");
  if (clanName.length > 40) throw new Error("Nome do clã muito longo");

  const parsed = parseProtocolRef(protocolRef);
  if (parsed.kind === "template") {
    if (!getOfficialTemplateById(parsed.id)) {
      throw new Error("Protocolo oficial inválido");
    }
  } else if (!parsed.id) {
    throw new Error("Protocolo inválido");
  }

  const normalizedRef =
    parsed.kind === "submission"
      ? `submission:${parsed.id}`
      : `template:${parsed.id}`;

  await ensureProtocolClone(championId, normalizedRef);

  const startsOn = dateKeyInTz();
  const endsOn = endsIn7Days(startsOn);
  const supabase = createAdminClient();

  let joinCode = randomJoinCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("community_clans")
      .insert({
        name: clanName,
        owner_id: championId,
        protocol_ref: normalizedRef,
        starts_on: startsOn,
        ends_on: endsOn,
        join_code: joinCode,
        max_members: 5,
      })
      .select("*")
      .single();

    if (!error) {
      await supabase.from("community_clan_members").insert({
        clan_id: data.id,
        champion_id: championId,
      });
      return mapClan(data, { memberCount: 1, isMember: true });
    }
    if (error.code === "23505") {
      joinCode = randomJoinCode();
      continue;
    }
    throw error;
  }
  throw new Error("Não foi possível gerar código do clã");
}

export async function joinClanByCode(championId, code) {
  const joinCode = String(code || "")
    .trim()
    .toUpperCase();
  if (!joinCode) throw new Error("Informe o código");

  const supabase = createAdminClient();
  const { data: clan, error } = await supabase
    .from("community_clans")
    .select("*")
    .eq("join_code", joinCode)
    .single();
  if (error || !clan) throw new Error("Clã não encontrado");

  const today = dateKeyInTz();
  if (today > clan.ends_on) throw new Error("Este clã já encerrou");

  const { count } = await supabase
    .from("community_clan_members")
    .select("*", { count: "exact", head: true })
    .eq("clan_id", clan.id);

  const { data: already } = await supabase
    .from("community_clan_members")
    .select("champion_id")
    .eq("clan_id", clan.id)
    .eq("champion_id", championId)
    .maybeSingle();

  if (!already) {
    if ((count || 0) >= (clan.max_members || 5)) {
      throw new Error("Clã cheio (máx. 5)");
    }
    await ensureProtocolClone(championId, clan.protocol_ref);
    const { error: memErr } = await supabase
      .from("community_clan_members")
      .insert({ clan_id: clan.id, champion_id: championId });
    if (memErr) throw memErr;
  }

  return mapClan(clan, {
    memberCount: already ? count || 0 : (count || 0) + 1,
    isMember: true,
  });
}

export async function listMyClans(championId) {
  const supabase = createAdminClient();
  const { data: memberships, error } = await supabase
    .from("community_clan_members")
    .select("clan_id")
    .eq("champion_id", championId);
  if (error) throw error;
  const ids = (memberships || []).map((m) => m.clan_id);
  if (!ids.length) return [];

  const { data: clans, error: cErr } = await supabase
    .from("community_clans")
    .select("*")
    .in("id", ids)
    .order("starts_on", { ascending: false });
  if (cErr) throw cErr;

  const today = dateKeyInTz();
  const result = [];
  for (const clan of clans || []) {
    const stats = await getClanStats(championId, clan.id);
    result.push({
      ...mapClan(clan, {
        memberCount: stats.memberCount,
        isMember: true,
      }),
      ...stats,
      active: today >= clan.starts_on && today <= clan.ends_on,
      protocolLabel: protocolLabel(clan.protocol_ref),
    });
  }
  return result;
}

export async function clanCheckin(championId, clanId) {
  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("community_clan_members")
    .select("champion_id")
    .eq("clan_id", clanId)
    .eq("champion_id", championId)
    .maybeSingle();
  if (!member) throw new Error("Você não está neste clã");

  const { data: clan } = await supabase
    .from("community_clans")
    .select("*")
    .eq("id", clanId)
    .single();
  if (!clan) throw new Error("Clã não encontrado");

  const today = dateKeyInTz();
  if (today < clan.starts_on || today > clan.ends_on) {
    throw new Error("Fora da janela do clã");
  }

  const { error } = await supabase.from("community_clan_checkins").upsert(
    {
      clan_id: clanId,
      champion_id: championId,
      checkin_date: today,
    },
    { onConflict: "clan_id,champion_id,checkin_date", ignoreDuplicates: true }
  );
  if (error) throw error;

  const stats = await getClanStats(championId, clanId);
  return { ok: true, checkinDate: today, stats };
}

export async function getClanStats(championId, clanId) {
  const supabase = createAdminClient();
  const today = dateKeyInTz();

  const { data: members } = await supabase
    .from("community_clan_members")
    .select("champion_id")
    .eq("clan_id", clanId);
  const memberIds = (members || []).map((m) => m.champion_id);

  const names = {};
  if (memberIds.length) {
    const { data: champs } = await supabase
      .from("champions")
      .select("id, name")
      .in("id", memberIds);
    for (const c of champs || []) names[c.id] = c.name;
  }

  const { data: todayCheckins } = await supabase
    .from("community_clan_checkins")
    .select("champion_id")
    .eq("clan_id", clanId)
    .eq("checkin_date", today);

  const checkedSet = new Set((todayCheckins || []).map((r) => r.champion_id));

  const { data: myCheckins } = await supabase
    .from("community_clan_checkins")
    .select("checkin_date")
    .eq("clan_id", clanId)
    .eq("champion_id", championId);

  return {
    memberCount: memberIds.length,
    checkinsToday: checkedSet.size,
    checkedInToday: checkedSet.has(Number(championId)),
    myCheckinCount: (myCheckins || []).length,
    members: memberIds.map((id) => ({
      id,
      name: names[id] || "Campeão",
      checkedInToday: checkedSet.has(id),
    })),
  };
}

function protocolLabel(ref) {
  const parsed = parseProtocolRef(ref);
  if (parsed.kind === "template") {
    return getOfficialTemplateById(parsed.id)?.title || parsed.id;
  }
  return `Publicação #${parsed.id}`;
}

function mapClan(row, extra = {}) {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    protocolRef: row.protocol_ref,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    joinCode: row.join_code,
    maxMembers: row.max_members,
    ...extra,
  };
}

export async function listClanProtocolOptions() {
  const official = listOfficialTemplateCards().map((t) => ({
    value: `template:${t.id}`,
    label: t.title,
    source: "official",
  }));

  const supabase = createAdminClient();
  const { data: approved } = await supabase
    .from("community_campaign_submissions")
    .select("id, title")
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false });

  const community = (approved || []).map((s) => ({
    value: `submission:${s.id}`,
    label: s.title,
    source: "community",
  }));

  return [...official, ...community];
}
