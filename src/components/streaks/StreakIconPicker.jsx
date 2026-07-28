"use client";

import {
  DEFAULT_STREAK_ICON,
  STREAK_ICON_OPTIONS,
  resolveStreakIconId,
} from "@/lib/helpers/habitStreakIcons";

export default function StreakIconPicker({ value, onChange }) {
  const selected = resolveStreakIconId(value || DEFAULT_STREAK_ICON);

  return (
    <div className="flex flex-wrap gap-2">
      {STREAK_ICON_OPTIONS.map(({ id, Icon, label }) => {
        const active = id === selected;
        return (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => onChange(id)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
              active
                ? "border-copper/60 bg-copper/15 text-copper-bright"
                : "border-copper/20 bg-ink-950 text-ash-400 hover:border-copper/40 hover:bg-ink-900 hover:text-ash-200"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}
