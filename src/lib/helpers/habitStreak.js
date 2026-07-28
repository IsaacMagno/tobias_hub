const DEFAULT_TZ = process.env.TIMEZONE || "America/Sao_Paulo";

export const MAX_SHIELDS = 2;
export const SHIELD_EARN_INTERVAL = 7;

/**
 * Retorna a chave de data YYYY-MM-DD no fuso informado.
 */
export function dateKeyInTz(date = new Date(), timeZone = DEFAULT_TZ) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

/**
 * Subtrai um dia de uma chave YYYY-MM-DD.
 */
export function prevDateKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dateKeyInTz(dt, "UTC");
}

/**
 * Adiciona um dia a uma chave YYYY-MM-DD.
 */
export function nextDateKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dateKeyInTz(dt, "UTC");
}

/**
 * Diferença em dias entre duas chaves YYYY-MM-DD.
 */
export function daysBetween(olderKey, newerKey) {
  const [y1, m1, d1] = olderKey.split("-").map(Number);
  const [y2, m2, d2] = newerKey.split("-").map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / 86400000);
}

/**
 * Lista chaves de data inclusive entre start e end.
 */
export function listDateKeysBetween(startKey, endKey) {
  if (daysBetween(startKey, endKey) < 0) return [];
  const out = [];
  let d = startKey;
  while (daysBetween(d, endKey) >= 0) {
    out.push(d);
    if (d === endKey) break;
    d = nextDateKey(d);
  }
  return out;
}

/**
 * Maior bloco consecutivo em um conjunto de datas.
 */
export function longestRun(sortedDates) {
  if (!sortedDates.length) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    if (daysBetween(sortedDates[i - 1], sortedDates[i]) === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

/**
 * Calcula sequência atual com escudos (1 dia perdido pode ser coberto).
 */
export function computeStreakStats(
  logDates,
  todayKey = dateKeyInTz(),
  { shieldGaps = [], shieldsBalance = 0 } = {}
) {
  const unique = [...new Set(logDates)].sort();
  const logs = new Set(unique);
  const shieldSet = new Set(shieldGaps);
  const best = longestRun(unique);

  if (!unique.length) {
    return { current: 0, best: 0, shieldsToApply: [] };
  }

  const last = unique[unique.length - 1];
  const gapFromToday = daysBetween(last, todayKey);

  if (gapFromToday > 2) {
    return { current: 0, best, shieldsToApply: [] };
  }

  let shieldsToApply = [];
  let shieldsLeft =
    shieldsBalance - shieldSet.size + shieldsToApply.length;

  const tryBridgeGap = (gapDate) => {
    if (shieldSet.has(gapDate)) return true;
    if (shieldsLeft > 0) {
      shieldsToApply.push(gapDate);
      shieldSet.add(gapDate);
      shieldsLeft -= 1;
      return true;
    }
    return false;
  };

  if (gapFromToday === 2) {
    const yesterday = prevDateKey(todayKey);
    if (!tryBridgeGap(yesterday)) {
      return { current: 0, best, shieldsToApply: [] };
    }
  }

  if (gapFromToday > 1 && gapFromToday !== 2) {
    return { current: 0, best, shieldsToApply: [] };
  }

  const anchor = gapFromToday === 0 ? todayKey : last;

  let current = 0;
  let d = anchor;

  while (true) {
    if (logs.has(d)) {
      current += 1;
      d = prevDateKey(d);
      continue;
    }

    const prev = prevDateKey(d);
    if (logs.has(prev) || shieldSet.has(d)) {
      if (!shieldSet.has(d) && logs.has(prev)) {
        if (!tryBridgeGap(d)) break;
      }
      d = prev;
      continue;
    }

    break;
  }

  return {
    current,
    best: Math.max(best, current),
    shieldsToApply,
  };
}

/**
 * Escudos garantidos por marcos de sequência (1 base + bônus, máx. MAX_SHIELDS).
 */
export function shieldsEarnedForStreak(currentStreak) {
  const bonus = Math.floor(currentStreak / SHIELD_EARN_INTERVAL);
  return clampShields(1 + bonus);
}

export function clampShields(value) {
  return Math.max(0, Math.min(MAX_SHIELDS, Number(value) || 0));
}

/**
 * Dias para mini-calendário: done | missed | shielded | today | empty
 */
export function buildCalendarDays({
  logDates = [],
  shieldGaps = [],
  startKey,
  endKey,
  todayKey = dateKeyInTz(),
}) {
  const logs = new Set(logDates);
  const shields = new Set(shieldGaps);
  const keys = listDateKeysBetween(startKey, endKey);

  return keys.map((date) => {
    if (daysBetween(date, todayKey) < 0) {
      return { date, status: "empty" };
    }
    if (logs.has(date)) {
      return { date, status: date === todayKey ? "done" : "done" };
    }
    if (shields.has(date)) {
      return { date, status: "shielded" };
    }
    if (date === todayKey) {
      return { date, status: "today" };
    }
    return { date, status: "missed" };
  });
}

export function calendarStartKey(todayKey, daysBack) {
  let d = todayKey;
  for (let i = 0; i < daysBack - 1; i++) {
    d = prevDateKey(d);
  }
  return d;
}

export function isMarkedOnDate(lastLogDate, dateKey) {
  if (!lastLogDate) return false;
  const key =
    typeof lastLogDate === "string" && lastLogDate.length >= 10
      ? lastLogDate.slice(0, 10)
      : dateKeyInTz(new Date(lastLogDate));
  return key === dateKey;
}

export function isMarkedToday(lastLogDate, todayKey = dateKeyInTz()) {
  return isMarkedOnDate(lastLogDate, todayKey);
}
