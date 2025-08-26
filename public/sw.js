/* ===========================
   Service Worker - Instalaciones
   =========================== */

const APP_PREFIX = "instalaciones";
const VERSION = "v1";
const STATIC_CACHE = `${APP_PREFIX}-static-${VERSION}`;
const RUNTIME_CACHE = `${APP_PREFIX}-runtime-${VERSION}`;

/** Recursos base que querés disponibles offline */
const APP_SHELL = [
  "/",                       // Home
  "/offline",               // Página de fallback (creá /app/offline/page.tsx)
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico"
];

/* ---------- Helpers de estrategia ---------- */
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, { fallbackUrl = "/offline" } = {}) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const shell = await caches.open(STATIC_CACHE).then(c => c.match(fallbackUrl));
    return shell || new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  const networkPromise = fetch(request)
    .then(res => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || networkPromise;
}

/* ---------- Install: precache del shell ---------- */
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.all(
      APP_SHELL.map(async (url) => {
        try {
          // cache:'reload' evita servir versiones viejas
          await cache.add(new Request(url, { cache: "reload" }));
        } catch {
          // si algún recurso no existe aún, no rompas la instalación
        }
      })
    );
    self.skipWaiting();
  })());
});

/* ---------- Activate: limpiar versiones viejas ---------- */
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE].includes(k) && k.startsWith(APP_PREFIX))
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/* ---------- Fetch: estrategias por tipo de request ---------- */
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Navegaciones (HTML): network-first con fallback a /offline
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, { fallbackUrl: "/offline" }));
    return;
  }

  // Assets de Next (mismo origen): cache-first
  if (sameOrigin && (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/static/"))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Imágenes / íconos locales: cache-first
  if (sameOrigin && /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Resto de GET: stale-while-revalidate (mejor UX)
  event.respondWith(staleWhileRevalidate(request));
});

/* ---------- Mensajes: forzar activación inmediata ---------- */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
