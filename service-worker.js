'use strict';

var SHELL_CACHE = 'calamytryx-shell-v7';
var RUNTIME_CACHE = 'calamytryx-runtime-v7';
var SHELL_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/theme.css',
  '/my_css.css',
  '/assets/media/logo.png',
  '/assets/media/pwa-192.png',
  '/assets/media/pwa-512.png',
  '/assets/layout/pwa.js',
  '/assets/layout/theme.js',
  '/assets/vendor/pocket-bird/birb.embed.js',
  '/assets/fonts/Monocraft.ttf',
  '/pages/projects/dev_kit.html',
  '/pages/projects/dice_maker.html',
  '/pages/projects/codes_maker.html',
  '/pages/projects/meta_maker.html',
  '/pages/projects/pass_maker.html',
  '/pages/projects/palette_maker.html',
  '/assets/layout/include.js',
  '/assets/layout/render.js',
  '/assets/layout/panels.js',
  '/assets/layout/cursors.js',
  '/assets/data/layout.json',
  '/assets/layout/header.html',
  '/assets/layout/footer.html',
  '/assets/layout/body/home_hero.html',
  '/assets/layout/body/home_socials.html',
  '/assets/layout/body/home_merch.html',
  '/assets/layout/body/home_fanart.html',
  '/assets/layout/body/home_about.html',
  '/assets/layout/body/home_stream.html',
  '/assets/layout/body/home_cdc.html',
  '/assets/layout/body/home_quote.html',
  '/assets/layout/body/home_support.html'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(function (cache) { return cache.addAll(SHELL_URLS); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (names) {
        return Promise.all(names.map(function (name) {
          if (name.indexOf('calamytryx-') === 0 &&
              name !== SHELL_CACHE && name !== RUNTIME_CACHE) {
            return caches.delete(name);
          }
          return Promise.resolve(false);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          event.waitUntil(cacheResponse(request, response));
          return response;
        })
        .catch(function () {
          return caches.match(request)
            .then(function (cached) {
              return cached || caches.match('/offline.html');
            });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(function (cached) {
        return fetch(request).then(function (response) {
          event.waitUntil(cacheResponse(request, response));
          return response;
        }).catch(function (error) {
          if (cached) return cached;
          throw error;
        });
      })
  );
});

function cacheResponse(request, response) {
  if (!response || response.status !== 200 || response.type !== 'basic') {
    return Promise.resolve();
  }

  var policy = response.headers.get('Cache-Control') || '';
  if (/\bno-store\b/i.test(policy)) return Promise.resolve();

  return caches.open(RUNTIME_CACHE)
    .then(function (cache) { return cache.put(request, response.clone()); })
    .catch(function (error) {
      console.error('[pwa] failed to cache response:', request.url, error);
    });
}
