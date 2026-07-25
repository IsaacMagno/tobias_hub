"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { BusyRail, Spinner } from "@/components/LoadingUI";
import { formatClock } from "@/lib/pomodoro/settings";
import { usePomodoro } from "@/components/pomodoro/PomodoroProvider";
import { requestAlarmPermissions } from "@/lib/pomodoro/alarm";
import {
  fetchContinueState,
  actionCompleteStep,
} from "../../services/requests";
import FloatTimerButton from "@/components/pomodoro/FloatTimerButton";

export default function TimerPanel() {
  const {
    settings,
    setSettings,
    phase,
    running,
    remaining,
    plannedSeconds,
    label,
    source,
    pendingLog,
    clearPendingLog,
    startFocus,
    startBreak,
    pause,
    resume,
    stop,
  } = usePomodoro();

  const [notifState, setNotifState] = useState("unknown");
  const [busy, setBusy] = useState(false);
  const [rail, setRail] = useState("");
  const [continueState, setContinueState] = useState(null);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotifState(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!pendingLog) return undefined;
    let cancelled = false;

    const load = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      try {
        const state = await fetchContinueState();
        if (!cancelled) setContinueState(state);
      } catch {
        if (!cancelled) setContinueState(null);
      }
    };

    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };

    void load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pendingLog]);

  const progress =
    plannedSeconds > 0
      ? ((plannedSeconds - remaining) / plannedSeconds) * 100
      : 0;

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("Notificações não disponíveis neste browser");
      return;
    }
    const { notification: perm } = await requestAlarmPermissions();
    setNotifState(perm);
    if (perm === "granted") {
      toast.success("Lembretes liberados");
    } else if (perm === "unsupported") {
      toast.error("Notificações não disponíveis neste browser");
    } else {
      toast.error("Permissão negada");
    }
  };

  const startFree = async () => {
    await startFocus({
      source: "free",
      nextSource: "free",
      nextLabel: "Pomodoro livre",
      minutes: settings.focusMinutes,
    });
  };

  const linkToStep = async () => {
    if (!continueState?.currentStep || busy) return;
    setBusy(true);
    setRail("Registrando no passo…");
    try {
      await actionCompleteStep(
        continueState.currentStep.id,
        pendingLog?.elapsedSeconds || settings.focusMinutes * 60,
        null
      );
      clearPendingLog();
      setRail("+ passo concluído");
      await new Promise((r) => setTimeout(r, 1200));
      setRail("");
      toast.success("Passo marcado a partir do pomodoro livre");
    } catch (e) {
      toast.error(e.message || "Falha ao marcar");
      setRail("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <BusyRail active={Boolean(rail)} label={rail} />
      <div className="mx-auto max-w-lg space-y-6 pb-28 lg:pb-10">
          <header data-tour="tour-timer-header" className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-copper">
            Timer
          </p>
          <h1 className="font-display text-3xl text-ash-200">Pomodoro livre</h1>
          <p className="text-sm text-ash-400">
            Monte o bloco de foco e descanso do seu jeito. No PC, Flutuar deixa
            o cronômetro sempre visível por cima dos outros apps.
          </p>
        </header>

        <section data-tour="tour-timer-controls" className="panel space-y-4 p-5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-ash-400">
              {phase === "break"
                ? "Descanso"
                : phase === "focus"
                  ? "Foco"
                  : "Pronto"}
            </p>
            <p className="text-xs text-ash-400">
              {source === "mission" ? "Missão" : "Livre"}
              {label ? ` · ${label}` : ""}
            </p>
          </div>

          <p className="font-display text-5xl tabular-nums text-ash-200">
            {formatClock(remaining)}
          </p>

          <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
            <div
              className="h-full rounded-full bg-copper transition-[width]"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {phase === "break" && !running ? (
              <button type="button" className="btn-primary" onClick={startBreak}>
                Iniciar descanso
              </button>
            ) : phase === "idle" ||
              (!running && remaining === plannedSeconds) ? (
              <button type="button" className="btn-primary" onClick={startFree}>
                Iniciar foco
              </button>
            ) : running ? (
              <button type="button" className="btn-primary" onClick={pause}>
                Pausar
              </button>
            ) : remaining > 0 ? (
              <button type="button" className="btn-primary" onClick={resume}>
                Continuar
              </button>
            ) : null}

            {phase === "focus" && !running && remaining === 0 && (
              <button type="button" className="btn-primary" onClick={startBreak}>
                Iniciar descanso
              </button>
            )}

            {phase !== "idle" && (
              <>
                <button type="button" className="btn-ghost" onClick={stop}>
                  Encerrar
                </button>
                <FloatTimerButton phase={phase} />
              </>
            )}
          </div>
          <p className="text-xs text-ash-400">
            No PC (Chrome/Edge ou PWA), com o timer rodando: toque em{" "}
            <strong className="text-ash-300">Flutuar</strong> para abrir a
            janelinha por cima de tudo. No celular, deixe o Tobias aberto.
          </p>
        </section>

        <section data-tour="tour-timer-settings" className="panel space-y-4 p-5">
          <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
            Seus tempos
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs text-ash-400">Foco (min)</span>
              <input
                className="input-field"
                type="number"
                min={1}
                max={180}
                value={settings.focusMinutes}
                disabled={running}
                onChange={(e) =>
                  setSettings({ focusMinutes: e.target.value })
                }
                placeholder="25"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-ash-400">Descanso (min)</span>
              <input
                className="input-field"
                type="number"
                min={1}
                max={60}
                value={settings.breakMinutes}
                disabled={running}
                onChange={(e) =>
                  setSettings({ breakMinutes: e.target.value })
                }
                placeholder="5"
              />
            </label>
          </div>
          <p className="text-xs leading-relaxed text-ash-400">
            O clássico é 25 de foco e 5 de descanso — mas o melhor ciclo é o que
            você sustenta. Ajuste os minutos e teste o que encaixa no seu ritmo.
          </p>
        </section>

        <section className="panel space-y-3 p-5">
          <h2 className="text-xs uppercase tracking-[0.18em] text-ash-400">
            Despertador / lembrete
          </h2>
          <p className="text-sm text-ash-400">
            No Android (PWA), ao iniciar o foco o Tobias mantém um áudio discreto
            + notificação “em andamento” para o alarme conseguir tocar com a tela
            bloqueada. Autorize notificações e, se o Android economizar bateria
            demais, tire o Tobias da otimização de bateria.
          </p>
          <button type="button" className="btn-ghost" onClick={enableNotifications}>
            {notifState === "granted"
              ? "Notificações ativas"
              : "Ativar som e notificações"}
          </button>
        </section>

        {pendingLog && (
          <section className="panel space-y-3 border-copper/30 p-5">
            <h2 className="font-display text-lg text-ash-200">
              O que você fez neste foco?
            </h2>
            <p className="text-sm text-ash-400">
              Sessão livre de ~{Math.round((pendingLog.elapsedSeconds || 0) / 60)}{" "}
              min. Opcional: marcar o passo atual da missão em foco.
            </p>
            {continueState?.currentStep ? (
              <p className="text-sm text-copper/90">
                Passo atual: {continueState.currentStep.surface}
              </p>
            ) : (
              <p className="text-sm text-ash-400">
                Nenhuma missão em foco agora.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {continueState?.currentStep && (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={linkToStep}
                >
                  {busy ? (
                    <>
                      <Spinner />
                      Marcando…
                    </>
                  ) : (
                    "Marcar passo atual"
                  )}
                </button>
              )}
              <Link href="/" className="btn-ghost">
                Ir para Continuar
              </Link>
              <button
                type="button"
                className="btn-ghost"
                onClick={clearPendingLog}
              >
                Só fechar
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
