export function Spinner({ className = "h-3.5 w-3.5" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border border-current border-r-transparent ${className}`}
      aria-hidden
    />
  );
}

/** Barra fina no topo durante ações do servidor. */
export function BusyRail({ active, label }) {
  if (!active) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60]"
      role="status"
      aria-live="polite"
    >
      <div className="h-0.5 w-full overflow-hidden bg-ink-800">
        <div className="busy-rail-bar h-full w-1/3 bg-copper" />
      </div>
      {label ? (
        <p className="mx-auto mt-2 w-fit rounded-full border border-copper/20 bg-ink-950/90 px-3 py-1 text-[11px] text-ash-300 backdrop-blur">
          {label}
        </p>
      ) : null}
    </div>
  );
}

export function ContinueSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-24 lg:pb-8">
      <div className="space-y-3">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-9 w-3/4 max-w-md" />
        <div className="skeleton h-4 w-full max-w-lg" />
        <div className="skeleton h-3 w-48" />
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-7 w-36 rounded-full" />
        <div className="skeleton h-7 w-32 rounded-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel space-y-3 p-5">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
          <div className="flex gap-2 pt-2">
            <div className="skeleton h-10 w-32" />
            <div className="skeleton h-10 w-28" />
          </div>
        </div>
        <div className="panel space-y-4 p-5">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-12 w-40" />
          <div className="skeleton h-1.5 w-full" />
          <div className="skeleton h-10 w-28" />
        </div>
      </div>
      <p className="text-center text-xs tracking-[0.18em] text-ash-400 uppercase">
        Carregando
      </p>
    </div>
  );
}
