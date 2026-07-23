"use client";

import { useEffect, useState } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        if (!cancelled) {
          await navigator.serviceWorker.ready;
          // força update do SW antigo (v1 quebrado)
          reg.update?.();
        }
      } catch (err) {
        console.warn("[Tobias PWA] SW não registrou:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
