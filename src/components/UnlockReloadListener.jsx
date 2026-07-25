"use client";

import { useEffect } from "react";

const RELOAD_KEY = "tobias-reload-after-alarm";

/**
 * Listener fora do fluxo do timer: ao desbloquear, recarrega se o alarme
 * tiver tocado com a tela bloqueada — antes do React tentar re-renderizar.
 */
export default function UnlockReloadListener() {
  useEffect(() => {
    const reloadIfNeeded = () => {
      if (document.visibilityState !== "visible") return;
      try {
        if (window.sessionStorage.getItem(RELOAD_KEY) !== "1") return;
        window.sessionStorage.removeItem(RELOAD_KEY);
        window.location.reload();
      } catch {
        /* ignore */
      }
    };

    document.addEventListener("visibilitychange", reloadIfNeeded, true);
    window.addEventListener("pageshow", reloadIfNeeded, true);
    window.addEventListener("focus", reloadIfNeeded, true);
    reloadIfNeeded();

    return () => {
      document.removeEventListener("visibilitychange", reloadIfNeeded, true);
      window.removeEventListener("pageshow", reloadIfNeeded, true);
      window.removeEventListener("focus", reloadIfNeeded, true);
    };
  }, []);

  return null;
}

export function markReloadAfterBackgroundAlarm() {
  try {
    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      window.sessionStorage.setItem(RELOAD_KEY, "1");
    }
  } catch {
    /* ignore */
  }
}

const SNAP_KEY = "tobias-post-alarm-snap";

export function saveBackgroundAlarmSnapshot(snapshot) {
  try {
    window.sessionStorage.setItem(SNAP_KEY, JSON.stringify(snapshot));
    markReloadAfterBackgroundAlarm();
  } catch {
    /* ignore */
  }
}

export function loadBackgroundAlarmSnapshot() {
  try {
    const raw = window.sessionStorage.getItem(SNAP_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(SNAP_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
