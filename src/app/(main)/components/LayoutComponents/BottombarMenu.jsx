"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import Logo from "/public/tobiasIcon.webp";
import { reopenPageTour } from "@/lib/onboarding/tours";
import { useTour } from "@/components/onboarding/TourProvider";
import SettingsPanel from "@/components/settings/SettingsPanel";

const primary = [
  { href: "/", label: "Continuar", exact: true, icon: "home" },
  { href: "/timer", label: "Timer", exact: true, icon: "timer" },
  { href: "/campaigns", label: "Campanhas", exact: false, icon: "flag" },
  { href: "/profile", label: "Perfil", exact: false, icon: "user" },
];

const secondary = [
  { href: "/community", label: "Comunidade" },
  { href: "/finance", label: "Finanças" },
  { href: "/analytics", label: "Atividade" },
  { href: "/streaks", label: "Sequências" },
  { href: "/champions", label: "Campeões" },
];

function NavIcon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  if (name === "timer") {
    return (
      <svg {...common}>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2 2" />
        <path d="M9 2h6" />
      </svg>
    );
  }
  if (name === "flag") {
    return (
      <svg {...common}>
        <path d="M5 21V4" />
        <path d="M5 4h10l-1.5 4L19 12H5" />
      </svg>
    );
  }
  if (name === "user") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
      </svg>
    );
  }
  if (name === "more") {
    return (
      <svg {...common}>
        <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return null;
}

function isActive(pathname, href, exact) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const BottombarMenu = () => {
  const pathname = usePathname();
  const tour = useTour();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const showGuide = tour && !tour.pageTourDone;

  const secondaryActive = secondary.some((l) =>
    isActive(pathname, l.href, false)
  );

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/70"
            aria-label="Fechar menu"
            onClick={() => setMoreOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mais opções"
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-copper/20 bg-ink-950 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl shadow-black/50"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-copper/25" />
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-copper">
              Mais
            </p>
            <ul className="space-y-1 pb-2">
              {secondary.map((link) => {
                const active = isActive(pathname, link.href, false);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className={`block rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                        active
                          ? "bg-copper/10 text-copper-bright"
                          : "text-ash-200 hover:bg-ink-800"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              {showGuide ? (
                <li>
                  <button
                    type="button"
                    className="w-full rounded-xl px-4 py-3.5 text-left text-sm font-medium text-ash-200 hover:bg-ink-800"
                    onClick={() => {
                      setMoreOpen(false);
                      reopenPageTour();
                    }}
                  >
                    Guia desta página
                  </button>
                </li>
              ) : null}
              <li>
                <button
                  type="button"
                  className="w-full rounded-xl px-4 py-3.5 text-left text-sm font-medium text-ash-200 hover:bg-ink-800"
                  onClick={() => {
                    setMoreOpen(false);
                    setSettingsOpen(true);
                  }}
                >
                  Configurações
                </button>
              </li>
            </ul>
          </div>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-copper/15 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Navegação principal"
      >
        <div className="grid grid-cols-5">
          {primary.map((link) => {
            const active = isActive(pathname, link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-w-0 flex-col items-center gap-1 px-1 pb-2 pt-2.5 transition ${
                  active ? "text-copper-bright" : "text-ash-400"
                }`}
              >
                {link.icon === "home" ? (
                  <span
                    className={`flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border ${
                      active ? "border-copper/50" : "border-copper/20"
                    }`}
                  >
                    <Image
                      className="h-6 w-6 object-cover"
                      alt=""
                      src={Logo}
                      width={24}
                      height={24}
                    />
                  </span>
                ) : (
                  <NavIcon name={link.icon} />
                )}
                <span className="max-w-full truncate text-[10px] font-medium leading-none tracking-wide">
                  {link.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            className={`flex min-w-0 flex-col items-center gap-1 px-1 pb-2 pt-2.5 transition ${
              moreOpen || secondaryActive
                ? "text-copper-bright"
                : "text-ash-400"
            }`}
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-label="Mais opções"
          >
            <NavIcon name="more" />
            <span className="max-w-full truncate text-[10px] font-medium leading-none tracking-wide">
              Mais
            </span>
          </button>
        </div>
      </nav>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};

export default BottombarMenu;
