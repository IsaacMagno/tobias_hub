"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import PomodoroTimer from "./PomodoroTimer";
import { BusyRail, ContinueSkeleton, Spinner } from "@/components/LoadingUI";
import AgendaReminder from "@/components/pomodoro/AgendaReminder";
import { unlockAudio } from "@/lib/pomodoro/alarm";
import {
  fetchContinueState,
  actionEnsureDemoCampaigns,
  actionStartSession,
  actionFinishSession,
  actionCompleteStep,
  actionPauseMission,
  actionFocusCampaign,
  actionResumeMission,
} from "../../services/requests";
import { useTour } from "@/components/onboarding/TourProvider";
import {
  emitTourProgress,
  isTourDone,
  markTourDone,
} from "@/lib/onboarding/tours";

function StepRow({ step, open, onToggle }) {
  const isCurrent = step.status === "current";
  const isDone = step.status === "done";

  return (
    <li
      className={`rounded-lg border px-3 py-3 transition ${
        isCurrent
          ? "border-copper/40 bg-copper/5"
          : "border-copper/10 bg-ink-950/40"
      }`}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left"
        onClick={() => step.detail && onToggle(step.id)}
      >
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
            isDone
              ? "border-copper bg-copper text-ink-950"
              : isCurrent
                ? "border-copper text-copper"
                : "border-ash-400/40 text-ash-400"
          }`}
          aria-hidden
        >
          {isDone ? "✓" : step.order_index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm ${
              isDone ? "text-ash-400 line-through" : "text-ash-200"
            }`}
          >
            {step.surface}
          </span>
          <span className="mt-0.5 block text-xs text-ash-400">
            {step.planned_minutes ? `~${step.planned_minutes} min` : null}
            {step.detail ? (open ? " · recolher" : " · detalhe") : ""}
          </span>
          {open && step.detail && (
            <span className="mt-2 block text-sm leading-relaxed text-ash-400">
              {step.detail}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

function ActionButton({
  variant = "primary",
  busy,
  busyText,
  children,
  disabled,
  ...props
}) {
  const cls = variant === "primary" ? "btn-primary" : "btn-ghost";
  return (
    <button
      type="button"
      className={cls}
      disabled={disabled || busy}
      {...props}
    >
      {busy ? (
        <>
          <Spinner />
          {busyText || children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default function ContinuePanel() {
  const tour = useTour();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rail, setRail] = useState({ active: false, label: "" });
  const [openId, setOpenId] = useState(null);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseNote, setPauseNote] = useState("");
  const [timerEpoch, setTimerEpoch] = useState(0);
  const sessionIdRef = useRef(null);
  const elapsedRef = useRef(0);
  const railTimerRef = useRef(null);

  const applyState = useCallback((next) => {
    setState(next);
    if (next?.currentStep?.id) setOpenId(next.currentStep.id);
    if (next?.runningSession?.id) {
      sessionIdRef.current = next.runningSession.id;
    } else {
      sessionIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!tour?.setMissionHint) return;
    if (loading) {
      tour.setMissionHint(null);
      return;
    }
    const hasMission = Boolean(state && !state.empty && state.mission);
    tour.setMissionHint(hasMission);
    if (
      hasMission &&
      tour.championId &&
      !isTourDone(tour.championId, "continue")
    ) {
      markTourDone(tour.championId, "continue");
      emitTourProgress();
    }
  }, [tour, loading, state]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const continueState = await fetchContinueState();
        if (!cancelled) applyState(continueState);
      } catch (e) {
        toast.error(e.message || "Erro ao carregar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyState]);

  useEffect(() => {
    return () => {
      if (railTimerRef.current) clearTimeout(railTimerRef.current);
    };
  }, []);

  const withBusy = async (label, fn, { doneLabel } = {}) => {
    if (railTimerRef.current) clearTimeout(railTimerRef.current);
    setBusy(true);
    setRail({ active: true, label });
    try {
      const resultLabel = await fn();
      const flash = doneLabel || resultLabel || null;
      if (flash) {
        setBusy(false);
        setRail({ active: true, label: flash });
          railTimerRef.current = setTimeout(() => {
          setRail({ active: false, label: "" });
          railTimerRef.current = null;
        }, flash.includes("XP") ? 2200 : 1400);
      } else {
        setBusy(false);
        setRail({ active: false, label: "" });
      }
    } catch (e) {
      setBusy(false);
      setRail({ active: false, label: "" });
      toast.error(e.message || "Falha na ação");
    }
  };

  const stopTimerLocally = () => {
    setTimerEpoch((n) => n + 1);
    elapsedRef.current = 0;
  };

  const abortSessionBg = () => {
    if (!sessionIdRef.current) return;
    const sid = sessionIdRef.current;
    sessionIdRef.current = null;
    actionFinishSession(sid, elapsedRef.current, "aborted").catch(() => {});
  };

  const handleSeed = () =>
    withBusy("Preparando campanhas…", async () => {
      applyState(await actionEnsureDemoCampaigns());
      stopTimerLocally();
      toast.success("Campanhas demo prontas");
    });

  const handleComplete = () =>
    withBusy("Concluindo passo…", async () => {
      if (!state?.currentStep) return null;
      const prevMissionId = state.mission?.id;
      stopTimerLocally();
      const next = await actionCompleteStep(
        state.currentStep.id,
        elapsedRef.current,
        sessionIdRef.current
      );
      sessionIdRef.current = null;
      elapsedRef.current = 0;
      applyState(next);

      const reward = next?.reward;
      if (reward?.xpGained || reward?.attrGained) {
        const bits = [];
        if (reward.xpGained) {
          bits.push(
            reward.leveledUp
              ? `+${reward.xpGained} XP · Nível ${reward.level}`
              : `+${reward.xpGained} XP`
          );
        }
        if (reward.attrGained) {
          bits.push(`+${reward.attrGained} ${reward.attrShort || "ATR"}`);
        }
        if (reward.newAchievements?.length) {
          bits.push(`Marco: ${reward.newAchievements[0].title}`);
        }
        return bits.join(" · ");
      }
      if (next?.empty) {
        toast.success("Missão concluída — sem próximo foco por agora");
      } else if (next?.mission?.id && next.mission.id !== prevMissionId) {
        toast.success("Missão concluída — próximo foco pronto");
      } else {
        toast.success("Passo concluído");
      }
      return null;
    });

  const handlePause = () =>
    withBusy("Pausando missão…", async () => {
      if (!state?.mission) return;
      abortSessionBg();
      stopTimerLocally();
      const next = await actionPauseMission(state.mission.id, pauseNote);
      applyState(next);
      setPauseOpen(false);
      setPauseNote("");
      toast.success("Missão pausada");
    });

  const handleResume = () =>
    withBusy("Retomando…", async () => {
      if (!state?.mission) return;
      applyState(await actionResumeMission(state.mission.id));
      toast.success("Missão retomada");
    });

  const handleSwitchCampaign = (campaignId) => {
    if (campaignId === state.campaign.id) return;
    return withBusy(
      "Trocando frente…",
      async () => {
        abortSessionBg();
        stopTimerLocally();
        applyState(await actionFocusCampaign(campaignId));
      },
      { doneLabel: "Frente alterada" }
    );
  };

  if (loading) {
    return <ContinueSkeleton />;
  }

  if (!state || state.empty) {
    const hasCampaigns = (state?.campaigns || []).length > 0;
    return (
      <>
        <BusyRail active={rail.active} label={rail.label} />
        <div className="mx-auto max-w-lg space-y-6 py-10">
          <header data-tour="tour-continue-header" className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-copper">
              Continuar
            </p>
            <h1 className="font-display text-3xl text-ash-200">Continuar</h1>
          </header>
          <div data-tour="tour-continue-empty" className="space-y-4">
            <p className="leading-relaxed text-ash-400">
              {state?.message ||
                "Ainda não há campanha em foco. Crie a sua primeira frente — ou use o demo para testar o motor."}
            </p>
            <div className="flex flex-wrap gap-2">
              {hasCampaigns ? (
                <Link href="/campaigns" className="btn-primary inline-flex">
                  Abrir Campanhas
                </Link>
              ) : (
                <>
                  <Link href="/campaigns/new" className="btn-primary inline-flex">
                    Criar primeira campanha
                  </Link>
                  <ActionButton
                    variant="ghost"
                    busy={busy}
                    busyText="Preparando…"
                    onClick={handleSeed}
                  >
                    Preparar campanhas demo
                  </ActionButton>
                </>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  const current = state.currentStep;
  const campaigns = state.campaigns || [];
  const planned =
    current?.planned_minutes || state.mission?.planned_minutes || 25;
  const isPaused = state.mission.status === "paused";

  return (
    <>
      <AgendaReminder
        enabled
        agendaToday={state.agendaToday}
        timeOfDay={state.mission?.time_of_day}
        missionTitle={state.mission?.title}
      />
      <BusyRail active={rail.active} label={rail.label} />
      <div
        className={`mx-auto flex w-full max-w-3xl flex-col gap-6 pb-24 transition-opacity lg:pb-8 ${
          busy ? "opacity-80" : "opacity-100"
        }`}
      >
        <header data-tour="tour-continue-header" className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.22em] text-copper">
              Continuar
            </p>
            {state.champion?.level != null && (
              <span className="rounded-full border border-copper/35 bg-copper/10 px-2.5 py-0.5 text-[11px] tabular-nums text-copper-bright">
                Nv. {state.champion.level}
                {state.champion.xp != null
                  ? ` · ${Math.floor(Number(state.champion.xp))} XP`
                  : ""}
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl leading-tight text-ash-200 sm:text-4xl">
            {state.mission.title}
          </h1>
          {state.mission.why && (
            <p className="max-w-xl text-sm leading-relaxed text-ash-400">
              {state.mission.why}
            </p>
          )}
          <p className="text-xs text-ash-400">
            <span className="text-ash-300">{state.campaign.title}</span>
            <span className="mx-2 text-ink-600">/</span>
            {state.chapter.title}
          </p>
          {state.agendaToday && state.agendaLabel && (
            <div className="max-w-md rounded-lg border border-copper/25 bg-copper/10 px-3 py-2 text-sm text-ash-200">
              Hoje é o dia sugerido desta missão
              <span className="mt-0.5 block text-xs text-copper/90">
                {state.agendaLabel}
              </span>
            </div>
          )}
          {state.agendaLabel && !state.agendaToday && (
            <p className="text-xs text-copper/80">
              Agenda: {state.agendaLabel}
              {" · (não é o dia sugerido — sem cobrança)"}
            </p>
          )}
          {typeof state.progressPct === "number" && state.stepsTotal > 0 && (
            <div className="max-w-md space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] text-ash-400">
                <span>
                  Progresso da missão · {state.stepsDone}/{state.stepsTotal}
                </span>
                <span>{state.progressPct}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full bg-copper/80 transition-[width] duration-500"
                  style={{ width: `${state.progressPct}%` }}
                />
              </div>
            </div>
          )}
          {isPaused && (
            <p className="text-xs text-ember-soft">
              Missão pausada — use Retomar para voltar ao foco, ou troque de
              frente.
            </p>
          )}
        </header>

        {campaigns.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {campaigns.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  c.id === state.campaign.id
                    ? "border-copper/50 bg-copper/15 text-copper-bright"
                    : "border-copper/15 text-ash-400 hover:border-copper/35"
                }`}
                onClick={() => handleSwitchCampaign(c.id)}
                disabled={busy}
              >
                {busy && c.id !== state.campaign.id ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Spinner className="h-2.5 w-2.5" />
                    {c.title}
                  </span>
                ) : (
                  c.title
                )}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section data-tour="tour-continue-steps" className="panel space-y-4 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
                Passos
              </h2>
              {current && (
                <span className="text-xs text-copper">
                  Agora · passo {current.order_index + 1}
                </span>
              )}
            </div>

            {state.resumeNote && (
              <p className="rounded-lg border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ash-200">
                Onde você parou: {state.resumeNote}
              </p>
            )}

            <ol className="space-y-2">
              {state.steps.map((step) => (
                <StepRow
                  key={step.id}
                  step={step}
                  open={openId === step.id}
                  onToggle={(id) =>
                    setOpenId((prev) => (prev === id ? null : id))
                  }
                />
              ))}
            </ol>

            <div className="flex flex-wrap gap-2 pt-1">
              {isPaused ? (
                <ActionButton
                  busy={busy}
                  busyText="Retomando…"
                  onClick={handleResume}
                >
                  Retomar missão
                </ActionButton>
              ) : (
                <ActionButton
                  busy={busy}
                  busyText="Concluindo…"
                  disabled={!current}
                  onClick={handleComplete}
                >
                  Concluir passo
                </ActionButton>
              )}
              <ActionButton
                variant="ghost"
                busy={false}
                disabled={busy || !state.mission || isPaused}
                onClick={() => setPauseOpen((v) => !v)}
              >
                Pausar missão
              </ActionButton>
            </div>

            {pauseOpen && !isPaused && (
              <div className="space-y-2 rounded-lg border border-copper/20 bg-ink-950/60 p-3">
                <p className="text-xs leading-relaxed text-ash-400">
                  <strong className="text-ash-300">Pausar missão</strong>{" "}
                  guarda esta frente e para o timer. A{" "}
                  <strong className="text-ash-300">nota de retomada</strong> é
                  um lembrete do ponto exato (ex.: “parei na remada 2/3”).
                </p>
                <label className="block space-y-1">
                  <span className="text-xs text-ash-400">Nota de retomada</span>
                  <input
                    className="input-field"
                    value={pauseNote}
                    onChange={(e) => setPauseNote(e.target.value)}
                    placeholder="Ex.: parei na remada 2/3"
                  />
                </label>
                <ActionButton
                  busy={busy}
                  busyText="Pausando…"
                  onClick={handlePause}
                >
                  Confirmar pausa (para o timer)
                </ActionButton>
              </div>
            )}
          </section>

          <div data-tour="tour-continue-timer">
            <PomodoroTimer
              key={`${current?.id ?? "none"}-${timerEpoch}`}
              resetKey={`${current?.id ?? "none"}-${timerEpoch}`}
              plannedMinutes={planned}
              label={current?.surface || state.mission.title}
              stepId={current?.id}
              disabled={isPaused || !current}
              onStart={async () => {
                await unlockAudio();
                if (!current) return;
                const session = await actionStartSession(current.id, planned);
                sessionIdRef.current = session.id;
                elapsedRef.current = 0;
              }}
              onStop={(elapsed, status) => {
                elapsedRef.current = elapsed;
                if (sessionIdRef.current && status === "aborted") {
                  const sid = sessionIdRef.current;
                  sessionIdRef.current = null;
                  actionFinishSession(sid, elapsed, "aborted").catch(() => {});
                }
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
