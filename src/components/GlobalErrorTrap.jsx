"use client";

import { useEffect } from "react";

/**
 * Captura erros fora do React (ex.: setInterval, promises) para diagnóstico.
 */
export default function GlobalErrorTrap() {
  useEffect(() => {
    const save = (message, stack = "") => {
      try {
        window.sessionStorage.setItem(
          "tobias-last-error",
          JSON.stringify({
            message: String(message || "unknown"),
            stack: String(stack || ""),
            at: new Date().toISOString(),
          })
        );
      } catch {
        /* ignore */
      }
      console.error("[Tobias]", message, stack);
    };

    const onError = (event) => {
      save(event?.error?.message || event?.message, event?.error?.stack);
    };
    const onRejection = (event) => {
      const reason = event?.reason;
      save(
        reason?.message || reason || "unhandledrejection",
        reason?.stack || ""
      );
      // Evita o Next trocar a página inteira por causa de promise órfã.
      event?.preventDefault?.();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
