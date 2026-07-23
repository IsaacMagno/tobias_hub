"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "/public/tobiasIcon.webp";

function useAnchorRect(anchorId, stepIndex) {
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    if (!anchorId) {
      setRect(null);
      return undefined;
    }

    let cancelled = false;
    const measure = () => {
      const el = document.querySelector(`[data-tour="${anchorId}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (!cancelled) {
        setRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          bottom: r.bottom,
        });
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    };

    measure();
    const t = window.setTimeout(measure, 80);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [anchorId, stepIndex]);

  return rect;
}

export default function PageTourCard({ tour, onComplete, onSkipAll }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const steps = tour.steps || [];
  const step = steps[stepIndex];
  const total = steps.length;
  const isLast = stepIndex >= total - 1;
  const rect = useAnchorRect(step?.anchor, stepIndex);

  useEffect(() => {
    setStepIndex(0);
  }, [tour.id]);

  if (!step) return null;

  const finish = () => {
    onComplete?.();
  };

  const goNext = () => {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const goPrev = () => setStepIndex((i) => Math.max(0, i - 1));

  const runCta = () => {
    if (step.ctaHref) {
      finish();
      router.push(step.ctaHref);
      return;
    }
    goNext();
  };

  const cardStyle = (() => {
    if (!rect) {
      return {
        position: "fixed",
        left: "50%",
        bottom: "max(1.25rem, env(safe-area-inset-bottom))",
        transform: "translateX(-50%)",
        width: "min(28rem, calc(100vw - 1.5rem))",
      };
    }
    const gap = 12;
    const preferBelow = rect.bottom + 220 < window.innerHeight;
    const top = preferBelow
      ? Math.min(rect.bottom + gap, window.innerHeight - 220)
      : Math.max(12, rect.top - gap - 200);
    const left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - 12 - Math.min(420, window.innerWidth - 24)
    );
    return {
      position: "fixed",
      top,
      left,
      width: "min(26rem, calc(100vw - 1.5rem))",
    };
  })();

  return (
    <div className="pointer-events-none fixed inset-0 z-[85]" aria-live="polite">
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-copper/70 transition-all duration-200"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(10, 9, 8, 0.72)",
          }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-ink-950/55" />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="page-tour-title"
        className="pointer-events-auto panel overflow-hidden shadow-2xl shadow-black/50"
        style={cardStyle}
      >
        <div className="flex items-center gap-3 border-b border-copper/15 bg-ink-900/80 px-4 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-copper/30 bg-ink-950">
            <Image
              src={Logo}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 object-cover"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-copper">
              Guia · {stepIndex + 1}/{total}
            </p>
            <h2
              id="page-tour-title"
              className="truncate font-display text-lg text-ash-200"
            >
              {step.title}
            </h2>
          </div>
          <button
            type="button"
            className="btn-ghost !px-2 !py-1 text-[11px]"
            onClick={onSkipAll}
          >
            Pular tudo
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <p className="text-sm leading-relaxed text-ash-300">{step.body}</p>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={goPrev}
              disabled={stepIndex === 0}
            >
              Voltar
            </button>
            <div className="flex flex-wrap gap-2">
              {step.ctaHref ? (
                <button
                  type="button"
                  className="btn-primary text-xs"
                  onClick={runCta}
                >
                  {step.ctaLabel || "Continuar"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary text-xs"
                  onClick={goNext}
                >
                  {isLast
                    ? tour.nextLabel && tour.nextHref
                      ? "Concluir"
                      : "Entendi"
                    : "Próximo"}
                </button>
              )}
              {isLast && tour.nextHref && !step.ctaHref ? (
                <button
                  type="button"
                  className="btn-ghost text-xs"
                  onClick={() => {
                    finish();
                    router.push(tour.nextHref);
                  }}
                >
                  {tour.nextLabel || "Próximo"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
