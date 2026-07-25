/* Tobias PWA — instalável + alarme agendado (backup com tela bloqueada) */
const CACHE = "tobias-shell-v5";
const PRECACHE = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

let alarmTimerId = null;

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

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "CANCEL_ALARM") {
    if (alarmTimerId != null) {
      clearTimeout(alarmTimerId);
      alarmTimerId = null;
    }
    return;
  }

  if (data.type !== "SCHEDULE_ALARM") return;

  if (alarmTimerId != null) {
    clearTimeout(alarmTimerId);
    alarmTimerId = null;
  }

  const delay = Math.max(0, Number(data.endsAt) - Date.now());
  const title = data.title || "Tobias";
  const body = data.body || "Bloco concluído.";
  const tag = data.tag || "tobias-alarm";

  // Mantém o SW vivo até o alarme (melhor esforço; SO pode matar antes).
  event.waitUntil(
    new Promise((resolve) => {
      alarmTimerId = setTimeout(async () => {
        alarmTimerId = null;
        try {
          await self.registration.showNotification(title, {
            body,
            tag,
            renotify: true,
            requireInteraction: true,
            silent: false,
            vibrate: [500, 200, 500, 200, 500, 200, 800],
            data: { url: "/timer", kind: "alarm" },
            badge: "/icons/icon-192.png",
            icon: "/icons/icon-192.png",
          });
        } catch {
          /* ignore */
        }
        resolve();
      }, delay);
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || "/timer";
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
        /* ignore */
      }
    })()
  );
});
