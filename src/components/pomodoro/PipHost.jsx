"use client";

import { createContext, useContext } from "react";
import useDocumentPipTimer from "./useDocumentPipTimer";

const PipContext = createContext(null);

/** Mantém o Picture-in-Picture vivo sem renderizar a barra do topo. */
export function PipHost({ children }) {
  const pip = useDocumentPipTimer();
  return <PipContext.Provider value={pip}>{children}</PipContext.Provider>;
}

export function usePip() {
  const ctx = useContext(PipContext);
  if (!ctx) throw new Error("usePip fora do PipHost");
  return ctx;
}
