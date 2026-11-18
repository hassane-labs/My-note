/* ==========================================================================
   My Note - Service Worker (Cache-first pour assets, offline-first)
   Compatible GitHub Pages (sous-répertoire) et racine
   ========================================================================== */

// Détecte le base path automatiquement (ex: /My-note/ sur GitHub Pages)
const BASE_PATH = (() => {
  const scope = self.registration.scope;
  const origin = self.location.origin;
  // scope = "https://hassane-labs.github.io/My-note/"
  // origin = "https://hassane-labs.github.io"
  // basePath = "/My-note/"
  return scope.slice(origin.length);
})();

const CACHE_NAME = 'my-note-v1';
const ASSETS_CACHE = 'my-note-assets-v1';

// Fichiers à mettre en cache au install (chemins relatifs au BASE_PATH)
const ASSETS = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'css/tokens.css',
  BASE_PATH + 'css/base.css',
  BASE_PATH + 'css/layout.css',
  BASE_PATH + 'css/components.css',
  BASE_PATH + 'css/themes.css',
  BASE_PATH + 'css/print.css',
  BASE_PATH + 'js/main.js',
  BASE_PATH + 'js/db.js',
  BASE_PATH + 'js/store.js',
  BASE_PATH + 'js/editor.js',
  BASE_PATH + 'js/tabs.js',
  BASE_PATH + 'js/search.js',
  BASE_PATH + 'js/findreplace.js',
  BASE_PATH + 'js/palette.js',
  BASE_PATH + 'js/markdown.js',
  BASE_PATH + 'js/revisions.js',
  BASE_PATH + 'js/export.js',
  BASE_PATH + 'js/settings.js',
  BASE_PATH + 'js/i18n.js',
  BASE_PATH + 'js/shortcuts.js',
  BASE_PATH + 'js/utils.js',
  BASE_PATH + 'vendor/marked.min.js',
  BASE_PATH + 'vendor/dompurify.min.js',
  BASE_PATH + 'assets/logo.svg',
  BASE_PATH + 'assets/favicon.svg',
  BASE_PATH + 'assets/icons/icon-192.png',
  BASE_PATH + 'assets/icons/icon-512.png',
  BASE_PATH + 'assets/icons/icon-maskable-512.png'
];

// Installation : mise en cache des assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ASSETS_CACHE)
      .then((cache) => {
        console.log('[SW] Caching assets at', BASE_PATH);
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Cache install failed:', err);
      })
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

// Stratégie : Cache-first pour les assets, Network-first pour le reste
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

  // Ne pas intercepter les requêtes en dehors de notre scope
  if (!url.pathname.startsWith(BASE_PATH)) {
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
            // Offline : pour les pages HTML/navigation, retourner index.html (SPA)
            if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
              return caches.match(BASE_PATH + 'index.html');
            }
            // Pour les autres ressources, échouer proprement
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
  console.log('[SW] Controller changed');
});