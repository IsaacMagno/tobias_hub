import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function makeInviteCode() {
  const raw = randomBytes(5).toString("hex").toUpperCase();
  return `TB-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

function mapInvite(row, guestName = null) {
  if (!row) return null;
  const used = Number(row.used_count || 0) >= Number(row.max_uses || 1);
  return {
    id: row.id,
    code: row.code,
    used,
    usedCount: Number(row.used_count || 0),
    maxUses: Number(row.max_uses || 1),
    active: Boolean(row.active),
    redeemedByChampionId: row.redeemed_by_champion_id || null,
    guestName,
  };
}

export async function getMyInvite(championId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invite_codes")
    .select("*")
    .eq("owner_champion_id", championId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  let guestName = null;
  if (data.redeemed_by_champion_id) {
    const { data: guest } = await supabase
      .from("champions")
      .select("name")
      .eq("id", data.redeemed_by_champion_id)
      .maybeSingle();
    guestName = guest?.name || null;
  }

  return mapInvite(data, guestName);
}

/**
 * Gera o único código de convite do campeão (1 uso).
 * Se já existir, devolve o existente.
 */
export async function generateMyInvite(championId) {
  const existing = await getMyInvite(championId);
  if (existing) return existing;

  const supabase = createAdminClient();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = makeInviteCode();
    const { data, error } = await supabase
      .from("invite_codes")
      .insert({
        code,
        max_uses: 1,
        used_count: 0,
        active: true,
        owner_champion_id: championId,
      })
      .select("*")
      .single();

    if (!error && data) return mapInvite(data);

    // Colisão de código ou já tem código (unique owner)
    if (error?.code === "23505") {
      const again = await getMyInvite(championId);
      if (again) return again;
      continue;
    }
    throw error;
  }

  throw new Error("Não foi possível gerar o código");
}
