/* Tobias PWA — só o necessário para ser instalável; não intercepta navegação/API */
const CACHE = "tobias-shell-v4";
const PRECACHE = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            await cache.add(url);
          } catch {
            /* ignore */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

/* Sem listener de fetch: evita lentidão em pages/actions do Next */

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || "/";
  event.waitUntil(
    (async () => {
      try {
        const all = await clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        for (const client of all) {
          if ("focus" in client) {
            await client.focus();
            return;
          }
        }
        if (clients.openWindow) {
          await clients.openWindow(target);
        }
      } catch {
        /* ignore — evita derrubar o app ao tocar na notificação */
      }
    })()
  );
});
