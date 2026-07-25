"use client";

import { useEffect, useRef } from "react";
import { notifyAlarm, unlockAudio } from "@/lib/pomodoro/alarm";

/**
 * Agenda lembrete local para o horário da missão (enquanto o app/PWA está vivo).
 * Não substitui o AlarmClock do Android — o máximo confiável em PWA.
 */
export default function AgendaReminder({
  enabled,
  agendaToday,
  timeOfDay,
  missionTitle,
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
  }, [timeOfDay, missionTitle]);

  useEffect(() => {
    if (!enabled || !agendaToday || !timeOfDay) return undefined;

    const [hh, mm] = String(timeOfDay)
      .split(":")
      .map((n) => Number(n));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return undefined;

    const tick = () => {
      const now = new Date();
      if (
        now.getHours() === hh &&
        now.getMinutes() === mm &&
        !firedRef.current
      ) {
        firedRef.current = true;
        unlockAudio()
          .then(() =>
            notifyAlarm({
              title: "Hora da missão — Tobias",
              body: missionTitle
                ? `Despertador: ${missionTitle}`
                : "Hora de continuar sua missão.",
              tag: "tobias-agenda",
            })
          )
          .catch(() => {});
      }
      // reset flag after minute changes
      if (now.getMinutes() !== mm) firedRef.current = false;
    };

    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [enabled, agendaToday, timeOfDay, missionTitle]);

  return null;
}
