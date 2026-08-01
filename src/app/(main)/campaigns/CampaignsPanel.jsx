"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BusyRail, Spinner } from "@/components/LoadingUI";
import {
  fetchCampaignsDetailed,
  actionFocusCampaign,
  actionArchiveCampaign,
  actionRestoreCampaign,
} from "../../services/requests";
import { labelCampaignStatus } from "@/lib/helpers/statusLabels";

export default function CampaignsPanel() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [railLabel, setRailLabel] = useState("");
  const [filter, setFilter] = useState("all");
  const [archiveTarget, setArchiveTarget] = useState(null);

  const load = useCallback(async (scopeFilter) => {
    const scope = scopeFilter === "archived" ? "archived" : "active";
    const data = await fetchCampaignsDetailed(scope);
    setItems(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load(filter);
      } catch (e) {
        if (!cancelled) toast.error(e.message || "Erro ao carregar campanhas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter, load]);

  const isArchivedView = filter === "archived";

  const visible = useMemo(() => {
    if (filter === "today") return items.filter((c) => c.scheduledToday);
    return items;
  }, [items, filter]);

  const setFilterSafe = (id) => {
    setArchiveTarget(null);
    setFilter(id);
  };

  const focus = async (campaignId) => {
    setBusyId(campaignId);
    setRailLabel("Trocando frente…");
    try {
      await actionFocusCampaign(campaignId);
      setRailLabel("Frente alterada");
      await new Promise((r) => setTimeout(r, 1200));
      router.push("/");
    } catch (e) {
      toast.error(e.message || "Não foi possível ativar");
      setBusyId(null);
      setRailLabel("");
    }
  };

  const archive = async () => {
    if (!archiveTarget) return;
    const { id: campaignId } = archiveTarget;
    setBusyId(`archive-${campaignId}`);
    setRailLabel("Arquivando…");
    try {
      await actionArchiveCampaign(campaignId);
      setItems((prev) => prev.filter((c) => c.id !== campaignId));
      setArchiveTarget(null);
      setRailLabel("Frente arquivada");
      await new Promise((r) => setTimeout(r, 1200));
      setRailLabel("");
      setBusyId(null);
    } catch (e) {
      toast.error(e.message || "Não foi possível arquivar");
      setBusyId(null);
      setRailLabel("");
    }
  };

  const restore = async (campaignId) => {
    setBusyId(`restore-${campaignId}`);
    setRailLabel("Restaurando…");
    try {
      await actionRestoreCampaign(campaignId);
      setItems((prev) => prev.filter((c) => c.id !== campaignId));
      setRailLabel("Frente restaurada");
      await new Promise((r) => setTimeout(r, 1200));
      setRailLabel("");
      setBusyId(null);
    } catch (e) {
      toast.error(e.message || "Não foi possível restaurar");
      setBusyId(null);
      setRailLabel("");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-6">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-28 w-full" />
        <p className="text-center text-xs tracking-[0.18em] text-ash-400 uppercase">
          Carregando
        </p>
      </div>
    );
  }

  return (
    <>
      <BusyRail active={Boolean(railLabel)} label={railLabel} />
      <div className="mx-auto max-w-2xl space-y-6 pb-24 lg:pb-8">
        <header data-tour="tour-campaigns-header" className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-copper">
            Frentes
          </p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h1 className="font-display text-3xl text-ash-200">Campanhas</h1>
              <p className="text-sm text-ash-400">
                Suas frentes pessoais. Sugestões oficiais ficam em{" "}
                <Link href="/community" className="text-copper hover:underline">
                  Comunidade
                </Link>
                .
              </p>
            </div>
            {!isArchivedView && (
              <Link
                href="/campaigns/new"
                className="btn-primary shrink-0"
                data-tour="tour-campaigns-new"
              >
                Nova frente
              </Link>
            )}
          </div>
        </header>

        <div data-tour="tour-campaigns-filters" className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "Todas" },
            { id: "today", label: "Hoje" },
            { id: "archived", label: "Arquivadas" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterSafe(f.id)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                filter === f.id
                  ? "border-copper/50 bg-copper/15 text-copper-bright"
                  : "border-copper/15 text-ash-400 hover:border-copper/35"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!items.length ? (
          <div className="panel p-5">
            <EmptyState
              compact={isArchivedView}
              title={
                isArchivedView ? "Nenhuma frente arquivada" : "Nenhuma campanha ainda"
              }
              hint={
                isArchivedView
                  ? null
                  : "Crie a sua ou aceite uma sugestão na Comunidade."
              }
            >
              {!isArchivedView && (
                <>
                  <Link href="/community" className="btn-primary">
                    Ir à Comunidade
                  </Link>
                  <Link href="/campaigns/new" className="btn-ghost">
                    Nova frente
                  </Link>
                </>
              )}
            </EmptyState>
          </div>
        ) : !visible.length ? (
          <div className="panel p-5">
            <EmptyState compact title="Nenhuma frente agendada para hoje" />
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((c, index) => (
              <li key={c.id} className="panel space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="font-display text-xl text-ash-200">
                      {c.title}
                    </h2>
                    {c.why && (
                      <p className="text-sm text-ash-400">{c.why}</p>
                    )}
                    {c.activeMissionTitle && (
                      <p className="text-xs text-copper/90">
                        Missão: {c.activeMissionTitle}
                        {c.isFocused ? " · em foco" : ""}
                        {!isArchivedView && c.scheduledToday ? " · hoje" : ""}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full border border-copper/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ash-400">
                    {labelCampaignStatus(c.status)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-ash-400">
                    <span>
                      {c.stepsDone}/{c.stepsTotal} passos
                    </span>
                    <span>{c.progressPct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className="h-full rounded-full bg-copper transition-[width]"
                      style={{ width: `${c.progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {isArchivedView ? (
                    <>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={Boolean(busyId)}
                        onClick={() => restore(c.id)}
                      >
                        {busyId === `restore-${c.id}` ? (
                          <>
                            <Spinner />
                            Restaurando…
                          </>
                        ) : (
                          "Restaurar frente"
                        )}
                      </button>
                      <Link
                        href={`/campaigns/${c.id}/edit`}
                        className="btn-ghost"
                        {...(index === 0
                          ? { "data-tour": "tour-campaigns-edit" }
                          : {})}
                      >
                        Ver / editar
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={Boolean(busyId) || c.isFocused}
                        onClick={() => focus(c.id)}
                        {...(index === 0
                          ? { "data-tour": "tour-campaigns-focus" }
                          : {})}
                      >
                        {busyId === c.id ? (
                          <>
                            <Spinner />
                            Ativando…
                          </>
                        ) : c.isFocused ? (
                          "Em foco agora"
                        ) : (
                          "Continuar nesta frente"
                        )}
                      </button>
                      <Link
                        href={`/campaigns/${c.id}/edit`}
                        className="btn-ghost"
                        {...(index === 0
                          ? { "data-tour": "tour-campaigns-edit" }
                          : {})}
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        className="btn-ghost"
                        disabled={Boolean(busyId)}
                        onClick={() =>
                          setArchiveTarget(
                            archiveTarget?.id === c.id
                              ? null
                              : { id: c.id, title: c.title }
                          )
                        }
                        {...(index === 0
                          ? { "data-tour": "tour-campaigns-archive" }
                          : {})}
                      >
                        Arquivar
                      </button>
                    </>
                  )}
                </div>

                {!isArchivedView && archiveTarget?.id === c.id && (
                  <div className="space-y-3 rounded-lg border border-copper/25 bg-ink-950/70 p-3">
                    <p className="text-sm text-ash-200">
                      Arquivar{" "}
                      <span className="text-copper">{archiveTarget.title}</span>
                      ?
                    </p>
                    <p className="text-xs leading-relaxed text-ash-400">
                      Some da lista ativa. Você encontra de novo em Arquivadas e
                      pode restaurar.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={Boolean(busyId)}
                        onClick={archive}
                      >
                        {busyId === `archive-${c.id}` ? (
                          <>
                            <Spinner />
                            Arquivando…
                          </>
                        ) : (
                          "Confirmar arquivar"
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        disabled={Boolean(busyId)}
                        onClick={() => setArchiveTarget(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {!isArchivedView && (
          <div className="panel space-y-3 border-dashed border-copper/30 bg-copper/5 p-5">
            <h2 className="font-display text-lg text-ash-200">Comunidade</h2>
            <p className="text-sm text-ash-400">
              Protocolos oficiais, publicações da galera, desafios, Praça e
              clãs — tudo em um só lugar.
            </p>
            <Link href="/community" className="btn-primary inline-flex">
              Abrir Comunidade
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
