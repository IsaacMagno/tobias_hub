import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createAdminClient } from "@/lib/supabase/admin";

const SECRET = process.env.SECRET;

export async function loginChampion(username, password) {
  const supabase = createAdminClient();

  const { data: auth, error } = await supabase
    .from("authentication")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error || !auth) return null;

  const valid = await bcrypt.compare(password, auth.password);
  if (!valid) return null;

  const token = jwt.sign(
    { champion_id: auth.champion_id, name: username },
    SECRET,
    { expiresIn: "1h" }
  );

  return {
    champion: auth,
    token: `Bearer ${token}`,
    isValid: true,
  };
}
