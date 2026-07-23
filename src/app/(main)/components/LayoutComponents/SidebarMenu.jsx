"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "/public/tobiasIcon.webp";
import InstallAppButton from "@/components/InstallAppButton";

const links = [
  { href: "/", label: "Continuar" },
  { href: "/timer", label: "Timer" },
  { href: "/campaigns", label: "Campanhas" },
  { href: "/profile", label: "Perfil" },
  { href: "/analytics", label: "Atividade" },
  { href: "/champions", label: "Campeões" },
];

const SidebarMenu = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 z-20 hidden w-60 flex-shrink-0 border-r border-copper/15 bg-ink-950/95 p-4 lg:block">
      <Link href="/" className="mb-10 mt-4 flex flex-col items-center gap-3">
        <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-copper/30 bg-ink-900">
          <Image
            className="h-[72px] w-[72px] rounded-full object-cover"
            alt="Tobias"
            src={Logo}
            width={72}
            height={72}
            priority
          />
        </span>
        <span className="font-display text-lg tracking-wide text-copper">
          Tobias
        </span>
      </Link>

      <nav>
        <ul className="space-y-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border border-copper/25 bg-copper/10 text-copper-bright"
                      : "border border-transparent text-ash-300 hover:bg-ink-800"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-6 left-4 right-4 space-y-3">
        <InstallAppButton />
        <p className="text-[10px] leading-relaxed text-ink-600">
          Guia de progressão · dark / RPG
        </p>
      </div>
    </aside>
  );
};

export default SidebarMenu;
