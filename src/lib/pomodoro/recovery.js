const SNAPSHOT_KEY = "tobias.pomodoro.post-alarm.v1";
const RELOAD_KEY = "tobias.pomodoro.reload-after-alarm";

/**
 * Quando o bloco acaba com a tela bloqueada, salvamos o estado e
 * forçamos reload ao desbloquear (evita o crash). O alarme toca
 * de novo ao voltar, porque com a tela bloqueada o áudio costuma falhar.
 */
export function savePostAlarmSnapshot(snapshot) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    window.sessionStorage.setItem(RELOAD_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function peekPostAlarmSnapshot() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function markSnapshotAlarmPlayed() {
  if (typeof window === "undefined") return;
  try {
    const snap = peekPostAlarmSnapshot();
    if (!snap || typeof snap !== "object") return;
    window.sessionStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({ ...snap, shouldRing: false })
    );
  } catch {
    /* ignore */
  }
}

export function consumeReloadFlag() {
  if (typeof window === "undefined") return false;
  try {
    const on = window.sessionStorage.getItem(RELOAD_KEY) === "1";
    if (on) window.sessionStorage.removeItem(RELOAD_KEY);
    return on;
  } catch {
    return false;
  }
}

export function peekReloadFlag() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(RELOAD_KEY) === "1";
  } catch {
    return false;
  }
}

export function loadPostAlarmSnapshot() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(SNAPSHOT_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPostAlarmRecovery() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SNAPSHOT_KEY);
    window.sessionStorage.removeItem(RELOAD_KEY);
  } catch {
    /* ignore */
  }
}
