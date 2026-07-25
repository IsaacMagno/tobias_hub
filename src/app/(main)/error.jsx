"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("[Tobias] route error:", error);
    try {
      window.sessionStorage.setItem(
        "tobias-last-error",
        JSON.stringify({
          message: error?.message || String(error),
          digest: error?.digest || "",
          at: new Date().toISOString(),
        })
      );
    } catch {
      /* ignore */
    }
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-copper">Erro</p>
      <h1 className="font-display text-2xl text-ash-200">
        Falha ao carregar esta tela
      </h1>
      <p className="break-words rounded-lg border border-copper/20 bg-ink-900 px-3 py-3 text-left text-xs text-ash-400">
        {error?.message || "Erro desconhecido"}
      </p>
      <button type="button" className="btn-primary" onClick={() => reset()}>
        Tentar de novo
      </button>
    </div>
  );
}
