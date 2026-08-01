"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";
import { useTour } from "@/components/onboarding/TourProvider";
import { Spinner } from "@/components/LoadingUI";
import {
  actionGenerateMyInvite,
  fetchMyInvite,
} from "@/app/services/requests";

export default function SettingsPanel({ open, onClose }) {
  const tour = useTour();
  const [invite, setInvite] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadInvite = useCallback(async () => {
    setLoadingInvite(true);
    try {
      setInvite(await fetchMyInvite());
    } catch {
      setInvite(null);
    } finally {
      setLoadingInvite(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadInvite();
  }, [open, loadInvite]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const generate = async () => {
    setBusy(true);
    try {
      const res = await actionGenerateMyInvite();
      if (!res?.ok) {
        toast.error(res?.message || "Falha ao gerar");
        return;
      }
      setInvite(res.invite);
      toast.success("Código gerado");
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    if (!invite?.code) return;
    try {
      await navigator.clipboard.writeText(invite.code);
      toast.success("Código copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const replayGuide = () => {
    tour?.resetAll?.();
    onClose?.();
    toast.success("Guias reiniciados — abra a página para ver de novo");
    // Reabre o da página atual se existir
    window.setTimeout(() => tour?.reopenPageTour?.(), 80);
  };

  const logout = async () => {
    setBusy(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink-950/70"
        aria-label="Fechar configurações"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="panel relative z-10 w-full max-w-md overflow-hidden shadow-2xl shadow-black/50 sm:mx-4"
      >
        <div className="flex items-center justify-between border-b border-copper/15 px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-copper">
              Conta
            </p>
            <h2
              id="settings-title"
              className="font-display text-lg text-ash-200"
            >
              Configurações
            </h2>
          </div>
          <button type="button" className="btn-ghost !px-2 !py-1 text-xs" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div className="space-y-5 px-4 py-4">
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-[0.18em] text-ash-400">
              Convite
            </h3>
            <p className="text-sm leading-relaxed text-ash-400">
              Cada pessoa convida só mais uma. O código é a única forma de
              entrar no Tobias.
            </p>
            {loadingInvite ? (
              <div className="flex justify-center py-3">
                <Spinner />
              </div>
            ) : invite ? (
              <div className="space-y-2 rounded-lg border border-copper/20 bg-ink-950/50 p-3">
                <p className="font-display text-xl tracking-wide text-copper-bright">
                  {invite.code}
                </p>
                <p className="text-xs text-ash-400">
                  {invite.used
                    ? invite.guestName
                      ? `Usado por ${invite.guestName}`
                      : "Já foi usado"
                    : "Ainda não usado · 1 vaga"}
                </p>
                {!invite.used && (
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={copyCode}
                  >
                    Copiar código
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="btn-primary text-xs"
                disabled={busy}
                onClick={generate}
              >
                {busy ? (
                  <>
                    <Spinner />
                    Gerando…
                  </>
                ) : (
                  "Gerar meu código de convite"
                )}
              </button>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-[0.18em] text-ash-400">
              Guia
            </h3>
            <p className="text-sm text-ash-400">
              Refaz os tutoriais page a page, do zero.
            </p>
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={replayGuide}
            >
              Ver guia novamente
            </button>
          </section>

          <section className="space-y-2 border-t border-copper/10 pt-4">
            <button
              type="button"
              className="btn-ghost w-full text-xs text-ember-soft"
              disabled={busy}
              onClick={logout}
            >
              Sair da conta
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Ícone discreto de engrenagem / config */
export function SettingsTrigger({ onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-ash-600 transition hover:border-copper/20 hover:text-ash-400 ${className}`}
      aria-label="Configurações"
      title="Configurações"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2.5M12 20.5V23M4.2 4.2l1.8 1.8M18 18l1.8 1.8M1 12h2.5M20.5 12H23M4.2 19.8l1.8-1.8M18 6l1.8-1.8" />
      </svg>
    </button>
  );
}
