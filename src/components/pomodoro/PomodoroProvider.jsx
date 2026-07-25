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
  playAlarmTone,
  startTimerKeepAlive,
  stopTimerKeepAlive,
  showRunningTimerNotification,
  clearRunningTimerNotification,
  scheduleServiceWorkerAlarm,
  cancelServiceWorkerAlarm,
} from "@/lib/pomodoro/alarm";

const PomodoroContext = createContext(null);

function remainingFromEndsAt(endsAt) {
  if (!endsAt) return 0;
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

export function PomodoroProvider({ children }) {
  const [settings, setSettingsState] = useState(DEFAULT_POMODORO);
  const [phase, setPhase] = useState("idle"); // idle | focus | break
  const [source, setSource] = useState("free"); // free | mission
  const [label, setLabel] = useState("");
  const [stepId, setStepId] = useState(null);
  const [running, setRunning] = useState(false);
  const [endsAt, setEndsAt] = useState(null);
  const [plannedSeconds, setPlannedSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [pendingLog, setPendingLog] = useState(null); // after free focus ends
  const tickRef = useRef(null);
  const wakeLockRef = useRef(null);
  const handledEndRef = useRef(null);
  const needToneRef = useRef(false);
  const endsAtRef = useRef(null);
  const phaseRef = useRef(phase);
  const sourceRef = useRef(source);
  const labelRef = useRef(label);

  phaseRef.current = phase;
  sourceRef.current = source;
  labelRef.current = label;
  endsAtRef.current = endsAt;

  useEffect(() => {
    setSettingsState(loadPomodoroSettings());
  }, []);

  // Em idle, o relógio acompanha o foco configurado (ex.: 1:00, não 25:00).
  // Se o campo estiver vazio (usuário apagando), não mexe no relógio.
  useEffect(() => {
    if (phase !== "idle" || running) return;
    const mins = Number(settings.focusMinutes);
    if (!Number.isFinite(mins) || mins < 1) return;
    const sec = mins * 60;
    setPlannedSeconds(sec);
    setRemaining(sec);
  }, [settings.focusMinutes, phase, running]);

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const syncRemaining = useCallback(() => {
    try {
      if (!endsAt) return;
      const left = remainingFromEndsAt(endsAt);
      setRemaining(left);
      if (left > 0) return;

      // Evita disparar duas vezes (interval + visibility ao desbloquear).
      if (handledEndRef.current === endsAt) return;
      handledEndRef.current = endsAt;

      clearTick();
      setRunning(false);
      setEndsAt(null);
      const was = phaseRef.current;
      const wasSource = sourceRef.current;
      const wasLabel = labelRef.current;
      const planned = plannedSeconds;

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
      // Sempre tenta som + notificação (também com tela bloqueada).
      // Protegido contra crash; keep-alive ajuda o SO a deixar tocar.
      needToneRef.current = false;
      stopTimerKeepAlive();
      void clearRunningTimerNotification();
      void cancelServiceWorkerAlarm();
      window.setTimeout(() => {
        void notifyAlarm(alarmPayload).catch(() => {});
      }, 0);

      if (was === "focus") {
        if (wasSource === "free") {
          setPendingLog({
            label: wasLabel || "Pomodoro livre",
            elapsedSeconds: planned,
            finishedAt: new Date().toISOString(),
          });
        }
        const breakSec =
          resolveMinutes(
            settings.breakMinutes,
            DEFAULT_POMODORO.breakMinutes,
            60
          ) * 60;
        setPhase("break");
        setPlannedSeconds(breakSec);
        setRemaining(breakSec);
        setRunning(false);
      } else {
        setPhase("idle");
        const focusSec =
          resolveMinutes(settings.focusMinutes, DEFAULT_POMODORO.focusMinutes) *
          60;
        setPlannedSeconds(focusSec);
        setRemaining(focusSec);
      }
    } catch (err) {
      console.error("[pomodoro] syncRemaining", err);
    }
  }, [endsAt, plannedSeconds, settings.breakMinutes, settings.focusMinutes]);

  useEffect(() => {
    if (!running || !endsAt) {
      clearTick();
      return undefined;
    }
    syncRemaining();
    tickRef.current = setInterval(syncRemaining, 250);
    // Timeout absoluto: com throttle de background, 1 disparo no fim é mais confiável.
    const delay = Math.max(0, endsAt - Date.now()) + 80;
    const endId = window.setTimeout(() => {
      syncRemaining();
    }, delay);
    return () => {
      clearTick();
      window.clearTimeout(endId);
    };
  }, [running, endsAt, syncRemaining]);

  // Keep-alive + notificação "em andamento" + alarme no SW enquanto roda.
  useEffect(() => {
    if (!running || !endsAt) {
      stopTimerKeepAlive();
      void clearRunningTimerNotification();
      void cancelServiceWorkerAlarm();
      return undefined;
    }

    const was = phaseRef.current;
    const label = labelRef.current;
    const title =
      was === "break"
        ? "Tobias · descanso em andamento"
        : "Tobias · foco em andamento";
    const body = label
      ? `${label} — o alarme toca ao terminar.`
      : "O alarme toca ao terminar o bloco, mesmo com a tela bloqueada.";

    void startTimerKeepAlive();
    void showRunningTimerNotification({ title, body });
    void scheduleServiceWorkerAlarm({
      endsAt,
      title:
        was === "break" ? "Descanso acabou — Tobias" : "Foco concluído — Tobias",
      body:
        was === "break"
          ? "Pronto para outro bloco de foco."
          : label || "Hora de uma pausa.",
      tag: `tobias-pomodoro-${was || "focus"}`,
    });

    return () => {
      stopTimerKeepAlive();
      void clearRunningTimerNotification();
      void cancelServiceWorkerAlarm();
    };
  }, [running, endsAt]);

  // Visibility: resync + reforço do keep-alive ao voltar
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      try {
        if (running) {
          syncRemaining();
          void startTimerKeepAlive();
        }
        if (needToneRef.current) {
          needToneRef.current = false;
          void playAlarmTone().catch(() => {});
        }
      } catch (err) {
        console.error("[pomodoro] visibility", err);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onVis);
    };
  }, [running, syncRemaining]);

  // Mantém a tela acordada enquanto o timer roda (some ao bloquear o celular).
  useEffect(() => {
    if (!running) {
      const lock = wakeLockRef.current;
      wakeLockRef.current = null;
      if (lock) {
        void Promise.resolve(lock.release?.()).catch(() => {});
      }
      return undefined;
    }

    let cancelled = false;

    const request = async () => {
      if (cancelled || typeof navigator === "undefined" || !navigator.wakeLock) {
        return;
      }
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          void Promise.resolve(lock.release?.()).catch(() => {});
          return;
        }
        wakeLockRef.current = lock;
      } catch {
        /* permissão / policy — ok ignorar */
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
    setRunning(false);
    setEndsAt(null);
    setRemaining(left);
  }, [running, endsAt]);

  const resume = useCallback(async () => {
    if (running || remaining <= 0) return;
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
