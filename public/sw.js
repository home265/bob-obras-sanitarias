// public/sw.js
const CACHE_NAME = 'sanitarias-cache-v1';
const urlsToCache = [
  '/',
  // Agrega aquí las rutas a tus páginas y assets principales
  // Por ejemplo: '/agua', '/sanitaria', '/globals.css'
  // Esto se puede automatizar en el build, pero para empezar es suficiente
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_AAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});