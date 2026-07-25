"use client";

import { PomodoroProvider } from "./PomodoroProvider";
import { PipHost } from "./PipHost";
import AppPermissionsPrompt from "@/components/AppPermissionsPrompt";

export default function PomodoroShell({ children }) {
  return (
    <PomodoroProvider>
      <PipHost>
        {children}
        <AppPermissionsPrompt />
      </PipHost>
    </PomodoroProvider>
  );
}
