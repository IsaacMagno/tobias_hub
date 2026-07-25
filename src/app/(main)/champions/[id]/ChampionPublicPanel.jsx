"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Spinner } from "@/components/LoadingUI";
import StatsBars from "@/components/identity/StatsBars";
import { fetchPublicProfile } from "../../../services/requests";
import { labelCampaignStatus } from "@/lib/helpers/statusLabels";

export default function ChampionPublicPanel() {
  const params = useParams();
  const id = params?.id;
  const [card, setCard] = useState(undefined);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await fetchPublicProfile(id);
        setCard(data);
      } catch (err) {
        toast.error(err.message || "Falha");
        setCard(null);
      }
    })();
  }, [id]);

  if (card === undefined) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pb-28">
        <p className="text-sm text-ash-400">
          Perfil indisponível ou inexistente.
        </p>
        <Link href="/champions" className="text-sm text-copper hover:underline">
          ← Campeões
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-28 lg:pb-10">
      <Link href="/champions" className="text-xs text-copper/80 hover:text-copper">
        ← Campeões
      </Link>
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-ash-200">{card.name}</h1>
        <p className="text-sm text-copper/90">{card.title || "—"}</p>
        <p className="text-sm text-ash-400">
          Nv. {card.level} · {Math.floor(card.xp || 0)} XP
        </p>
        {card.biography ? (
          <p className="text-sm text-ash-300">{card.biography}</p>
        ) : null}
      </header>

      {(card.pins || []).length > 0 && (
        <section className="panel space-y-2 p-5">
          <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
            Pins
          </h2>
          <ul className="flex flex-wrap gap-2">
            {card.pins.map((p) => (
              <li
                key={p.id}
                className="rounded border border-copper/25 px-3 py-1 text-xs text-copper"
              >
                {p.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel space-y-4 p-5">
        <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
          Atributos
        </h2>
        <StatsBars statistics={card.statistics} />
      </section>

      <section className="panel space-y-3 p-5">
        <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
          Campanhas públicas
        </h2>
        {(card.campaigns || []).length === 0 ? (
          <p className="text-sm text-ash-500">Nenhuma campanha pública.</p>
        ) : (
          <ul className="space-y-2">
            {card.campaigns.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 border-b border-copper/10 pb-2 text-sm"
              >
                <span className="text-ash-200">{c.title}</span>
                <span className="text-xs text-ash-500">
                  {labelCampaignStatus(c.status)} · {c.progressPercent}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
