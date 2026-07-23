"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getChampionDataById } from "../services/requests";
import { useGlobalState } from "../services/state";

export function useRequireChampion() {
  const { data: session, status } = useSession();
  const { globalState: { champion }, setGlobalState } = useGlobalState();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function ensure() {
      if (status === "loading") return;

      if (!session?.user?.champion_id) {
        if (!cancelled) {
          setIsLoading(false);
          router.replace("/login");
        }
        return;
      }

      const championId = Number(session.user.champion_id);

      if (champion?.id === championId) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const data = await getChampionDataById(championId);
        if (!cancelled && data) {
          setGlobalState((prev) => ({ ...prev, champion: data }));
        }
      } catch {
        if (!cancelled) router.replace("/");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    ensure();

    return () => {
      cancelled = true;
    };
  }, [session, status, champion?.id, router, setGlobalState]);

  return {
    champion,
    session,
    isLoading: isLoading || status === "loading",
  };
}
