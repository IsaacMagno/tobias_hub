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
      focusMinutes: clampMin(parsed.focusMinutes, 25),
      breakMinutes: clampMin(parsed.breakMinutes, 5),
    };
  } catch {
    return { ...DEFAULT_POMODORO };
  }
}

export function savePomodoroSettings(settings) {
  const next = {
    focusMinutes: clampMin(settings.focusMinutes, 25),
    breakMinutes: clampMin(settings.breakMinutes, 5),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

function clampMin(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(180, Math.round(n));
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
