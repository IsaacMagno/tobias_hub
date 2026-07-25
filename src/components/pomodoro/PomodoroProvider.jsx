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
} from "@/lib/pomodoro/settings";
import { notifyAlarm, unlockAudio } from "@/lib/pomodoro/alarm";

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
  const phaseRef = useRef(phase);
  const sourceRef = useRef(source);
  const labelRef = useRef(label);

  phaseRef.current = phase;
  sourceRef.current = source;
  labelRef.current = label;

  useEffect(() => {
    setSettingsState(loadPomodoroSettings());
  }, []);

  // Em idle, o relógio acompanha o foco configurado (ex.: 1:00, não 25:00).
  useEffect(() => {
    if (phase !== "idle" || running) return;
    const sec = Math.max(1, Number(settings.focusMinutes) || 25) * 60;
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
    if (!endsAt) return;
    const left = remainingFromEndsAt(endsAt);
    setRemaining(left);
    if (left <= 0) {
      clearTick();
      setRunning(false);
      setEndsAt(null);
      const was = phaseRef.current;
      const wasSource = sourceRef.current;
      const wasLabel = labelRef.current;

      notifyAlarm({
        title:
          was === "focus" ? "Foco concluído — Tobias" : "Descanso acabou — Tobias",
        body:
          was === "focus"
            ? wasLabel || "Hora de uma pausa."
            : "Pronto para outro bloco de foco.",
        tag: `tobias-pomodoro-${was}`,
      });

      if (was === "focus") {
        if (wasSource === "free") {
          setPendingLog({
            label: wasLabel || "Pomodoro livre",
            elapsedSeconds: plannedSeconds,
            finishedAt: new Date().toISOString(),
          });
        }
        // auto offer break
        const breakSec = Math.max(1, settings.breakMinutes) * 60;
        setPhase("break");
        setPlannedSeconds(breakSec);
        setRemaining(breakSec);
        setEndsAt(null);
        setRunning(false);
      } else {
        setPhase("idle");
        setPlannedSeconds(Math.max(1, settings.focusMinutes) * 60);
        setRemaining(Math.max(1, settings.focusMinutes) * 60);
      }
    }
  }, [endsAt, plannedSeconds, settings.breakMinutes, settings.focusMinutes]);

  useEffect(() => {
    if (!running || !endsAt) {
      clearTick();
      return undefined;
    }
    syncRemaining();
    tickRef.current = setInterval(syncRemaining, 250);
    return clearTick;
  }, [running, endsAt, syncRemaining]);

  // Visibility: resync when tab returns
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && running) syncRemaining();
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
      const mins =
        minutes ??
        (nextPhase === "break"
          ? settings.breakMinutes
          : settings.focusMinutes);
      const sec = Math.max(1, Number(mins) || 25) * 60;
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
    const sec = Math.max(1, settings.focusMinutes) * 60;
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
