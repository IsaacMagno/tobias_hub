"use client";

import { Component } from "react";

function rememberError(error) {
  try {
    const payload = {
      message: error?.message || String(error),
      stack: error?.stack || "",
      at: new Date().toISOString(),
    };
    window.sessionStorage.setItem("tobias-last-error", JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

/**
 * Evita a tela preta genérica do Next e mostra o erro real.
 */
export default class ClientErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    rememberError(error);
    console.error("[Tobias] client crash:", error);
  }

  render() {
    if (this.state.error) {
      const msg =
        this.state.error?.message ||
        "Erro inesperado. Feche e abra o Tobias de novo.";
      return (
        <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-copper">
            Algo falhou
          </p>
          <h1 className="font-display text-2xl text-ash-200">
            O Tobias travou nesta tela
          </h1>
          <p className="break-words rounded-lg border border-copper/20 bg-ink-900 px-3 py-3 text-left text-xs text-ash-400">
            {msg}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              this.setState({ error: null });
              if (typeof window !== "undefined") window.location.reload();
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
