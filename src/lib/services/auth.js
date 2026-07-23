import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createAdminClient } from "@/lib/supabase/admin";

const SECRET = process.env.SECRET;
const BCRYPT_ROUNDS = 10;

/** Senha média: 6+ chars, pelo menos 1 letra e 1 número. */
export function validateMediumPassword(password) {
  const value = String(password || "");
  if (value.length < 6) {
    return { ok: false, message: "Senha: mínimo 6 caracteres" };
  }
  if (value.length > 72) {
    return { ok: false, message: "Senha muito longa" };
  }
  if (!/[A-Za-zÀ-ÿ]/.test(value)) {
    return { ok: false, message: "Senha: inclua pelo menos uma letra" };
  }
  if (!/[0-9]/.test(value)) {
    return { ok: false, message: "Senha: inclua pelo menos um número" };
  }
  return { ok: true };
}

export function validateUsername(username) {
  const value = String(username || "").trim();
  if (value.length < 3 || value.length > 24) {
    return { ok: false, message: "Usuário: 3 a 24 caracteres" };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return { ok: false, message: "Usuário: só letras, números e _" };
  }
  return { ok: true, value: value.toLowerCase() };
}

export async function loginChampion(username, password) {
  const supabase = createAdminClient();

  const { data: auth, error } = await supabase
    .from("authentication")
    .select("*")
    .eq("username", String(username || "").trim().toLowerCase())
    .maybeSingle();

  if (error || !auth) return null;

  const valid = await bcrypt.compare(password, auth.password);
  if (!valid) return null;

  await supabase
    .from("authentication")
    .update({ lastLogin: new Date().toISOString() })
    .eq("id", auth.id);

  const token = jwt.sign(
    { champion_id: auth.champion_id, name: auth.username },
    SECRET,
    { expiresIn: "1h" }
  );

  return {
    champion: auth,
    token: `Bearer ${token}`,
    isValid: true,
  };
}

/**
 * Cadastro mínimo: nome, usuário, senha + código de convite.
 */
export async function registerChampion({
  name,
  username,
  password,
  inviteCode,
}) {
  const displayName = String(name || "").trim();
  if (displayName.length < 2 || displayName.length > 40) {
    throw new Error("Nome: 2 a 40 caracteres");
  }

  const userCheck = validateUsername(username);
  if (!userCheck.ok) throw new Error(userCheck.message);

  const passCheck = validateMediumPassword(password);
  if (!passCheck.ok) throw new Error(passCheck.message);

  const code = String(inviteCode || "").trim();
  if (!code) throw new Error("Informe o código de convite");

  const supabase = createAdminClient();

  const { data: inviteId, error: claimErr } = await supabase.rpc(
    "claim_invite_code",
    { p_code: code }
  );
  if (claimErr) throw claimErr;
  if (!inviteId) {
    throw new Error("Código de convite inválido ou esgotado");
  }

  try {
    const { data: existing } = await supabase
      .from("authentication")
      .select("id")
      .eq("username", userCheck.value)
      .maybeSingle();
    if (existing) throw new Error("Esse usuário já existe");

    const { data: champion, error: cErr } = await supabase
      .from("champions")
      .insert({
        name: displayName,
        title: "Novato",
        xp: 0,
        xpBoost: 0,
        level: 1,
        daystreak: 0,
        biography: null,
        daystreakShield: 0,
        tobiasCoins: 0,
        achievementPoints: 0,
        profile_visibility: "private",
      })
      .select("id, name")
      .single();
    if (cErr) throw cErr;

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const { error: aErr } = await supabase.from("authentication").insert({
      username: userCheck.value,
      password: hash,
      champion_id: champion.id,
      lastLogin: null,
    });
    if (aErr) {
      await supabase.from("champions").delete().eq("id", champion.id);
      throw aErr.code === "23505"
        ? new Error("Esse usuário já existe")
        : aErr;
    }

    await supabase.from("statistics").insert({
      champion_id: champion.id,
      strength: 0,
      agility: 0,
      inteligence: 0,
      vitality: 0,
      wisdom: 0,
    });

    await supabase.rpc("complete_invite_redemption", {
      p_invite_id: inviteId,
      p_champion_id: champion.id,
    });

    return {
      ok: true,
      championId: champion.id,
      username: userCheck.value,
      name: champion.name,
    };
  } catch (err) {
    await supabase.rpc("release_invite_code", { p_id: inviteId });
    throw err;
  }
}
