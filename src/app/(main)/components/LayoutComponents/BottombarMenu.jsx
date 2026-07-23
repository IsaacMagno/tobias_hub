"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Logo from "/public/tobiasIcon.webp";

const BottombarMenu = () => {
  const pathname = usePathname();

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
    </nav>
  );
};

export default BottombarMenu;
