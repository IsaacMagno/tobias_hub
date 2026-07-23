"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import Logo from "/public/tobiasIcon.webp";
import { reopenPageTour } from "@/lib/onboarding/tours";
import { useTour } from "@/components/onboarding/TourProvider";
import SettingsPanel, {
  SettingsTrigger,
} from "@/components/settings/SettingsPanel";

const BottombarMenu = () => {
  const pathname = usePathname();
  const tour = useTour();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const showGuide = tour && !tour.pageTourDone;

  const item = (href, label, exact) => {
    const active = exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className={`rounded-full border px-3 py-2 text-sm ${
          active
            ? "border-copper/40 text-copper-bright"
            : "border-copper/15 text-ash-400"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 border-t border-copper/15 bg-ink-950/95 px-3 py-3 backdrop-blur lg:hidden">
        <Link
          href="/"
          className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 ${
            pathname === "/"
              ? "border-copper/40 bg-ink-900"
              : "border-copper/15 bg-ink-950"
          }`}
        >
          <Image
            className="h-9 w-9 rounded-full object-cover"
            alt="Tobias"
            src={Logo}
            width={36}
            height={36}
          />
          <span className="text-sm font-medium text-copper">Continuar</span>
        </Link>
        {item("/timer", "Timer", true)}
        {item("/campaigns", "Campanhas", false)}
        {item("/profile", "Perfil", false)}
        {item("/analytics", "Atividade", false)}
        {item("/champions", "Campeões", false)}
        {showGuide ? (
          <button
            type="button"
            className="rounded-full border border-copper/15 px-3 py-2 text-sm text-ash-400"
            onClick={() => reopenPageTour()}
            aria-label="Abrir guia desta página"
          >
            Guia
          </button>
        ) : null}
        <SettingsTrigger onClick={() => setSettingsOpen(true)} />
      </nav>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};

export default BottombarMenu;
