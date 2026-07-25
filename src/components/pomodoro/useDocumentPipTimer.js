"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatClock } from "@/lib/pomodoro/settings";
import { usePomodoro } from "./PomodoroProvider";

function getDocPip() {
  if (typeof window === "undefined") return null;
  return window.documentPictureInPicture || null;
}

function supportsDocPip() {
  return Boolean(getDocPip()?.requestWindow);
}

/** Viewport pedido ao Chrome (o browser pode forçar um mínimo maior). */
const PIP_SIZE = { width: 275, height: 120 };
const PIP_BG = "#100e0c";

const STYLE = {
  shell: () =>
    `font-family:system-ui,sans-serif;background:${PIP_BG};color:#e8e2d9;padding:10px 12px 12px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:flex-start;gap:8px;width:100%;`,
  primary:
    "cursor:pointer;border:none;border-radius:8px;padding:5px 10px;font-size:12px;font-weight:600;background:#c4a574;color:#0a0908;",
  ghost:
    "cursor:pointer;border:1px solid rgba(196,165,116,0.35);border-radius:8px;padding:5px 10px;font-size:12px;font-weight:500;background:rgba(0,0,0,0.25);color:#e8e2d9;",
};

function ensureShell(pipDoc) {
  let root = pipDoc.getElementById("tobias-pip");
  if (!root) {
    root = pipDoc.createElement("div");
    root.id = "tobias-pip";
    pipDoc.body.appendChild(root);
  }
  root.style.cssText =
    "display:flex;flex-direction:column;justify-content:center;flex:1;width:100%;min-height:100%;background:" +
    PIP_BG +
    ";";
  if (!pipDoc.getElementById("pip-shell")) {
    root.innerHTML = `
      <div id="pip-shell">
        <div>
          <div id="pip-phase" style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#c4a574;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
          <div id="pip-clock" style="font-size:28px;font-variant-numeric:tabular-nums;font-weight:600;line-height:1.05;color:#e8e2d9;"></div>
        </div>
        <div id="pip-actions" style="display:flex;gap:6px;flex-wrap:nowrap;"></div>
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

  shell.setAttribute("style", STYLE.shell());
  pipDoc.body.style.background = PIP_BG;
  pipDoc.documentElement.style.background = PIP_BG;

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
    const pipWindow = pipRef.current || getDocPip()?.window || null;
    if (!pipWindow) return;
    const snap = readSnap();
    updatePipChrome(pipWindow.document, snap);
    updatePipActions(pipWindow.document, snap);
  }, [readSnap]);

  const setIdle = useCallback(
    (idle) => {
      idleRef.current = idle;
      const pipWindow = pipRef.current || getDocPip()?.window || null;
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
    const docPip = getDocPip();
    if (!docPip?.requestWindow) {
      throw new Error("Picture-in-Picture não disponível neste browser");
    }

    // Fecha a anterior para não herdar tamanho grande memorizado pelo Chrome
    // (sem await — precisa manter o gesto do clique para o requestWindow)
    if (docPip.window) {
      try {
        docPip.window.close();
      } catch {
        /* ignore */
      }
      unbindRef.current?.();
      unbindRef.current = null;
      pipRef.current = null;
    }

    const pipWindow = await docPip.requestWindow({
      width: PIP_SIZE.width,
      height: PIP_SIZE.height,
      disallowReturnToOpener: true,
      preferInitialWindowPlacement: true,
    });
    pipRef.current = pipWindow;
    idleRef.current = true;
    pipWindow.document.head.innerHTML = "";
    pipWindow.document.body.innerHTML = "";
    const html = pipWindow.document.documentElement;
    html.style.cssText = `margin:0;height:100%;background:${PIP_BG};`;
    pipWindow.document.body.style.cssText = `margin:0;height:100%;overflow:hidden;background:${PIP_BG};display:flex;flex-direction:column;`;

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
      getDocPip()?.window?.close();
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
    if (!getDocPip()?.window) {
      if (pipOpen) setPipOpen(false);
      return;
    }
    refresh();
  }, [refresh, pipOpen, remaining, running, phase, label]);

  useEffect(() => {
    if (phase === "idle" && getDocPip()?.window) {
      closePip();
    }
  }, [phase, closePip]);

  return { available, pipOpen, openPip, closePip };
}
