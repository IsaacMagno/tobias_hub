"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatClock } from "@/lib/pomodoro/settings";
import { usePomodoro } from "./PomodoroProvider";

function supportsDocPip() {
  return typeof window !== "undefined" && "documentPictureInPicture" in window;
}

const STYLE = {
  shell: (idle) =>
    `font-family:system-ui,sans-serif;background:${
      idle ? "rgba(5,4,3,0.98)" : "rgba(18,16,14,0.96)"
    };color:#e8e2d9;padding:12px 14px;height:100%;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;gap:8px;`,
  primary:
    "cursor:pointer;border:none;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;background:#c4a574;color:#0a0908;",
  ghost:
    "cursor:pointer;border:1px solid rgba(196,165,116,0.35);border-radius:8px;padding:6px 10px;font-size:12px;font-weight:500;background:rgba(0,0,0,0.25);color:#e8e2d9;",
};

function ensureShell(pipDoc) {
  let root = pipDoc.getElementById("tobias-pip");
  if (!root) {
    root = pipDoc.createElement("div");
    root.id = "tobias-pip";
    root.style.height = "100%";
    pipDoc.body.appendChild(root);
  }
  if (!pipDoc.getElementById("pip-shell")) {
    root.innerHTML = `
      <div id="pip-shell">
        <div>
          <div id="pip-phase" style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#c4a574;margin-bottom:4px;"></div>
          <div id="pip-clock" style="font-size:36px;font-variant-numeric:tabular-nums;font-weight:600;line-height:1;color:#e8e2d9;"></div>
        </div>
        <div id="pip-actions" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
      </div>
    `;
  }
  return root;
}

function updatePipChrome(pipDoc, snap) {
  ensureShell(pipDoc);
  const shell = pipDoc.getElementById("pip-shell");
  const phaseEl = pipDoc.getElementById("pip-phase");
  const clockEl = pipDoc.getElementById("pip-clock");
  if (!shell || !phaseEl || !clockEl) return;

  const bg = snap.idle ? "rgba(5,4,3,0.98)" : "rgba(18,16,14,0.96)";
  shell.setAttribute("style", STYLE.shell(snap.idle));
  pipDoc.body.style.background = bg;
  pipDoc.documentElement.style.background = bg;

  phaseEl.textContent = snap.label
    ? `${snap.phaseLabel} · ${snap.label}`
    : snap.phaseLabel;
  clockEl.textContent = snap.clock;
}

function updatePipActions(pipDoc, snap) {
  const actions = pipDoc.getElementById("pip-actions");
  if (!actions) return;

  const key = `${snap.running ? "r" : "p"}-${snap.canResume ? 1 : 0}-${
    snap.canBreak ? 1 : 0
  }`;
  if (actions.dataset.key === key) return;
  actions.dataset.key = key;

  let html = "";
  if (snap.running) {
    html += `<button type="button" data-act="pause" style="${STYLE.ghost}">Pausar</button>`;
  } else if (snap.canResume) {
    html += `<button type="button" data-act="resume" style="${STYLE.primary}">Seguir</button>`;
  } else if (snap.canBreak) {
    html += `<button type="button" data-act="break" style="${STYLE.primary}">Descanso</button>`;
  }
  html += `<button type="button" data-act="stop" style="${STYLE.ghost}">Fim</button>`;
  actions.innerHTML = html;
}

/**
 * PiP do documento (Chrome/Edge PC).
 * Estado do timer sempre via ref (hover não volta o relógio ao valor antigo).
 */
