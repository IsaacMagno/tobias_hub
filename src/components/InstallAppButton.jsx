"use client";

import { useEffect, useState } from "react";

/**
 * Chrome/Edge no desktop raramente mostram banner automático.
 * Este botão captura `beforeinstallprompt` e oferece "Instalar app".
 */
export default function InstallAppButton({ className = "" }) {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showManualHint, setShowManualHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return undefined;
    }

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShowManualHint(false);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const t = setTimeout(() => setShowManualHint(true), 3500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(t);
    };
  }, []);

  if (installed) {
    return (
      <p className={`text-xs text-ash-400 ${className}`}>
        App instalado (modo standalone).
      </p>
    );
  }

  const handleInstall = async () => {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
    }
    setDeferred(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {deferred ? (
        <button type="button" className="btn-ghost w-full" onClick={handleInstall}>
          Instalar app (PWA)
        </button>
      ) : showManualHint ? (
        <p className="text-xs leading-relaxed text-ash-400">
          Para instalar: no Chrome/Edge, clique no ícone de instalar na barra de
          endereço (ou menu ⋮ → Instalar Tobias). No celular: Compartilhar /
          menu → Adicionar à tela inicial.
        </p>
      ) : (
        <p className="text-xs text-ash-400">Verificando instalação PWA…</p>
      )}
    </div>
  );
}
