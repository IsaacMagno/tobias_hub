"use client";

import { useEffect, useState } from "react";
import { requestAlarmPermissions } from "@/lib/pomodoro/alarm";

const STORAGE_KEY = "tobias-permissions-prompt";

function alreadyHandled() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markHandled() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Pede som + notificações assim que o app abre (com um toque —
 * browsers bloqueiam requestPermission sem gesto).
 */
export default function AppPermissionsPrompt() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!("Notification" in window)) return undefined;
    if (Notification.permission !== "default") {
      markHandled();
      return undefined;
    }
    if (alreadyHandled()) return undefined;

    const id = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(id);
  }, []);

  const dismiss = () => {
    markHandled();
    setOpen(false);
  };

  const allow = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await requestAlarmPermissions();
    } finally {
      markHandled();
      setBusy(false);
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink-950/75"
        aria-label="Fechar"
        onClick={dismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="perm-title"
        className="panel relative z-10 w-full max-w-md overflow-hidden shadow-2xl shadow-black/50 sm:mx-4"
      >
        <div className="space-y-3 px-4 py-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-copper">
            Permissões
          </p>
          <h2 id="perm-title" className="font-display text-xl text-ash-200">
            Ative o alarme do Tobias
          </h2>
          <p className="text-sm leading-relaxed text-ash-400">
            Para o timer avisar com som e notificação — inclusive com a tela
            bloqueada — o navegador precisa liberar notificações. Ao iniciar o
            foco, o Tobias mantém o app acordado o suficiente para o alarme
            tocar na hora.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={allow}
            >
              {busy ? "Pedindo…" : "Permitir"}
            </button>
            <button type="button" className="btn-ghost" onClick={dismiss}>
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
