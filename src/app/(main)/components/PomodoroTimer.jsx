"use client";

import { useEffect } from "react";
import Link from "next/link";
import { formatClock } from "@/lib/pomodoro/settings";
import { usePomodoro } from "@/components/pomodoro/PomodoroProvider";
import FloatTimerButton from "@/components/pomodoro/FloatTimerButton";

/**
 * Timer do passo: usa o pomodoro global (foco/descanso + Flutuar no PC).
 * Minutos do passo têm prioridade no primeiro bloco de foco; senão usa settings.focusMinutes.
 */
export default function PomodoroTimer({
  plannedMinutes = null,
  resetKey = null,
  disabled = false,
  label = "Passo atual",
  stepId = null,
  onStart,
  onStop,
  className = "",
}) {
  const {
    settings,
    phase,
    source,
    running,
    remaining,
    plannedSeconds,
    startFocus,
    pause,
    resume,
    stop,
  } = usePomodoro();

  const isMine = source === "mission" && phase !== "idle";
  const showRemaining = isMine ? remaining : (plannedMinutes || settings.focusMinutes) * 60;
  const showPlanned = isMine
    ? plannedSeconds
    : Math.max(1, Number(plannedMinutes) || settings.focusMinutes) * 60;

  const progress =
    showPlanned === 0
      ? 0
      : isMine
        ? ((showPlanned - remaining) / showPlanned) * 100
        : 0;

  const start = async () => {
    if (disabled) return;
    await startFocus({
      source: "mission",
      nextSource: "mission",
      nextLabel: label,
      nextStepId: stepId,
      minutes: plannedMinutes || settings.focusMinutes,
    });
    Promise.resolve(onStart?.()).catch(() => {});
  };

  const handlePause = () => {
    pause();
    Promise.resolve(onStop?.(showPlanned - remaining, "aborted")).catch(
      () => {}
    );
  };

  const handleStop = () => {
    const elapsed = isMine ? showPlanned - remaining : 0;
    stop();
    Promise.resolve(onStop?.(elapsed, "aborted")).catch(() => {});
  };

  // resetKey change: stop mission timer if this step changed
  // (parent remounts with key anyway)

  // Espaço inicia/pausa/continua o foco (fora de inputs e botões)
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== "Space" || e.repeat || disabled) return;
      const t = e.target;
      if (
        t?.closest?.(
          "input, textarea, select, button, a, [contenteditable='true']"
        )
      )
        return;
      e.preventDefault();
      if (!isMine || (!running && remaining === plannedSeconds)) start();
      else if (running) handlePause();
      else if (remaining > 0) resume();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      className={`panel space-y-4 p-5 ${className} ${
        disabled ? "opacity-55" : ""
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-ash-400">
          Timer do passo
        </p>
        <p className="text-xs text-ash-400">
          Foco {plannedMinutes || settings.focusMinutes} min · pausa{" "}
          {settings.breakMinutes} min
        </p>
      </div>

      <p
        className="font-display text-5xl tabular-nums tracking-tight text-ash-200"
        aria-live="polite"
      >
        {formatClock(isMine ? remaining : showRemaining)}
      </p>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
        <div
          className="h-full rounded-full bg-copper transition-[width] duration-300"
          style={{ width: `${isMine ? progress : 0}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {!isMine || (!running && remaining === plannedSeconds) ? (
          <button
            type="button"
            className="btn-primary"
            onClick={start}
            disabled={disabled}
          >
            Iniciar foco
          </button>
        ) : running ? (
          <button
            type="button"
            className="btn-primary"
            onClick={handlePause}
            disabled={disabled}
          >
            Pausar timer
          </button>
        ) : remaining > 0 ? (
          <button
            type="button"
            className="btn-primary"
            onClick={resume}
            disabled={disabled}
          >
            Continuar
          </button>
        ) : null}
        <button
          type="button"
          className="btn-ghost"
          onClick={handleStop}
          disabled={disabled || !isMine}
        >
          Resetar
        </button>
        {isMine ? <FloatTimerButton phase={phase} /> : null}
      </div>

      <p className="text-xs text-ash-400">
        <span className="hidden lg:inline">
          Espaço inicia/pausa o foco.{" "}
        </span>
        No PC, use Flutuar para o cronômetro por cima de outros apps. Tempos em{" "}
        <Link href="/timer" className="text-copper underline-offset-2 hover:underline">
          Timer
        </Link>
        .
      </p>

      {disabled ? (
        <p className="text-xs text-ash-400">
          Retome a missão para usar o timer.
        </p>
      ) : null}
      <span className="hidden">{resetKey}</span>
    </div>
  );
}
