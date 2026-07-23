"use client";

import { STAT_LABELS } from "@/lib/helpers/attributes";

const ORDER = ["strength", "agility", "inteligence", "vitality", "wisdom"];

export default function StatsBars({ statistics, maxHint = 50 }) {
  const stats = statistics || {};
  const peak = Math.max(
    maxHint,
    ...ORDER.map((k) => Number(stats[k] || 0))
  );

  return (
    <ul className="space-y-3">
      {ORDER.map((key) => {
        const value = Number(stats[key] || 0);
        const pct = Math.min(100, Math.round((value / peak) * 100));
        return (
          <li key={key}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-sm text-ash-200">{STAT_LABELS[key]}</span>
              <span className="font-display text-copper">{value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-copper"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
