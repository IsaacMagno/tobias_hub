"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BusyRail, Spinner } from "@/components/LoadingUI";
import {
  fetchCampaignsDetailed,
  actionFocusCampaign,
  actionEnsureFinanceCampaign,
  actionArchiveCampaign,
  actionRestoreCampaign,
} from "../../services/requests";
import { labelCampaignStatus } from "@/lib/helpers/statusLabels";

const FINANCE_TITLE = "Organizar finanças";

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
  const hasFinance = items.some((c) => c.title === FINANCE_TITLE);

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

  const addFinance = async () => {
    setBusyId("finance");
    setRailLabel("Preparando frente…");
    try {
      const res = await actionEnsureFinanceCampaign();
      setItems(res.items);
      setRailLabel(res.created ? "Frente adicionada" : "Já estava pronta");
      await new Promise((r) => setTimeout(r, 1200));
      setRailLabel("");
      setBusyId(null);
    } catch (e) {
      toast.error(e.message || "Não foi possível adicionar");
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
                Escolha uma frente para focar.
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
          <div className="panel space-y-3 p-5">
            <p className="text-sm text-ash-400">
              {isArchivedView
                ? "Nenhuma frente arquivada."
                : "Nenhuma campanha ainda. Vá em Continuar e prepare o demo."}
            </p>
            {!isArchivedView && (
              <Link href="/" className="btn-primary inline-flex">
                Ir para Continuar
              </Link>
            )}
          </div>
        ) : !visible.length ? (
          <div className="panel p-5">
            <p className="text-sm text-ash-400">
              Nenhuma frente agenda para hoje.
            </p>
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

        {!isArchivedView && items.length > 0 && !hasFinance && (
          <div className="panel space-y-3 border-dashed p-5">
            <h2 className="font-display text-lg text-ash-200">
              Nova frente · Finanças
            </h2>
            <p className="text-sm text-ash-400">
              Foto rápida do mês, uma regra só, e uma checagem semanal — sem
              planilha infinita.
            </p>
            <button
              type="button"
              className="btn-ghost"
              disabled={Boolean(busyId)}
              onClick={addFinance}
            >
              {busyId === "finance" ? (
                <>
                  <Spinner />
                  Preparando…
                </>
              ) : (
                "Adicionar Organizar finanças"
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
