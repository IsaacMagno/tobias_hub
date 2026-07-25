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
import { notifyAlarm, unlockAudio } from "@/lib/pomodoro/alarm";
import {
  saveBackgroundAlarmSnapshot,
  loadBackgroundAlarmSnapshot,
} from "@/components/UnlockReloadListener";

const PomodoroContext = createContext(null);

function remainingFromEndsAt(endsAt) {
  if (!endsAt) return 0;
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

function isHidden() {
  return (
    typeof document !== "undefined" && document.visibilityState !== "visible"
  );
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
  const [pendingLog, setPendingLog] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const tickRef = useRef(null);
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

  useEffect(() => {
    setSettingsState(loadPomodoroSettings());
    const snap = loadBackgroundAlarmSnapshot();
    if (snap && typeof snap === "object") {
      if (snap.phase) setPhase(snap.phase);
      if (snap.source) setSource(snap.source);
      if (typeof snap.label === "string") setLabel(snap.label);
      if (typeof snap.plannedSeconds === "number") {
        setPlannedSeconds(snap.plannedSeconds);
      }
      if (typeof snap.remaining === "number") setRemaining(snap.remaining);
      if (snap.pendingLog) setPendingLog(snap.pendingLog);
      setRunning(false);
      setEndsAt(null);
    }
    setHydrated(true);
  }, []);

  // Em idle, o relógio acompanha o foco configurado.
  useEffect(() => {
    if (!hydrated) return;
    if (phase !== "idle" || running) return;
    const mins = Number(settings.focusMinutes);
    if (!Number.isFinite(mins) || mins < 1) return;
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

  const syncRemaining = useCallback(() => {
    try {
      if (!endsAt) return;
      const left = remainingFromEndsAt(endsAt);
      if (left > 0) {
        setRemaining(left);
        return;
      }

      if (handledEndRef.current === endsAt) return;
      handledEndRef.current = endsAt;

      clearTick();
      const was = phaseRef.current;
      const wasSource = sourceRef.current;
      const wasLabel = labelRef.current;
      const planned = plannedRef.current;
      const cfg = settingsRef.current;

      void notifyAlarm({
        title:
          was === "focus" ? "Foco concluído — Tobias" : "Descanso acabou — Tobias",
        body:
          was === "focus"
            ? wasLabel || "Hora de uma pausa."
            : "Pronto para outro bloco de foco.",
        tag: `tobias-pomodoro-${was}`,
      }).catch(() => {});

      const breakSec =
        resolveMinutes(cfg.breakMinutes, DEFAULT_POMODORO.breakMinutes, 60) * 60;
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

      // Com tela bloqueada: NÃO atualiza UI React (isso crashava no unlock).
      // Só alarme + flag de reload; estado volta limpo depois do reload.
      if (isHidden()) {
        saveBackgroundAlarmSnapshot({
          phase: nextPhase,
          source: wasSource,
          label: was === "focus" ? wasLabel : "",
          plannedSeconds: nextPlanned,
          remaining: nextRemaining,
          pendingLog: nextPending,
        });
        setRunning(false);
        setEndsAt(null);
        return;
      }

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
      console.error("[pomodoro] syncRemaining", err);
    }
  }, [endsAt]);

  useEffect(() => {
    if (!running || !endsAt) {
      clearTick();
      return undefined;
    }
    syncRemaining();
    tickRef.current = setInterval(syncRemaining, 250);
    return clearTick;
  }, [running, endsAt, syncRemaining]);

  // Visibility: se ainda estiver rodando ao voltar, sincroniza (fim em foreground).
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      if (running) syncRemaining();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [running, syncRemaining]);

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
    setRunning(false);
    setEndsAt(null);
    setRemaining(left);
  }, [running, endsAt]);

  const resume = useCallback(async () => {
    if (running || remaining <= 0) return;
    await unlockAudio();
    handledEndRef.current = null;
    setEndsAt(Date.now() + remaining * 1000);
    setRunning(true);
  }, [running, remaining]);

  const stop = useCallback(() => {
    clearTick();
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
