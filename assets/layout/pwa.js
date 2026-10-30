(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/service-worker.js')
      .catch(function (error) {
        console.error('[pwa] service worker registration failed:', error);
      });
  });
})();
