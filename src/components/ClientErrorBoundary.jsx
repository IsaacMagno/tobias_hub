"use client";

import { Component } from "react";

/** Mostra a mensagem real se ainda crashar (em vez da tela preta genérica). */
export default class ClientErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("[Tobias]", error);
    try {
      window.sessionStorage.setItem(
        "tobias-last-error",
        String(error?.message || error)
      );
    } catch {
      /* ignore */
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-copper">Erro</p>
          <h1 className="font-display text-2xl text-ash-200">
            O Tobias travou nesta tela
          </h1>
          <p className="break-words rounded-lg border border-copper/20 bg-ink-900 px-3 py-3 text-left text-xs text-ash-400">
            {this.state.error?.message || String(this.state.error)}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
