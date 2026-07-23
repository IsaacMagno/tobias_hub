import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/app/api/auth/[...nextauth]/route";

export async function requireChampionSession() {
  const session = await getServerSession(nextAuthOptions);
  if (!session?.user?.champion_id) {
    throw new Error("Não autenticado");
  }
  return session;
}
