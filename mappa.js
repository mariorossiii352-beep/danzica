// Mappa OpenStreetMap disegnata con Leaflet, tempi di viaggio dal servizio
// pubblico OSRM. Niente chiavi, niente account, niente carta di credito.
//
// I tasselli della mappa e i percorsi arrivano dalla rete: senza connessione
// la mappa resta grigia, mentre il resto dell'app continua a funzionare.
// Ogni percorso calcolato finisce in cache: la stessa tratta non si chiede due volte.

import { CONFIG } from './config.js';

const CACHE = 'danzica:cache';
const cache = leggiCache();

function leggiCache() {
  try { return JSON.parse(localStorage.getItem(CACHE) || '{}'); } catch (e) { return {}; }
}
function salvaCache() {
  try { localStorage.setItem(CACHE, JSON.stringify(cache)); } catch (e) { /* piena */ }
}
function daCache(chiave) { return cache[chiave]; }
function inCache(chiave, valore) { cache[chiave] = valore; salvaCache(); return valore; }

// --- Leaflet -----------------------------------------------------------

const TASSELLI = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUZIONE = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

let promessaL = null;
function caricaLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (promessaL) return promessaL;
  promessaL = new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = 'vendor/leaflet.js';
    s.onload = () => (window.L ? ok(window.L) : no(new Error('Leaflet non si e\' installato')));
    s.onerror = () => no(new Error('Leaflet non caricato'));
    document.head.appendChild(s);
  });
  return promessaL;
}

async function creaMappa(elemento, centro, zoom) {
  const L = await caricaLeaflet();
  // I comandi dello zoom vanno in basso a destra: in alto c'e' la ricerca.
  const m = L.map(elemento, { zoomControl: false, attributionControl: true });
  L.control.zoom({ position: 'bottomright' }).addTo(m);
  m.setView([centro.lat, centro.lng], zoom || 14);
  L.tileLayer(TASSELLI, { maxZoom: 19, attribution: ATTRIBUZIONE }).addTo(m);
  return m;
}

// Segnaposto rotondi disegnati in CSS: nessuna immagine da scaricare e
// il colore dice la categoria.
async function segnaposti(mappa, lista, alTocco) {
  const L = await caricaLeaflet();
  const fatti = [];
  for (const p of lista) {
    if (p.lat == null || p.lng == null) continue;
    const icona = L.divIcon({
      className: 'pin pin-' + (p.categoria || 'altro'),
      html: '<i></i>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    const s = L.marker([p.lat, p.lng], { icon: icona, title: p.nome, keyboard: true }).addTo(mappa);
    if (alTocco) s.on('click', () => alTocco(p));
    fatti.push(s);
  }
  return fatti;
}

// --- distanze e tempi --------------------------------------------------

const R = 6371000;
function distanza(a, b) {
  const rad = (x) => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Stima senza rete: strade reali circa 1,35 volte la linea d'aria.
function stimaGrezza(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const metri = Math.round(distanza(a, b) * 1.35);
  return {
    metri: metri,
    piedi_min: Math.max(1, Math.round(metri / 75)),        // ~4,5 km/h
    mezzi_min: Math.max(5, Math.round(metri / 300) + 8),   // ~18 km/h piu' attesa
    taxi_min: Math.max(3, Math.round(metri / 420)),        // ~25 km/h
    biglietto_zl: null,
    stimato: true
  };
}

function chiaveTratta(a, b) { return 'tratta:' + (a || 'casa') + '>' + (b || 'casa'); }

const OSRM = 'https://router.project-osrm.org/route/v1';

async function percorso(modo, da, a) {
  const url = OSRM + '/' + modo + '/' + da.lng + ',' + da.lat + ';' + a.lng + ',' + a.lat + '?overview=false';
  const r = await fetch(url);
  if (!r.ok) return null;
  const d = await r.json();
  const rotta = (d.routes || [])[0];
  if (!rotta) return null;
  return { min: Math.max(1, Math.round(rotta.duration / 60)), metri: Math.round(rotta.distance) };
}

// Il server pubblico di OSRM calcola solo percorsi in automobile: anche
// chiedendo "a piedi" risponde con i tempi dell'auto. Quindi faccio una sola
// domanda, quella giusta, e ricavo il resto dalla distanza stradale vera.
async function tempiDiViaggio(daId, aId, da, a) {
  const chiave = chiaveTratta(daId, aId);
  const salvato = daCache(chiave);
  if (salvato) return salvato;
  if (!da || !a || da.lat == null || a.lat == null) return null;

  const grezza = stimaGrezza(da, a);

  // Sotto i 250 metri il percorso stradale mente: gira intorno ai sensi unici
  // e ignora piazze e portici. Due posti nello stesso palazzo diventerebbero
  // 600 metri di auto. A piedi, a quella distanza, si va in linea d'aria.
  if (distanza(da, a) < 250) return inCache(chiave, grezza);

  try {
    const auto = await percorso('driving', da, a);
    if (!auto) return grezza;
    const ris = {
      metri: auto.metri,
      piedi_min: Math.max(1, Math.round(auto.metri / 75)),          // 4,5 km/h
      mezzi_min: Math.max(8, Math.round(auto.min * 1.6) + 6),       // piu' lenti, piu' attesa
      taxi_min: auto.min,
      biglietto_zl: null,
      stimato: false,
      mezziStimati: true
    };
    return inCache(chiave, ris);
  } catch (e) {
    return grezza;
  }
}

// Link alla navigazione di Google Maps. E' un semplice indirizzo web:
// non serve nessuna chiave e apre l'app del telefono.
function linkNavigazione(posto) {
  const meta = posto.lat != null
    ? posto.lat + ',' + posto.lng
    : (posto.nome + ' ' + (posto.indirizzo || '') + ' Gdansk');
  return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(meta);
}

export {
  caricaLeaflet, creaMappa, segnaposti,
  tempiDiViaggio, stimaGrezza, distanza, linkNavigazione, chiaveTratta
};
