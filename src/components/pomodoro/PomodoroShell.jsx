"use client";

import { PomodoroProvider } from "./PomodoroProvider";
import { PipHost } from "./PipHost";
import ClientErrorBoundary from "@/components/ClientErrorBoundary";
import UnlockReloadListener from "@/components/UnlockReloadListener";

export default function PomodoroShell({ children }) {
  return (
    <ClientErrorBoundary>
      <UnlockReloadListener />
      <PomodoroProvider>
        <PipHost>{children}</PipHost>
      </PomodoroProvider>
    </ClientErrorBoundary>
  );
}
