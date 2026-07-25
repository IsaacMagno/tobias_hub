"use client";

import { PomodoroProvider } from "./PomodoroProvider";
import { PipHost } from "./PipHost";

export default function PomodoroShell({ children }) {
  return (
    <PomodoroProvider>
      <PipHost>{children}</PipHost>
    </PomodoroProvider>
  );
}
