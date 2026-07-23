"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { formatClock } from "@/lib/pomodoro/settings";
import { usePomodoro } from "./PomodoroProvider";
import useDocumentPipTimer from "./useDocumentPipTimer";

export default function FloatingTimerBar() {
  const {
    active,
    running,
    remaining,
    phase,
    label,
    pause,
    resume,
    stop,
    startBreak,
  } = usePomodoro();
  const { available, pipOpen, openPip, closePip } = useDocumentPipTimer();
  const [pipBusy, setPipBusy] = useState(false);

  if (!active && phase === "idle") return null;
  if (phase === "idle") return null;

  const phaseLabel = phase === "break" ? "Descanso" : "Foco";

  const togglePip = async () => {
    if (pipBusy) return;
    setPipBusy(true);
    try {
      if (pipOpen) closePip();
      else await openPip();
    } catch (e) {
      toast.error(
        e.message ||
          "Não foi possível flutuar. Use Chrome/Edge no PC (PWA ou site)."
      );
    } finally {
      setPipBusy(false);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center px-2 pt-2">
      <div className="pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-full border border-copper/30 bg-ink-950/95 px-3 py-2 shadow-lg shadow-ink-950/50 backdrop-blur">
        <Link
          href="/timer"
          className="min-w-0 flex-1 text-left"
          title="Abrir timer"
        >
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-copper">
            {phaseLabel}
            {label ? ` · ${label}` : ""}
          </p>
          <p className="font-display text-xl tabular-nums leading-none text-ash-200">
            {formatClock(remaining)}
          </p>
        </Link>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {available && (
            <button
              type="button"
              className="btn-ghost !px-2.5 !py-1.5 text-xs"
              onClick={togglePip}
              disabled={pipBusy}
              title="Janela flutuante por cima de outros apps (PC Chrome/Edge)"
            >
              {pipOpen ? "Recolher" : "Flutuar"}
            </button>
          )}
          {running ? (
            <button
              type="button"
              className="btn-ghost !px-2.5 !py-1.5 text-xs"
              onClick={pause}
            >
              Pausar
            </button>
          ) : remaining > 0 ? (
            <button
              type="button"
              className="btn-primary !px-2.5 !py-1.5 text-xs"
              onClick={resume}
            >
              Seguir
            </button>
          ) : phase === "focus" ? (
            <button
              type="button"
              className="btn-primary !px-2.5 !py-1.5 text-xs"
              onClick={startBreak}
            >
              Descanso
            </button>
          ) : null}
          <button
            type="button"
            className="btn-ghost !px-2.5 !py-1.5 text-xs"
            onClick={stop}
          >
            Fim
          </button>
        </div>
      </div>
    </div>
  );
}
