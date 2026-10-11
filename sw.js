// Guarda todos los archivos del juego para poder jugar sin internet (solo al abrirlo desde un servidor, p. ej. GitHub Pages).
var CACHE = 'memorama-v2';

var FILES = [
  './',
  'index.html',
  'css/styles.css',
  'js/data.js',
  'js/game.js',
  'js/records.js',
  'js/audio.js',
  'js/ui.js',
  'assets/fonts/fredoka.woff2',
  'assets/tux/tux.svg',
  'assets/logos/calc.svg',
  'assets/logos/chrome.svg',
  'assets/logos/excel.svg',
  'assets/logos/firefox.svg',
  'assets/logos/gimp.svg',
  'assets/logos/illustrator.svg',
  'assets/logos/impress.svg',
  'assets/logos/inkscape.svg',
  'assets/logos/kdenlive.svg',
  'assets/logos/linux.svg',
  'assets/logos/mediaplayer.svg',
  'assets/logos/outlook.svg',
  'assets/logos/photoshop.svg',
  'assets/logos/powerpoint.svg',
  'assets/logos/premiere.svg',
  'assets/logos/thunderbird.svg',
  'assets/logos/vlc.svg',
  'assets/logos/windows.svg',
  'assets/logos/word.svg',
  'assets/logos/writer.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

// Primero intenta la red (para recibir cambios); si no hay internet, usa la copia guardada.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true });
    })
  );
});
