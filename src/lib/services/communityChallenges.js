/**
 * Desafios semanais oficiais + check-in diário.
 * Ranking leve: só participação / sua sequência — sem lista de quem falhou.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { dateKeyInTz, prevDateKey } from "@/lib/helpers/habitStreak";

const SEED_SLUG = "corda-7-dias";

function weekWindowFromToday() {
  const today = dateKeyInTz();
  const [y, m, d] = today.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const endsOn = end.toISOString().slice(0, 10);
  return { startsOn: today, endsOn };
}

/**
 * Garante 1 desafio seed ativo (Corda 7 dias).
 */
export async function ensureChallengeSeed() {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("community_challenges")
    .select("*")
    .eq("slug", SEED_SLUG)
    .eq("status", "active")
    .maybeSingle();

  if (existing) return mapChallenge(existing);

  const { startsOn, endsOn } = weekWindowFromToday();
  const { data, error } = await supabase
    .from("community_challenges")
    .insert({
      slug: SEED_SLUG,
      title: "Corda 7 dias",
      blurb:
        "Pule corda todo dia nesta semana. Entre, marque o check-in diário e veja quantos estão nessa com você.",
      starts_on: startsOn,
      ends_on: endsOn,
      protocol_json: {
        templateId: "rope-skip-challenge",
        days: 7,
        hint: "Alinhado ao template oficial Desafio corda — 7 dias",
      },
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    // race: outro processo criou
    const { data: again } = await supabase
      .from("community_challenges")
      .select("*")
      .eq("slug", SEED_SLUG)
      .eq("status", "active")
      .maybeSingle();
    if (again) return mapChallenge(again);
    throw error;
  }
  return mapChallenge(data);
}

export async function listChallenges(championId) {
  await ensureChallengeSeed();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("community_challenges")
    .select("*")
    .eq("status", "active")
    .order("starts_on", { ascending: false });
  if (error) throw error;

  const challenges = data || [];
  const ids = challenges.map((c) => c.id);
  let memberSet = new Set();
  if (ids.length && championId) {
    const { data: mem } = await supabase
      .from("community_challenge_members")
      .select("challenge_id")
      .eq("champion_id", championId)
      .in("challenge_id", ids);
    for (const m of mem || []) memberSet.add(m.challenge_id);
  }

  return challenges.map((c) => ({
    ...mapChallenge(c),
    joined: memberSet.has(c.id),
  }));
}

export async function joinChallenge(championId, challengeId) {
  const supabase = createAdminClient();
  const { data: ch, error } = await supabase
    .from("community_challenges")
    .select("*")
    .eq("id", challengeId)
    .eq("status", "active")
    .single();
  if (error || !ch) throw new Error("Desafio não encontrado");

  const today = dateKeyInTz();
  if (today > ch.ends_on) throw new Error("Este desafio já encerrou");

  const { error: insErr } = await supabase
    .from("community_challenge_members")
    .upsert(
      { challenge_id: challengeId, champion_id: championId },
      { onConflict: "challenge_id,champion_id", ignoreDuplicates: true }
    );
  if (insErr) throw insErr;

  return { ok: true, challengeId };
}

/**
 * Check-in idempotente no mesmo dia.
 */
export async function checkinChallenge(championId, challengeId) {
  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("community_challenge_members")
    .select("champion_id")
    .eq("challenge_id", challengeId)
    .eq("champion_id", championId)
    .maybeSingle();
  if (!member) throw new Error("Entre no desafio antes de marcar");

  const { data: ch } = await supabase
    .from("community_challenges")
    .select("starts_on, ends_on, status")
    .eq("id", challengeId)
    .single();
  if (!ch || ch.status !== "active") throw new Error("Desafio inativo");

  const today = dateKeyInTz();
  if (today < ch.starts_on || today > ch.ends_on) {
    throw new Error("Fora da janela do desafio");
  }

  const { data, error } = await supabase
    .from("community_challenge_checkins")
    .upsert(
      {
        challenge_id: challengeId,
        champion_id: championId,
        checkin_date: today,
      },
      { onConflict: "challenge_id,champion_id,checkin_date", ignoreDuplicates: true }
    )
    .select("*")
    .maybeSingle();

  if (error) throw error;

  const stats = await getChallengeStats(championId, challengeId);
  return {
    ok: true,
    checkinDate: today,
    created: Boolean(data),
    stats,
  };
}

export async function getChallengeStats(championId, challengeId) {
  const supabase = createAdminClient();
  const today = dateKeyInTz();

  const { count: memberCount } = await supabase
    .from("community_challenge_members")
    .select("*", { count: "exact", head: true })
    .eq("challenge_id", challengeId);

  const { count: checkinsToday } = await supabase
    .from("community_challenge_checkins")
    .select("*", { count: "exact", head: true })
    .eq("challenge_id", challengeId)
    .eq("checkin_date", today);

  const { data: myCheckins } = await supabase
    .from("community_challenge_checkins")
    .select("checkin_date")
    .eq("challenge_id", challengeId)
    .eq("champion_id", championId)
    .order("checkin_date", { ascending: false });

  const dates = new Set((myCheckins || []).map((r) => r.checkin_date));
  let streak = 0;
  let cursor = today;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = prevDateKey(cursor);
  }
  // se não marcou hoje, conta a partir de ontem
  if (streak === 0 && dates.has(prevDateKey(today))) {
    cursor = prevDateKey(today);
    while (dates.has(cursor)) {
      streak += 1;
      cursor = prevDateKey(cursor);
    }
  }

  return {
    memberCount: memberCount || 0,
    checkinsToday: checkinsToday || 0,
    myCheckinCount: dates.size,
    myStreak: streak,
    checkedInToday: dates.has(today),
    targetDays: 7,
  };
}

function mapChallenge(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    blurb: row.blurb,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    protocol: row.protocol_json,
    status: row.status,
  };
}
