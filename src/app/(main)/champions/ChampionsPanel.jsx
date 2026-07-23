"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Spinner } from "@/components/LoadingUI";
import { fetchPublicChampions } from "../../services/requests";

export default function ChampionsPanel() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchPublicChampions();
        setItems(list || []);
      } catch (err) {
        toast.error(err.message || "Falha ao listar");
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-28 lg:pb-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-copper">
          Mundo
        </p>
        <h1 className="font-display text-3xl text-ash-200">Campeões</h1>
        <p className="text-sm text-ash-400">
          Perfis públicos para visitar e se inspirar.
        </p>
      </header>

      {busy ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-ash-500">
          Ninguém público ainda. Torne seu perfil público em Perfil.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/champions/${c.id}`}
                className="panel block p-4 transition hover:border-copper/30"
              >
                <p className="font-display text-lg text-ash-200">{c.name}</p>
                <p className="text-sm text-copper/80">
                  {c.title || "Sem título"} · Nv. {c.level}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
