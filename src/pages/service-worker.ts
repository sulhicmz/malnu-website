import type { APIRoute } from 'astro';

export const prerender = false;

const filesToCache = [
  '/',
  '/ppdb',
  '/e-learning',
  '/alumni',
  '/absensi'
];

const swScript = `
  const CACHE_NAME = 'ma-malnu-kananga-v1';
  const CORE_ASSETS = ${JSON.stringify(filesToCache)};
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
    );
  });
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())
    );
  });
  self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            const copy = response.clone();
            const url = new URL(request.url);
            if (url.origin === location.origin) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => caches.match('/'));
      })
    );
  });
`;

export const GET: APIRoute = () =>
  new Response(swScript, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
