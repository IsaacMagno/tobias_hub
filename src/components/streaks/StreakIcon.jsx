"use client";

import {
  DEFAULT_STREAK_ICON,
  getStreakIconOption,
  resolveStreakIconId,
} from "@/lib/helpers/habitStreakIcons";

export default function StreakIcon({
  icon,
  className = "h-5 w-5",
  strokeWidth = 1.75,
}) {
  const option = getStreakIconOption(icon);
  const Icon = option?.Icon;
  if (!Icon) return null;
  return (
    <Icon
      className={className}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  );
}

export function StreakIconBadge({ icon, className = "" }) {
  const resolved = resolveStreakIconId(icon);
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-copper/25 bg-ink-900 text-copper ${className}`}
      aria-hidden
    >
      <StreakIcon icon={resolved} className="h-4 w-4" />
    </span>
  );
}
