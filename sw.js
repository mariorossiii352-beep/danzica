// Service worker: fa funzionare l'app senza rete.
//
// Dopo ogni modifica ai file alza VERSIONE: e' l'unico modo per far arrivare
// l'aggiornamento sui telefoni che hanno gia' installato l'app.

const VERSIONE = 'danzica-v6';

const GUSCIO = [
  './',
  './index.html',
  './seme.js',
  './stile.css',
  './app.js',
  './config.js',
  './store.js',
  './piano.js',
  './mappa.js',
  './spese.js',
  './contenuti/posti.json',
  './manifest.webmanifest',
  './icone/icona-192.png',
  './icone/icona-512.png',
  './vendor/leaflet.css',
  './vendor/leaflet.js',
  './vendor/font.css',
  './vendor/font/fraunces-latin.woff2',
  './vendor/font/fraunces-latin-ext.woff2',
  './vendor/font/karla-latin.woff2',
  './vendor/font/karla-latin-ext.woff2',
  './vendor/images/marker-icon.png',
  './vendor/images/marker-icon-2x.png',
  './vendor/images/marker-shadow.png',
  './vendor/images/layers.png',
  './vendor/images/layers-2x.png'
];

// Roba che non va mai messa in cache. I tasselli della mappa sono migliaia e
// riempirebbero il telefono; gli altri devono essere sempre freschi.
const MAI_IN_CACHE = [
  'tile.openstreetmap.org',
  'router.project-osrm.org',
  'api.frankfurter.dev',
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSIONE);
    // Uno per uno: se un file manca, gli altri entrano lo stesso in cache.
    await Promise.allSettled(GUSCIO.map((u) => cache.add(new Request(u, { cache: 'reload' }))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const nomi = await caches.keys();
    await Promise.all(nomi.filter((n) => n !== VERSIONE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (MAI_IN_CACHE.some((h) => url.hostname.endsWith(h))) return;

  // Apertura dell'app: prima la rete, cosi' arrivano gli aggiornamenti.
  // Senza rete si riapre l'ultima versione salvata.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        const cache = await caches.open(VERSIONE);
        cache.put('./index.html', r.clone());
        return r;
      } catch (err) {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Le librerie Firebase hanno il numero di versione nell'indirizzo:
  // una volta scaricate non cambiano piu'.
  if (url.hostname === 'www.gstatic.com') {
    e.respondWith((async () => {
      const salvata = await caches.match(req);
      if (salvata) return salvata;
      const r = await fetch(req);
      if (r && r.ok) (await caches.open(VERSIONE)).put(req, r.clone());
      return r;
    })());
    return;
  }

  if (url.origin !== location.origin) return;

  // File dell'app: rispondo subito con la copia salvata e intanto la aggiorno.
  e.respondWith((async () => {
    const cache = await caches.open(VERSIONE);
    const salvata = await cache.match(req);
    const dallaRete = fetch(req).then((r) => {
      if (r && r.ok) cache.put(req, r.clone());
      return r;
    }).catch(() => null);
    return salvata || (await dallaRete) || Response.error();
  })());
});
