const CACHE_NAME = "bof-pwa-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/app-logo.png",
  "/apple-touch-icon.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/split-mask.png",
  "/favicon.ico",
];

// Install Event — Pre-cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching offline assets");
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// Activate Event — Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    }),
  );
  self.clients.claim();
});

// Fetch Event — Stale-While-Revalidate with offline fallback for navigation
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Ignore non-GET requests or browser extension requests
  if (req.method !== "GET" || !req.url.startsWith("http")) return;

  // Navigation requests (HTML pages)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          // Clone and cache navigation response
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback to root / or cached match
          return caches.match(req).then((cached) => {
            return cached || caches.match("/");
          });
        }),
    );
    return;
  }

  // Static Assets (JS, CSS, SVGs, Fonts)
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset & update cache in background
        fetch(req)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
            }
          })
          .catch(() => {
            /* offline silently */
          });
        return cachedResponse;
      }

      return fetch(req)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn("[SW] Fetch failed for:", req.url, err);
        });
    }),
  );
});