export default function useDocumentPipTimer() {
  const {
    phase,
    label,
    running,
    remaining,
    pause,
    resume,
    stop,
    startBreak,
  } = usePomodoro();

  const pipRef = useRef(null);
  const idleRef = useRef(true);
  const idleTimerRef = useRef(null);
  const unbindRef = useRef(null);
  const liveRef = useRef({
    phase,
    label,
    running,
    remaining,
    pause,
    resume,
    stop,
    startBreak,
  });
  const [pipOpen, setPipOpen] = useState(false);
  const [available, setAvailable] = useState(false);

  liveRef.current = {
    phase,
    label,
    running,
    remaining,
    pause,
    resume,
    stop,
    startBreak,
  };

  useEffect(() => {
    setAvailable(supportsDocPip());
  }, []);

  const readSnap = useCallback(() => {
    const live = liveRef.current;
    const phaseLabel = live.phase === "break" ? "Descanso" : "Foco";
    return {
      phaseLabel,
      label: live.label,
      clock: formatClock(live.remaining),
      running: live.running,
      canResume: !live.running && live.remaining > 0,
      canBreak:
        live.phase === "focus" && !live.running && live.remaining === 0,
      idle: idleRef.current,
    };
  }, []);

  const refresh = useCallback(() => {
    const pipWindow = pipRef.current || documentPictureInPicture?.window;
    if (!pipWindow) return;
    const snap = readSnap();
    updatePipChrome(pipWindow.document, snap);
    updatePipActions(pipWindow.document, snap);
  }, [readSnap]);

  const setIdle = useCallback(
    (idle) => {
      idleRef.current = idle;
      const pipWindow = pipRef.current || documentPictureInPicture?.window;
      if (!pipWindow) return;
      // só fundo — não reescreve o relógio com valor stale
      updatePipChrome(pipWindow.document, readSnap());
    },
    [readSnap]
  );

  const bumpInteraction = useCallback(() => {
    setIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIdle(true), 1800);
  }, [setIdle]);

  const bindActions = useCallback(
    (pipWindow) => {
      const onClick = (e) => {
        const btn = e.target?.closest?.("[data-act]");
        if (!btn) {
          bumpInteraction();
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        const act = btn.getAttribute("data-act");
        const api = liveRef.current;
        if (act === "pause") api.pause();
        if (act === "resume") api.resume();
        if (act === "break") api.startBreak();
        if (act === "stop") {
          api.stop();
          try {
            pipWindow.close();
          } catch {
            /* ignore */
          }
        }
        bumpInteraction();
      };

      const onMove = () => bumpInteraction();
      const onLeave = () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => setIdle(true), 600);
      };

      pipWindow.document.addEventListener("click", onClick);
      pipWindow.document.addEventListener("pointermove", onMove);
      pipWindow.document.addEventListener("pointerleave", onLeave);
      return () => {
        pipWindow.document.removeEventListener("click", onClick);
        pipWindow.document.removeEventListener("pointermove", onMove);
        pipWindow.document.removeEventListener("pointerleave", onLeave);
      };
    },
    [bumpInteraction, setIdle]
  );

  const openPip = useCallback(async () => {
    if (!supportsDocPip()) {
      throw new Error("Picture-in-Picture não disponível neste browser");
    }
    if (documentPictureInPicture.window) {
      documentPictureInPicture.window.focus?.();
      pipRef.current = documentPictureInPicture.window;
      setPipOpen(true);
      refresh();
      return;
    }

    const pipWindow = await documentPictureInPicture.requestWindow({
      width: 360,
      height: 150,
      disallowReturnToOpener: true,
    });
    pipRef.current = pipWindow;
    idleRef.current = true;
    pipWindow.document.head.innerHTML = "";
    pipWindow.document.body.innerHTML = "";
    pipWindow.document.body.style.margin = "0";
    ensureShell(pipWindow.document);
    refresh();
    unbindRef.current = bindActions(pipWindow);

    const onPageHide = () => {
      unbindRef.current?.();
      unbindRef.current = null;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      pipRef.current = null;
      setPipOpen(false);
    };
    pipWindow.addEventListener("pagehide", onPageHide);
    setPipOpen(true);
  }, [bindActions, refresh]);

  const closePip = useCallback(() => {
    try {
      documentPictureInPicture.window?.close();
    } catch {
      /* ignore */
    }
    unbindRef.current?.();
    unbindRef.current = null;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    pipRef.current = null;
    setPipOpen(false);
  }, []);

  useEffect(() => {
    if (!documentPictureInPicture?.window) {
      if (pipOpen) setPipOpen(false);
      return;
    }
    refresh();
  }, [refresh, pipOpen, remaining, running, phase, label]);

  useEffect(() => {
    if (phase === "idle" && documentPictureInPicture?.window) {
      closePip();
    }
  }, [phase, closePip]);

  return { available, pipOpen, openPip, closePip };
}
