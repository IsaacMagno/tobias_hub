"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { BusyRail, Spinner } from "@/components/LoadingUI";
import StatsBars from "@/components/identity/StatsBars";
import {
  fetchMyProfile,
  actionUpdateChampionBio,
  actionUpdateProfileVisibility,
  actionSetChampionPins,
} from "../../services/requests";

export default function ProfilePanel() {
  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(true);
  const [rail, setRail] = useState("");
  const [pinDraft, setPinDraft] = useState([]);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const data = await fetchMyProfile();
      setProfile(data);
      setBio(data.biography || "");
      setPinDraft((data.pins || []).map((p) => Number(p.id)));
    } catch (err) {
      toast.error(err.message || "Falha ao carregar perfil");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveBio = async () => {
    if (!profile) return;
    setRail("Salvando bio…");
    try {
      await actionUpdateChampionBio(profile.id, bio);
      setRail("Bio salva");
      setTimeout(() => setRail(""), 1000);
    } catch (err) {
      toast.error(err.message || "Falha ao salvar");
      setRail("");
    }
  };

  const toggleVisibility = async () => {
    if (!profile) return;
    const next =
      profile.profile_visibility === "public" ? "private" : "public";
    setRail(next === "public" ? "Tornando público…" : "Tornando privado…");
    try {
      const data = await actionUpdateProfileVisibility(next);
      setProfile(data);
      setRail(next === "public" ? "Perfil público" : "Perfil privado");
      setTimeout(() => setRail(""), 1200);
    } catch (err) {
      toast.error(err.message || "Falha");
      setRail("");
    }
  };

  const togglePin = (achievementId) => {
    const id = Number(achievementId);
    setPinDraft((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        toast.error("Máximo de 3 pins");
        return prev;
      }
      return [...prev, id];
    });
  };

  const savePins = async () => {
    setRail("Salvando pins…");
    try {
      const pins = await actionSetChampionPins(pinDraft);
      setProfile((p) => ({ ...p, pins }));
      setRail("Pins salvos");
      setTimeout(() => setRail(""), 1000);
    } catch (err) {
      toast.error(err.message || "Falha ao salvar pins");
      setRail("");
    }
  };

  if (busy && !profile) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-28 lg:pb-10">
      <BusyRail active={Boolean(rail)} label={rail} />
      <header data-tour="tour-profile-header" className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-copper">
          Identidade
        </p>
        <h1 className="font-display text-3xl text-ash-200">{profile.name}</h1>
        <p className="text-sm text-copper/90">
          {profile.title || "Sem título ainda"}
        </p>
        <p className="text-sm text-ash-400">
          Nv. {profile.level} · {Math.floor(profile.xp || 0)} XP
        </p>
      </header>

      <section data-tour="tour-profile-visibility" className="panel space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
            Visibilidade do perfil
          </h2>
          <button type="button" className="btn-ghost text-xs" onClick={toggleVisibility}>
            {profile.profile_visibility === "public" ? "Público" : "Privado"} — tocar para alternar
          </button>
        </div>
        {profile.profile_visibility === "public" ? (
          <p className="text-sm text-ash-400">
            Outros campeões podem te visitar.{" "}
            <Link href={`/champions/${profile.id}`} className="text-copper hover:underline">
              Como os outros te veem →
            </Link>
          </p>
        ) : (
          <p className="text-sm text-ash-500">
            Perfil privado — não aparece em Campeões.
          </p>
        )}
      </section>

      <section data-tour="tour-profile-attrs" className="panel space-y-4 p-5">
        <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
          Atributos
        </h2>
        <StatsBars statistics={profile.statistics} />
      </section>

      <div data-tour="tour-profile-bio" className="space-y-6">
        <section className="panel space-y-3 p-5">
          <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
            Biografia
          </h2>
          <textarea
            className="input-field min-h-[100px]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Quem você é nesta jornada…"
          />
          <button type="button" className="btn-primary" onClick={saveBio}>
            Salvar bio
          </button>
        </section>

        <section className="panel space-y-4 p-5">
          <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
            Marcos / conquistas
          </h2>
          {(profile.achievements || []).length === 0 ? (
            <p className="text-sm text-ash-500">
              Ainda nenhum marco — conclua passos e capítulos.
            </p>
          ) : (
            <ul className="space-y-2">
              {profile.achievements.map((a) => {
                const pinned = pinDraft.includes(Number(a.id));
                return (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-3 border-b border-copper/10 pb-2"
                  >
                    <div>
                      <p className="text-sm text-ash-200">{a.title}</p>
                      <p className="text-xs text-ash-500">{a.description}</p>
                    </div>
                    <button
                      type="button"
                      className={`shrink-0 rounded border px-2 py-1 text-[10px] uppercase tracking-wider ${
                        pinned
                          ? "border-copper/50 text-copper"
                          : "border-ink-700 text-ash-500"
                      }`}
                      onClick={() => togglePin(a.id)}
                    >
                      {pinned ? "Pin" : "Fixar"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {(profile.achievements || []).length > 0 && (
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={savePins}
            >
              Salvar pins (máx. 3)
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
