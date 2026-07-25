const STORAGE_KEY = "tobias.pomodoro.settings.v1";

export const DEFAULT_POMODORO = {
  focusMinutes: 25,
  breakMinutes: 5,
};

export function loadPomodoroSettings() {
  if (typeof window === "undefined") return { ...DEFAULT_POMODORO };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_POMODORO };
    const parsed = JSON.parse(raw);
    return {
      focusMinutes: clampStored(parsed.focusMinutes, 25, 180),
      breakMinutes: clampStored(parsed.breakMinutes, 5, 60),
    };
  } catch {
    return { ...DEFAULT_POMODORO };
  }
}

/**
 * Atualiza o estado dos inputs.
 * Campo vazio permanece vazio (não volta sozinho para 25/5).
 * Só grava no localStorage valores numéricos válidos.
 */
export function savePomodoroSettings(settings) {
  const prev = loadPomodoroSettings();
  const focusMinutes = softMinutes(settings.focusMinutes, 180);
  const breakMinutes = softMinutes(settings.breakMinutes, 60);
  const next = { focusMinutes, breakMinutes };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        focusMinutes:
          typeof focusMinutes === "number" ? focusMinutes : prev.focusMinutes,
        breakMinutes:
          typeof breakMinutes === "number" ? breakMinutes : prev.breakMinutes,
      })
    );
  }
  return next;
}

/** Minutos válidos para iniciar o timer; fallback só na hora de usar. */
export function resolveMinutes(value, fallback, max = 180) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(max, Math.round(n));
}

function softMinutes(value, max) {
  if (value === "" || value === null || value === undefined) return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  if (n < 1) return "";
  return Math.min(max, Math.round(n));
}

function clampStored(value, fallback, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(max, Math.round(n));
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
