// Site Ledger service worker — app-shell caching so the app works fully offline.
// Bump CACHE when shipping new assets; old caches are purged on activate.
const CACHE = 'site-ledger-v3';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/db.js',
  './js/store.js',
  './js/format.js',
  './js/i18n.js',
  './js/seed.js',
  './js/views/home.js',
  './js/views/unit.js',
  './js/views/categoryHistory.js',
  './js/views/unitEdit.js',
  './js/views/quickAdd.js',
  './js/views/workers.js',
  './js/views/reports.js',
  './js/views/statement.js',
  './js/views/sheets.js',
  './js/views/components.js',
  './fonts/Outfit-VariableFont_wght.ttf',
  './fonts/DMSerifDisplay-Regular.ttf',
  './fonts/DMSerifDisplay-Italic.ttf',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll fails the whole install if any file 404s; add individually so a
      // missing optional asset can't brick the install.
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: serve the cached shell when offline so the app always opens.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Static assets: cache-first, then fill the cache in the background.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
