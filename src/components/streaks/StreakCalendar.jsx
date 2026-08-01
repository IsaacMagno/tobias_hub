"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Shield } from "lucide-react";
import {
  calendarStartKey,
  buildCalendarDays,
  dateKeyInTz,
  daysBetween,
} from "@/lib/helpers/habitStreak";

const COLLAPSED_DAYS = 14;
const EXPANDED_DAYS = 90;

function dayTitle(date, status) {
  const labels = {
    done: "Feito",
    missed: "Não feito",
    shielded: "Protegido por escudo",
    today: "Hoje (ainda não marcado)",
    empty: "",
    future: "",
  };
  if (!date) return "";
  return `${date} — ${labels[status] || status}`;
}

function DayCell({ day }) {
  const base =
    "h-3.5 min-w-[8px] flex-1 rounded-sm border transition-colors sm:h-4";

  const classes = {
    done: "border-emerald-500/40 bg-emerald-500/70",
    missed: "border-sky-500/35 bg-sky-500/55",
    shielded: "border-copper/50 bg-copper/35",
    today: "border-ash-500/50 bg-ink-800",
    empty: "border-ink-800/80 bg-ink-900/50",
    future: "border-ink-800/60 bg-ink-950/40",
  };

  return (
    <span
      className={`${base} ${classes[day.status] || classes.empty}`}
      title={dayTitle(day.date, day.status)}
      aria-label={dayTitle(day.date, day.status)}
    />
  );
}

export default function StreakCalendar({ streak }) {
  const [expanded, setExpanded] = useState(false);
  const todayKey = dateKeyInTz();
  const daysBack = expanded ? EXPANDED_DAYS : COLLAPSED_DAYS;
  const startKey = calendarStartKey(todayKey, daysBack);

  const createdKey = streak.created_at
    ? dateKeyInTz(new Date(streak.created_at))
    : startKey;
  const effectiveStart =
    daysBetween(startKey, createdKey) >= 0 ? createdKey : startKey;

  const days = buildCalendarDays({
    logDates: streak.logDates || [],
    shieldGaps: streak.shieldGaps || [],
    startKey: effectiveStart,
    endKey: todayKey,
    todayKey,
  });

  let cells = days;
  const slotCount = expanded ? EXPANDED_DAYS : COLLAPSED_DAYS;

  if (!expanded) {
    if (cells.length > slotCount) {
      cells = cells.slice(-slotCount);
    } else if (cells.length < slotCount) {
      const pad = slotCount - cells.length;
      cells = [
        ...cells,
        ...Array.from({ length: pad }, () => ({ date: null, status: "future" })),
      ];
    }
  } else if (cells.length > slotCount) {
    cells = cells.slice(-slotCount);
  }

  const shields = streak.shields ?? 0;

  return (
    <div className="space-y-2 rounded-lg border border-copper/15 bg-ink-950/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-wider text-ash-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-emerald-500/70" />
            Feito
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-sky-500/55" />
            Não feito
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-copper/40" />
            Escudo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1 text-xs text-ash-400"
            title="Escudos protegem 1 dia perdido na sequência"
          >
            <Shield className="h-3.5 w-3.5 text-copper" strokeWidth={1.75} />
            {shields}
          </span>
          <button
            type="button"
            className="flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-copper hover:text-copper-bright"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                Menos <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Mais <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className={`flex gap-1 ${expanded ? "flex-wrap" : ""}`}
        style={expanded ? undefined : { minHeight: "1rem" }}
      >
        {cells.map((day, i) => (
          <DayCell key={day.date ?? `future-${i}`} day={day} />
        ))}
      </div>
    </div>
  );
}
