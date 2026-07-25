"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { usePip } from "./PipHost";

/**
 * Botão Flutuar / Recolher — abre Document Picture-in-Picture no PC.
 */
export default function FloatTimerButton({
  className = "btn-ghost",
  onlyWhenActive = true,
  phase = null,
}) {
  const { available, pipOpen, openPip, closePip } = usePip();
  const [busy, setBusy] = useState(false);

  if (!available) return null;
  if (onlyWhenActive && phase === "idle") return null;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (pipOpen) closePip();
      else await openPip();
    } catch (e) {
      toast.error(
        e.message ||
          "Não foi possível flutuar. Use Chrome/Edge no PC (PWA ou site)."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      disabled={busy}
      title="Janela flutuante por cima de outros apps (PC Chrome/Edge)"
    >
      {pipOpen ? "Recolher" : "Flutuar"}
    </button>
  );
}
