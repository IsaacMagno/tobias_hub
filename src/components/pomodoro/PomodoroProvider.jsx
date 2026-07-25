"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_POMODORO,
  loadPomodoroSettings,
  savePomodoroSettings,
  resolveMinutes,
} from "@/lib/pomodoro/settings";
import {
  notifyAlarm,
  unlockAudio,
  startTimerKeepAlive,
  stopTimerKeepAlive,
  showRunningTimerNotification,
  clearRunningTimerNotification,
  scheduleServiceWorkerAlarm,
  cancelServiceWorkerAlarm,
} from "@/lib/pomodoro/alarm";
import {
  savePostAlarmSnapshot,
  loadPostAlarmSnapshot,
  peekPostAlarmSnapshot,
  peekReloadFlag,
  consumeReloadFlag,
  markSnapshotAlarmPlayed,
  clearPostAlarmRecovery,
} from "@/lib/pomodoro/recovery";

const PomodoroContext = createContext(null);

function remainingFromEndsAt(endsAt) {
  if (!endsAt) return 0;
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

function isDocumentHidden() {
  return (
    typeof document !== "undefined" && document.visibilityState !== "visible"
  );
}

export function PomodoroProvider({ children }) {
  const [settings, setSettingsState] = useState(DEFAULT_POMODORO);
  const [phase, setPhase] = useState("idle");
  const [source, setSource] = useState("free");
  const [label, setLabel] = useState("");
  const [stepId, setStepId] = useState(null);
  const [running, setRunning] = useState(false);
  const [endsAt, setEndsAt] = useState(null);
  const [plannedSeconds, setPlannedSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [pendingLog, setPendingLog] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const tickRef = useRef(null);
  const wakeLockRef = useRef(null);
  const handledEndRef = useRef(null);
  const phaseRef = useRef(phase);
  const sourceRef = useRef(source);
  const labelRef = useRef(label);
  const settingsRef = useRef(settings);
  const plannedRef = useRef(plannedSeconds);

  phaseRef.current = phase;
  sourceRef.current = source;
  labelRef.current = label;
  settingsRef.current = settings;
  plannedRef.current = plannedSeconds;

  // Restaura estado pós-alarme (depois do reload ao desbloquear).
  useEffect(() => {
    setSettingsState(loadPomodoroSettings());
    const snap = loadPostAlarmSnapshot();
    if (snap && typeof snap === "object") {
      if (snap.phase) setPhase(snap.phase);
      if (snap.source) setSource(snap.source);
      if (typeof snap.label === "string") setLabel(snap.label);
      if (snap.stepId != null) setStepId(snap.stepId);
      if (typeof snap.plannedSeconds === "number") {
        setPlannedSeconds(snap.plannedSeconds);
      }
      if (typeof snap.remaining === "number") setRemaining(snap.remaining);
      if (snap.pendingLog) setPendingLog(snap.pendingLog);
      setRunning(false);
      setEndsAt(null);
      // Se o alarme não tocou no desbloqueio, toca agora (página visível).
      if (snap.shouldRing && snap.alarm) {
        window.setTimeout(() => {
          void notifyAlarm(snap.alarm).catch(() => {});
        }, 350);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (phase !== "idle" || running) return;
    const mins = Number(settings.focusMinutes);
    if (!Number.isFinite(mins) || mins < 1) return;
    // Não sobrescreve restauração de descanso pós-alarme.
    if (peekReloadFlag()) return;
    const sec = mins * 60;
    setPlannedSeconds(sec);
    setRemaining(sec);
  }, [settings.focusMinutes, phase, running, hydrated]);

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const finishBlock = useCallback((endsAtValue) => {
    try {
      if (handledEndRef.current === endsAtValue) return;
      handledEndRef.current = endsAtValue;

      clearTick();
      stopTimerKeepAlive();
      void clearRunningTimerNotification();

      const was = phaseRef.current;
      const wasSource = sourceRef.current;
      const wasLabel = labelRef.current;
      const planned = plannedRef.current;
      const cfg = settingsRef.current;
      const hidden = isDocumentHidden();

      const alarmPayload = {
        title:
          was === "focus"
            ? "Foco concluído — Tobias"
            : "Descanso acabou — Tobias",
        body:
          was === "focus"
            ? wasLabel || "Hora de uma pausa."
            : "Pronto para outro bloco de foco.",
        tag: `tobias-pomodoro-${was}`,
      };

      const breakSec =
        resolveMinutes(cfg.breakMinutes, DEFAULT_POMODORO.breakMinutes, 60) *
        60;
      const focusSec =
        resolveMinutes(cfg.focusMinutes, DEFAULT_POMODORO.focusMinutes) * 60;

      let nextPhase = "idle";
      let nextPlanned = focusSec;
      let nextRemaining = focusSec;
      let nextPending = null;

      if (was === "focus") {
        nextPhase = "break";
        nextPlanned = breakSec;
        nextRemaining = breakSec;
        if (wasSource === "free") {
          nextPending = {
            label: wasLabel || "Pomodoro livre",
            elapsedSeconds: planned,
            finishedAt: new Date().toISOString(),
          };
        }
      }

      // Tela bloqueada: áudio quase sempre falha. Salva estado + alarme para
      // tocar ao desbloquear; deixa o SW tentar notificar enquanto isso.
      if (hidden) {
        savePostAlarmSnapshot({
          phase: nextPhase,
          source: wasSource,
          label: was === "focus" ? wasLabel : "",
          stepId: null,
          plannedSeconds: nextPlanned,
          remaining: nextRemaining,
          pendingLog: nextPending,
          alarm: alarmPayload,
          shouldRing: true,
        });
        // Tenta agora (pode falhar) — NÃO cancela o SW (backup de notificação).
        void notifyAlarm(alarmPayload).catch(() => {});
        setRunning(false);
        setEndsAt(null);
        setRemaining(0);
        return;
      }

      void cancelServiceWorkerAlarm();
      void notifyAlarm(alarmPayload).catch(() => {});
      clearPostAlarmRecovery();

      setRunning(false);
      setEndsAt(null);
      if (nextPending) setPendingLog(nextPending);
      setPhase(nextPhase);
      setPlannedSeconds(nextPlanned);
      setRemaining(nextRemaining);
      if (was !== "focus") {
        setLabel("");
        setStepId(null);
      }
    } catch (err) {
      console.error("[pomodoro] finishBlock", err);
    }
  }, []);

  const syncRemaining = useCallback(() => {
    if (!endsAt) return;
    const left = remainingFromEndsAt(endsAt);
    if (left > 0) {
      setRemaining(left);
      return;
    }
    setRemaining(0);
    finishBlock(endsAt);
  }, [endsAt, finishBlock]);

  useEffect(() => {
    if (!running || !endsAt) {
      clearTick();
      return undefined;
    }
    syncRemaining();
    tickRef.current = setInterval(syncRemaining, 250);
    const delay = Math.max(0, endsAt - Date.now()) + 50;
    const endId = window.setTimeout(() => finishBlock(endsAt), delay);
    return () => {
      clearTick();
      window.clearTimeout(endId);
    };
  }, [running, endsAt, syncRemaining, finishBlock]);

  // Keep-alive + notificação + SW backup enquanto roda
  useEffect(() => {
    if (!running || !endsAt) {
      stopTimerKeepAlive();
      void clearRunningTimerNotification();
      return undefined;
    }

    const was = phaseRef.current;
    const currentLabel = labelRef.current;
    void startTimerKeepAlive();
    void showRunningTimerNotification({
      title:
        was === "break"
          ? "Tobias · descanso em andamento"
          : "Tobias · foco em andamento",
      body: currentLabel
        ? `${currentLabel} — o alarme toca ao terminar.`
        : "O alarme toca ao terminar o bloco.",
    });
    void scheduleServiceWorkerAlarm({
      endsAt,
      title:
        was === "break" ? "Descanso acabou — Tobias" : "Foco concluído — Tobias",
      body:
        was === "break"
          ? "Pronto para outro bloco de foco."
          : currentLabel || "Hora de uma pausa.",
      tag: `tobias-pomodoro-${was || "focus"}`,
    });

    return () => {
      stopTimerKeepAlive();
      void clearRunningTimerNotification();
    };
  }, [running, endsAt]);

  // Ao desbloquear: toca o alarme (agora a página está visível) e depois recarrega.
  useEffect(() => {
    let reloadTimer = null;
    let recovering = false;

    const recover = () => {
      if (document.visibilityState !== "visible") return;

      if (!peekReloadFlag()) {
        if (running) {
          syncRemaining();
          void startTimerKeepAlive();
        }
        return;
      }
      if (recovering) return;
      recovering = true;

      const snap = peekPostAlarmSnapshot();
      const alarm = snap?.alarm;

      const doReload = () => {
        markSnapshotAlarmPlayed();
        consumeReloadFlag();
        window.location.reload();
      };

      // Prioridade: ouvir o alarme no desbloqueio (áudio só funciona visível).
      if (alarm) {
        void notifyAlarm(alarm)
          .catch(() => {})
          .finally(() => {
            reloadTimer = window.setTimeout(doReload, 3200);
          });
      } else {
        reloadTimer = window.setTimeout(doReload, 200);
      }
    };

    document.addEventListener("visibilitychange", recover);
    window.addEventListener("pageshow", recover);
    recover();

    return () => {
      document.removeEventListener("visibilitychange", recover);
      window.removeEventListener("pageshow", recover);
      if (reloadTimer) window.clearTimeout(reloadTimer);
    };
  }, [running, syncRemaining]);

  useEffect(() => {
    if (!running) {
      const lock = wakeLockRef.current;
      wakeLockRef.current = null;
      if (lock) void Promise.resolve(lock.release?.()).catch(() => {});
      return undefined;
    }

    let cancelled = false;
    const request = async () => {
      if (cancelled || !navigator.wakeLock) return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          void Promise.resolve(lock.release?.()).catch(() => {});
          return;
        }
        wakeLockRef.current = lock;
      } catch {
        /* ignore */
      }
    };
    void request();
    const onVis = () => {
      if (document.visibilityState === "visible" && !cancelled) void request();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      const lock = wakeLockRef.current;
      wakeLockRef.current = null;
      if (lock) void Promise.resolve(lock.release?.()).catch(() => {});
    };
  }, [running]);

  const setSettings = (patch) => {
    setSettingsState((prev) => savePomodoroSettings({ ...prev, ...patch }));
  };

  const startPhase = useCallback(
    async ({
      nextPhase = "focus",
      nextSource = "free",
      nextLabel = "",
      nextStepId = null,
      minutes = null,
    } = {}) => {
      clearPostAlarmRecovery();
      await unlockAudio();
      await startTimerKeepAlive();
      handledEndRef.current = null;
      const fallback =
        nextPhase === "break"
          ? DEFAULT_POMODORO.breakMinutes
          : DEFAULT_POMODORO.focusMinutes;
      const max = nextPhase === "break" ? 60 : 180;
      const raw =
        minutes ??
        (nextPhase === "break"
          ? settings.breakMinutes
          : settings.focusMinutes);
      const mins = resolveMinutes(raw, fallback, max);
      const sec = mins * 60;
      const end = Date.now() + sec * 1000;
      setPhase(nextPhase);
      setSource(nextSource);
      setLabel(nextLabel || (nextPhase === "break" ? "Descanso" : "Foco"));
      setStepId(nextStepId);
      setPlannedSeconds(sec);
      setRemaining(sec);
      setEndsAt(end);
      setRunning(true);
    },
    [settings.breakMinutes, settings.focusMinutes]
  );

  const pause = useCallback(() => {
    if (!running) return;
    const left = remainingFromEndsAt(endsAt);
    clearTick();
    stopTimerKeepAlive();
    void clearRunningTimerNotification();
    void cancelServiceWorkerAlarm();
    clearPostAlarmRecovery();
    setRunning(false);
    setEndsAt(null);
    setRemaining(left);
  }, [running, endsAt]);

  const resume = useCallback(async () => {
    if (running || remaining <= 0) return;
    clearPostAlarmRecovery();
    await unlockAudio();
    await startTimerKeepAlive();
    setEndsAt(Date.now() + remaining * 1000);
    setRunning(true);
  }, [running, remaining]);

  const stop = useCallback(() => {
    clearTick();
    stopTimerKeepAlive();
    void clearRunningTimerNotification();
    void cancelServiceWorkerAlarm();
    clearPostAlarmRecovery();
    setRunning(false);
    setEndsAt(null);
    setPhase("idle");
    setStepId(null);
    setLabel("");
    const mins = resolveMinutes(
      settings.focusMinutes,
      DEFAULT_POMODORO.focusMinutes
    );
    const sec = mins * 60;
    setPlannedSeconds(sec);
    setRemaining(sec);
  }, [settings.focusMinutes]);

  const startBreak = useCallback(() => {
    return startPhase({
      nextPhase: "break",
      nextSource: source,
      nextLabel: "Descanso",
      nextStepId: stepId,
      minutes: settings.breakMinutes,
    });
  }, [startPhase, source, stepId, settings.breakMinutes]);

  const clearPendingLog = () => setPendingLog(null);

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      phase,
      source,
      label,
      stepId,
      running,
      remaining,
      plannedSeconds,
      pendingLog,
      clearPendingLog,
      startFocus: (opts = {}) =>
        startPhase({
          nextPhase: "focus",
          nextSource: opts.source || opts.nextSource || "free",
          nextLabel: opts.nextLabel || opts.label || "Foco",
          nextStepId: opts.nextStepId ?? opts.stepId ?? null,
          minutes: opts.minutes,
        }),
      startBreak,
      pause,
      resume,
      stop,
      active: phase !== "idle" || running,
    }),
    [
      settings,
      phase,
      source,
      label,
      stepId,
      running,
      remaining,
      plannedSeconds,
      pendingLog,
      startPhase,
      startBreak,
      pause,
      resume,
      stop,
    ]
  );

  return (
    <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro fora do PomodoroProvider");
  return ctx;
}
