"use client";

import { PomodoroProvider } from "./PomodoroProvider";
import FloatingTimerBar from "./FloatingTimerBar";

export default function PomodoroShell({ children }) {
  return (
    <PomodoroProvider>
      <FloatingTimerBar />
      {children}
    </PomodoroProvider>
  );
}
