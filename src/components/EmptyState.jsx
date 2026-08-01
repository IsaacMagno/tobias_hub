import Image from "next/image";
import EmptyArt from "/public/tobias-empty.png";

/**
 * Estado vazio com a arte de gravura do Tobias.
 * `mix-blend-lighten` funde o fundo escuro da arte com o painel.
 */
export default function EmptyState({ title, hint, children, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center text-center ${
        compact ? "gap-3 py-6" : "gap-4 py-10"
      }`}
    >
      <Image
        src={EmptyArt}
        alt=""
        aria-hidden
        className={`select-none mix-blend-lighten opacity-90 ${
          compact ? "w-36" : "w-48 sm:w-56"
        }`}
        priority={false}
      />
      {title ? (
        <p className="font-display text-lg text-ash-200">{title}</p>
      ) : null}
      {hint ? (
        <p className="max-w-sm text-sm leading-relaxed text-ash-400">{hint}</p>
      ) : null}
      {children ? (
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** Divisor ornamental discreto (linha + losango copper). */
export function OrnamentDivider({ className = "" }) {
  return (
    <div
      className={`flex items-center gap-3 text-copper/30 ${className}`}
      aria-hidden
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-copper/25" />
      <span className="h-1.5 w-1.5 rotate-45 border border-copper/40" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-copper/25" />
    </div>
  );
}
