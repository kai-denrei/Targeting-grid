/* 斬 Targeting Pattern Editor — service worker (vanilla, no build step)
   Strategy matrix:
     navigation (HTML) ... NetworkFirst (3s timeout) -> cache -> offline.html
     same-origin static ... StaleWhileRevalidate (icons, manifest)
     Google Fonts CSS   ... StaleWhileRevalidate
     Google Fonts files ... CacheFirst (1y)
   Update UX: never skipWaiting automatically — the page asks the user, then
   posts {type:'SKIP_WAITING'} to activate the new version.                       */

const VERSION   = 'v1.1.1';
const PRECACHE  = `precache-${VERSION}`;
const RUNTIME   = `runtime-${VERSION}`;
const FONT_CACHE = 'google-fonts-v1';

const SHELL = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon-180.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((c) => c.addAll(SHELL))
    // NOTE: no skipWaiting() here — see message handler below
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    const keep = new Set([PRECACHE, RUNTIME, FONT_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/* ---- helpers ---- */
async function networkFirst(event, timeoutMs, fallbackToOffline) {
  const cache = await caches.open(RUNTIME);
  try {
    const preload = event.preloadResponse ? await event.preloadResponse : null;
    const fresh = preload || await Promise.race([
      fetch(event.request),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
    ]);
    if (fresh && fresh.status === 200) cache.put(event.request, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    if (fallbackToOffline) return caches.match('./offline.html');
    throw e;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetching = fetch(request).then((res) => {
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  return cached || (await fetching) || Response.error();
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && (res.status === 200 || res.status === 0)) cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;          // never cache unsafe methods
  const url = new URL(request.url);

  // HTML navigations
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(event, 3000, true));
    return;
  }
  // Google Fonts
  if (url.origin === 'https://fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }
  if (url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }
  // Same-origin static assets (icons, manifest, etc.)
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME));
    return;
  }
  // Everything else: pass through
});
