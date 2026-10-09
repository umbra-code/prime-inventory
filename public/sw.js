// Service worker: lets the app load and work offline after the first visit.
// Only same-origin requests are handled; the catalog refresh (jsDelivr) is
// cached by the app itself in localStorage.

const VERSION = "v2";
const PAGES = `pages-${VERSION}`;
const STATIC = `static-${VERSION}`;
const IMAGES = `images-${VERSION}`;

// Old build assets and images pile up across releases; keep the newest ones.
const MAX_STATIC_ENTRIES = 300;
const MAX_IMAGE_ENTRIES = 1500;
// On a slow connection, fall back to the cached page instead of waiting.
const NAVIGATION_TIMEOUT_MS = 3000;

// Shown instead of a broken image for pictures never loaded while online.
const PLACEHOLDER_IMAGE = new Response(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>',
  { headers: { "Content-Type": "image/svg+xml" } }
);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((cache) => cache.add("/")));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const current = [PAGES, STATIC, IMAGES];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !current.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

const trimCache = async (cacheName, maxEntries) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  // Cache keys come back in insertion order, so the oldest go first.
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map((key) => cache.delete(key)));
};

const cacheFirst = async (request, cacheName, maxEntries, fallback) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      trimCache(cacheName, maxEntries);
    }
    return response;
  } catch (error) {
    if (fallback) return fallback.clone();
    throw error;
  }
};

// For files that keep their URL across releases (e.g. /icons/): answer from the
// cache right away and refresh it in the background.
const staleWhileRevalidate = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached ?? (await network) ?? Response.error();
};

const networkFirst = async (request) => {
  const cache = await caches.open(PAGES);
  const network = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  const timeout = new Promise((resolve) => setTimeout(resolve, NAVIGATION_TIMEOUT_MS));

  try {
    const response = await Promise.race([network, timeout]);
    if (response) return response;
  } catch {
    // Offline: use the cached page below.
  }
  const cached = (await cache.match(request)) ?? (await cache.match("/"));
  return cached ?? network;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  } else if (url.pathname === "/_next/image") {
    event.respondWith(cacheFirst(request, IMAGES, MAX_IMAGE_ENTRIES, PLACEHOLDER_IMAGE));
  } else if (url.pathname.startsWith("/_next/static/")) {
    // Hashed file names: a cached copy is never stale.
    event.respondWith(cacheFirst(request, STATIC, MAX_STATIC_ENTRIES));
  } else if (url.pathname.startsWith("/icons/")) {
    event.respondWith(staleWhileRevalidate(request, STATIC));
  }
});
