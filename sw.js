/* ==========================================================================
   My Note - Service Worker (Cache-first pour assets, offline-first)
   ========================================================================== */

const CACHE_NAME = 'my-note-v1';
const ASSETS_CACHE = 'my-note-assets-v1';

// Fichiers à mettre en cache au install
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/tokens.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/themes.css',
  './css/print.css',
  './js/main.js',
  './js/db.js',
  './js/store.js',
  './js/editor.js',
  './js/tabs.js',
  './js/search.js',
  './js/findreplace.js',
  './js/palette.js',
  './js/markdown.js',
  './js/revisions.js',
  './js/export.js',
  './js/settings.js',
  './js/i18n.js',
  './js/shortcuts.js',
  './js/utils.js',
  './vendor/marked.min.js',
  './vendor/dompurify.min.js',
  './assets/logo.svg',
  './assets/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png'
];

// Installation : mise en cache des assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ASSETS_CACHE)
      .then((cache) => {
        console.log('[SW] Caching assets');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoyage anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== ASSETS_CACHE)
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Stratégie : Cache-first pour les assets, Network-first pour le reste (mais tout est statique)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP/HTTPS (ex: chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Ne pas intercepter les requêtes vers d'autres origines (sécurité)
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Si en cache, servir depuis le cache
        if (cachedResponse) {
          return cachedResponse;
        }

        // Sinon, aller au réseau
        return fetch(request)
          .then((networkResponse) => {
            // Mettre en cache si succès
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(ASSETS_CACHE)
                .then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline : pour les pages HTML, retourner index.html (SPA)
            if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
              return caches.match('./index.html');
            }
            // Pour les autres ressources, échouer
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

// Gestion des messages depuis l'app (ex: skipWaiting)
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Notification de mise à jour disponible
self.addEventListener('controllerchange', () => {
  // Le SW a été mis à jour, on pourrait notifier l'utilisateur
  console.log('[SW] Controller changed');
});