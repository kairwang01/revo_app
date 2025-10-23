const VERSION = 'revo-v1';
const STATIC_CACHE = VERSION + '-static';
const STATIC_ASSETS = [
  // Shell + styles (paths are relative to SW scope when served over HTTP)
  '/public/index.html',
  '/public/manifest.webmanifest',
  '/public/favicon.svg',
  '/public/icons/icon-192.png',
  '/public/icons/icon-512.png',
  '/src/styles/tokens.css',
  '/src/styles/base.css',
  '/src/styles/components.css',
  '/src/styles/pages.css',
  '/src/app/main.js',
  '/src/app/router.js',
  '/src/app/config.js',
  '/src/app/api.js',
  '/src/app/storage.js',
  '/src/app/ui.js',
  '/src/app/guards.js',
  '/src/app/sw-register.js',
  '/src/app/env.js',
  '/src/components/IconSprite.svg',
  '/src/components/Header.js',
  '/src/components/BottomBar.js',
  '/src/components/Banner.js',
  '/src/components/CategoryStrip.js',
  '/src/components/Loader.js',
  '/src/components/Modal.js',
  '/src/pages/Home.js',
  '/src/pages/Curated.js',
  '/src/pages/Products.js',
  '/src/pages/ProductDetail.js',
  '/src/pages/Account.js',
  '/src/pages/Login.js',
  '/src/pages/Register.js',
  '/src/pages/Settings.js',
  '/src/pages/Cart.js',
  '/src/pages/Checkout.js',
  '/src/pages/OrderTracking.js',
  '/src/pages/NotFound.js',
  '/src/data/products.mock.json',
  '/src/data/categories.mock.json',
  '/src/data/orders.mock.json',
  '/src/data/user.mock.json',
  '/src/data/wallet.mock.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k.startsWith('revo-') && k !== STATIC_CACHE ? caches.delete(k) : null))).then(() => self.clients.claim())
  );
});

// Strategy: cache-first for static assets, network-first for API
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    // static assets cache-first
    if (STATIC_ASSETS.includes(url.pathname)) {
      event.respondWith(
        caches.match(req).then(cached => cached || fetch(req).then(res => {
          const copy = res.clone(); caches.open(STATIC_CACHE).then(c => c.put(req, copy)); return res;
        }))
      );
      return;
    }
  }
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone(); caches.open('api-' + VERSION).then(c => c.put(req, copy)); return res;
      }).catch(() => caches.match(req))
    );
  }
});
