"use client";

import { PomodoroProvider } from "./PomodoroProvider";
import { PipHost } from "./PipHost";
import AppPermissionsPrompt from "@/components/AppPermissionsPrompt";
import ClientErrorBoundary from "@/components/ClientErrorBoundary";
import GlobalErrorTrap from "@/components/GlobalErrorTrap";

export default function PomodoroShell({ children }) {
  return (
    <ClientErrorBoundary>
      <GlobalErrorTrap />
      <PomodoroProvider>
        <PipHost>
          {children}
          <AppPermissionsPrompt />
        </PipHost>
      </PomodoroProvider>
    </ClientErrorBoundary>
  );
}
