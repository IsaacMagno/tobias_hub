import { createAdminClient } from "@/lib/supabase/admin";

export async function getAllFiles() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("files").select("*");
  if (error) throw error;
  return data;
}
