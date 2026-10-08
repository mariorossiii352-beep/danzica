// Mappa OpenStreetMap disegnata con Leaflet, tempi di viaggio dal servizio
// pubblico OSRM. Niente chiavi, niente account, niente carta di credito.
//
// I tasselli della mappa e i percorsi arrivano dalla rete: senza connessione
// la mappa resta grigia, mentre il resto dell'app continua a funzionare.
// Ogni percorso calcolato finisce in cache: la stessa tratta non si chiede due volte.

import { CONFIG } from './config.js';
import { icona, PER_CATEGORIA } from './icone.js';

// 'cache2' dall'8/10/2026: i tempi a piedi ora vengono dal percorso pedonale vero;
// quelli vecchi (ricavati dall'auto) si buttano.
const CACHE = 'danzica:cache2';
try { localStorage.removeItem('danzica:cache'); } catch (e) { /* niente */ }
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

// Segnaposto rotondi disegnati in CSS con l'icona della categoria: nessuna
// immagine da scaricare; colore e icona dicono la categoria.
async function segnaposti(mappa, lista, alTocco) {
  const L = await caricaLeaflet();
  const fatti = [];
  for (const p of lista) {
    if (p.lat == null || p.lng == null) continue;
    // la casa ha un segnaposto suo, piu' grande, e sta sopra agli altri
    const casa = p.id === 'casa';
    const segno = L.divIcon({
      className: 'pin pin-' + (p.categoria || 'altro'),
      html: '<i>' + icona(PER_CATEGORIA[p.categoria] || 'camera') + '</i>',
      iconSize: casa ? [34, 34] : [28, 28],
      iconAnchor: casa ? [17, 17] : [14, 14]
    });
    const s = L.marker([p.lat, p.lng], {
      icon: segno, title: p.nome, keyboard: true, zIndexOffset: casa ? 1000 : 0
    }).addTo(mappa);
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

// La casa puo' cambiare posto: nella cache le sue tratte portano anche le
// coordinate, cosi' un tempo calcolato per un altro indirizzo non torna fuori.
function idPerCache(id, posto) {
  return id === 'casa' && posto && posto.lat != null
    ? 'casa@' + Number(posto.lat).toFixed(5) + ',' + Number(posto.lng).toFixed(5)
    : id;
}

const OSRM_AUTO = 'https://router.project-osrm.org/route/v1/driving/';
// Server OSRM di FOSSGIS con il profilo a piedi: conosce zone pedonali,
// piazze e passaggi del centro storico, che l'auto deve aggirare.
const OSRM_PIEDI = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot/';

async function percorso(base, da, a) {
  const url = base + da.lng + ',' + da.lat + ';' + a.lng + ',' + a.lat + '?overview=false';
  const r = await fetch(url);
  if (!r.ok) return null;
  const d = await r.json();
  const rotta = (d.routes || [])[0];
  if (!rotta) return null;
  return { min: Math.max(1, Math.round(rotta.duration / 60)), metri: Math.round(rotta.distance) };
}

// Due domande: il percorso a piedi vero (tempo e distanza) e quello in auto
// (per il taxi). Per i mezzi pubblici non c'e' un servizio gratuito con gli
// orari di Danzica: il tempo dei mezzi e' ricavato da quello dell'auto ed e'
// segnato come indicativo.
async function tempiDiViaggio(daId, aId, da, a) {
  const chiave = chiaveTratta(idPerCache(daId, da), idPerCache(aId, a));
  const salvato = daCache(chiave);
  if (salvato) return salvato;
  if (!da || !a || da.lat == null || a.lat == null) return null;

  const grezza = stimaGrezza(da, a);

  // Sotto i 250 metri si va a piedi in linea d'aria: due posti nello stesso
  // palazzo (Olivia Garden e Treinta y Tres) non hanno bisogno di un percorso.
  if (distanza(da, a) < 250) return inCache(chiave, grezza);

  try {
    const [piedi, auto] = await Promise.all([
      percorso(OSRM_PIEDI, da, a).catch(() => null),
      percorso(OSRM_AUTO, da, a).catch(() => null)
    ]);
    if (!piedi && !auto) return grezza;
    const metri = piedi ? piedi.metri : auto.metri;
    const ris = {
      metri: metri,
      piedi_min: piedi ? piedi.min : Math.max(1, Math.round(metri / 75)),   // 4,5 km/h
      mezzi_min: auto ? Math.max(8, Math.round(auto.min * 1.6) + 6) : grezza.mezzi_min,
      taxi_min: auto ? auto.min : grezza.taxi_min,
      biglietto_zl: null,
      stimato: false,
      mezziStimati: true
    };
    // se uno dei due servizi non ha risposto non salvo: si riprova la prossima volta
    return piedi && auto ? inCache(chiave, ris) : ris;
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
