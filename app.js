// Interfaccia dell'app. La logica pura sta in spese.js e piano.js,
// i dati in store.js, Google Maps in mappa.js.

import { CONFIG } from './config.js';
import * as store from './store.js';
import * as P from './piano.js';
import * as M from './mappa.js';
import * as S from './spese.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const NOMI = { D: 'Daniele', A: 'Alessia' };
const GIORNI = ['2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12'];
const ETICHETTE = { '2026-10-09': ['9', 'ven'], '2026-10-10': ['10', 'sab'], '2026-10-11': ['11', 'dom'], '2026-10-12': ['12', 'lun'] };
const LUNGHI = { '2026-10-09': 'venerdi 9 ottobre', '2026-10-10': 'sabato 10 ottobre', '2026-10-11': 'domenica 11 ottobre', '2026-10-12': 'lunedi 12 ottobre' };
const CATEGORIE = ['cibo', 'dolci', 'caffe', 'bar', 'museo', 'vista', 'chiesa', 'attrazione', 'shopping', 'gita'];
const CAT_SPESE = ['cibo', 'trasporti', 'musei', 'attrazioni', 'shopping', 'altro'];

// Posti fissi che non stanno in posti.json
const FISSI = [
  { id: 'aeroporto', nome: 'Aeroporto di Gdansk (GDN)', categoria: 'attrazione', zona: 'Matarnia',
    indirizzo: 'Slowackiego 200', lat: 54.377, lng: 18.4662, orari: null, prezzo: {}, perche: '', fonti: [] }
];

let POSTI = [];          // tutti i posti: elenco + aggiunti + fissi + casa
let INDICE = {};         // id -> posto
let vista = 'mappa';
let giornoScelto = '2026-10-10';
let filtroCat = 'tutti';
let filtroPosti = 'tutti';
let stime = {};          // chiave 'a>b' -> tempi
let tasso = { EUR: CONFIG.tassoFallback, DKK: null, data: null };
let mappaOsm = null, segnalini = [];

// --- avvio -------------------------------------------------------------

async function avvia() {
  const accesso = leggiAccesso();
  if (!accesso) return mostraAvvio();
  $('#avvio').classList.add('nascosto');

  POSTI = await caricaPosti();
  await store.init(accesso);
  if (window.SEME) await store.semina(window.SEME);
  store.ascolta(() => { indicizza(); disegna(); });
  indicizza();

  collegaTabs();
  collegaMappa();
  collegaSpese();
  caricaTassi();
  // un'app installata resta aperta in sottofondo per giorni: riprovo quando
  // torna in primo piano e quando torna la connessione
  document.addEventListener('visibilitychange', () => { if (!document.hidden) caricaTassi(); });
  window.addEventListener('online', () => caricaTassi(true));
  disegna();
  registraServiceWorker();
}

function leggiAccesso() {
  try {
    const a = JSON.parse(localStorage.getItem('danzica:accesso') || 'null');
    return a && a.codice && a.codice.length >= 12 ? a : null;
  } catch (e) { return null; }
}

function mostraAvvio() {
  const box = $('#avvio');
  box.classList.remove('nascosto');
  let chi = null;
  box.querySelectorAll('[data-chi]').forEach((b) => b.addEventListener('click', () => {
    chi = b.dataset.chi;
    box.querySelectorAll('[data-chi]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  $('#entra').addEventListener('click', () => {
    const codice = $('#campo-codice').value.trim();
    if (codice.length < 12) return ($('#avvio-errore').textContent = 'Il codice deve avere almeno 12 caratteri.');
    if (!chi) return ($('#avvio-errore').textContent = 'Dimmi chi sei.');
    localStorage.setItem('danzica:accesso', JSON.stringify({ codice, io: chi }));
    location.reload();
  });
}

async function caricaPosti() {
  const r = await fetch('contenuti/posti.json');
  const elenco = await r.json();
  return elenco.concat(FISSI);
}

function indicizza() {
  const casa = store.stato.casa;
  const tutti = POSTI.concat(store.stato.posti || []);
  if (casa) tutti.push(Object.assign({ id: 'casa', nome: casa.nome || 'Casa', categoria: 'attrazione' }, casa));
  INDICE = {};
  for (const p of tutti) INDICE[p.id] = p;
}

function registraServiceWorker() {
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// --- navigazione -------------------------------------------------------

function collegaTabs() {
  $$('#tabs button').forEach((b) => b.addEventListener('click', () => {
    vista = b.dataset.vista;
    $$('#tabs button').forEach((x) => x.classList.toggle('on', x === b));
    $$('.vista').forEach((v) => v.classList.toggle('nascosto', v.id !== 'v-' + vista));
    disegna();
  }));
}

function disegna() {
  if (vista === 'mappa') disegnaMappa();
  if (vista === 'piano') disegnaPiano();
  if (vista === 'posti') disegnaPosti();
  if (vista === 'spese') disegnaSpese();
  if (vista === 'info') disegnaInfo();
}

function testa(titolo, sotto) {
  $('#titolo').textContent = titolo;
  $('#sottotitolo').textContent = sotto;
}

// --- mappa -------------------------------------------------------------

function postiVisibili() {
  const base = POSTI.concat(store.stato.posti || []).filter((p) => p.id !== 'aeroporto');
  return filtroCat === 'tutti' ? base : base.filter((p) => p.categoria === filtroCat);
}

function collegaMappa() {
  const filtri = $('#filtri');
  const voci = [['tutti', 'Tutti']].concat(CATEGORIE.map((c) => [c, c[0].toUpperCase() + c.slice(1)]));
  filtri.innerHTML = '';
  for (const [id, testo] of voci) {
    const b = document.createElement('button');
    b.className = 'chip' + (id === filtroCat ? ' on' : '');
    b.textContent = testo;
    b.addEventListener('click', () => {
      filtroCat = id;
      filtri.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
      disegnaMappa();
    });
    filtri.appendChild(b);
  }
  const cerca = $('#cerca');
  let attesa = null;
  cerca.addEventListener('input', () => {
    clearTimeout(attesa);
    attesa = setTimeout(() => cercaPosti(cerca.value.trim()), 400);
  });
}

async function cercaPosti(testo) {
  const box = $('#risultati');
  if (!testo) { box.classList.add('nascosto'); return; }
  const t = testo.toLowerCase();
  const miei = POSTI.concat(store.stato.posti || [])
    .filter((p) => (p.nome + ' ' + (p.zona || '') + ' ' + (p.indirizzo || '')).toLowerCase().includes(t))
    .slice(0, 8);
  box.innerHTML = '';
  for (const p of miei) {
    const sotto = [p.categoria, p.zona, p.indirizzo].filter(Boolean).join(' · ');
    box.appendChild(voceRicerca(p.nome, sotto, () => apriScheda(p)));
  }
  box.classList.toggle('nascosto', !box.children.length);
}

function voceRicerca(titolo, sotto, azione) {
  const b = document.createElement('button');
  b.innerHTML = '<span></span><small></small>';
  b.children[0].textContent = titolo;
  b.children[1].textContent = sotto;
  b.addEventListener('click', () => { $('#risultati').classList.add('nascosto'); $('#cerca').value = ''; azione(); });
  return b;
}

async function disegnaMappa() {
  const lista = postiVisibili();
  testa('Danzica', lista.length + ' posti · ' + LUNGHI[giornoScelto]);
  try {
    if (!mappaOsm) mappaOsm = await M.creaMappa($('#mappa'), CONFIG.centro, 14);
    segnalini.forEach((s) => s.remove());
    segnalini = await M.segnaposti(mappaOsm, lista, apriScheda);
    // il contenitore cambia dimensione passando da una scheda all'altra
    mappaOsm.invalidateSize();
  } catch (e) {
    console.error('mappa non disponibile:', e);
    mappaDiRipiego(lista);
  }
}

// Se la mappa non parte l'app resta utile: i posti diventano un elenco.
function mappaDiRipiego(lista) {
  const el = $('#mappa');
  el.innerHTML = '';
  const d = document.createElement('div');
  d.className = 'senza-mappa';
  d.innerHTML = '<p>La mappa non si e\' caricata: forse manca la connessione. Intanto ecco i posti:</p>';
  for (const p of lista) {
    const b = document.createElement('button');
    b.className = 'sp';
    b.innerHTML = '<div class="n"></div><div class="z"></div>';
    b.querySelector('.n').innerHTML = '<span></span><small></small>';
    b.querySelector('.n span').textContent = p.nome;
    b.querySelector('.n small').textContent = [p.categoria, p.zona, p.indirizzo].filter(Boolean).join(' · ');
    b.querySelector('.z').textContent = cuoriTesto(p.id);
    b.addEventListener('click', () => apriScheda(p));
    d.appendChild(b);
  }
  el.appendChild(d);
}

function cuoriTesto(id) {
  const c = store.stato.cuori[id] || {};
  return (c.D ? '♥' : '') + (c.A ? '♥' : '');
}

// --- scheda di un posto ------------------------------------------------

function chiudiFoglio() {
  $('#foglio').classList.add('nascosto');
  $('#velo').classList.add('nascosto');
}

function orariOggi(p, data) {
  const sig = P.siglaGiorno(data);
  const o = p.orari ? p.orari[sig] : undefined;
  if (o === null || o === undefined) return 'orari da verificare';
  if (Array.isArray(o) && !o.length) return 'chiuso ' + (ETICHETTE[data] ? ETICHETTE[data][1] : '');
  return o.map((f) => f[0] + '-' + f[1]).join(', ');
}

// Solo indirizzi web veri: un dato sporco non deve poter diventare un link javascript:.
function linkSicuro(u) {
  return typeof u === 'string' && /^https?:\/\//i.test(u) ? u : '';
}

function dominio(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
}

function profiloIg(u) {
  try { return '@' + new URL(u).pathname.split('/').filter(Boolean)[0]; } catch (e) { return ''; }
}

function durataTesto(min) {
  if (!min) return '';
  const h = Math.floor(min / 60), m = min % 60;
  return h ? h + ' h' + (m ? ' ' + m : '') : m + ' min';
}

function voceFatto(dl, etichetta, valore) {
  if (!valore) return;
  const r = document.createElement('div');
  r.className = 'fatto';
  const dt = document.createElement('dt');
  dt.textContent = etichetta;
  const dd = document.createElement('dd');
  dd.textContent = valore;
  r.appendChild(dt); r.appendChild(dd);
  dl.appendChild(r);
}

function voceLink(box, etichetta, href, dettaglio) {
  if (!href) return;
  const a = document.createElement('a');
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = etichetta;
  if (dettaglio) {
    const s = document.createElement('span');
    s.textContent = dettaglio;
    a.appendChild(s);
  }
  box.appendChild(a);
}

async function apriScheda(p) {
  const f = $('#foglio');
  const c = store.stato.cuori[p.id] || {};
  const ora = new Date();
  const stato = P.statoApertura(p, giornoScelto, ora.getHours() * 60 + ora.getMinutes());
  f.innerHTML = '';
  f.appendChild(costruisci('<div class="grab"></div>'));

  const occhiello = document.createElement('div');
  occhiello.className = 'occhiello';
  occhiello.textContent = [p.categoria, p.zona].filter(Boolean).join(' · ');
  f.appendChild(occhiello);

  const nome = document.createElement('div');
  nome.className = 'nome';
  nome.textContent = p.nome;
  f.appendChild(nome);

  if (p.indirizzo) {
    const ind = document.createElement('div');
    ind.className = 'indirizzo';
    ind.textContent = p.indirizzo;
    f.appendChild(ind);
  }

  const r1 = document.createElement('div');
  r1.className = 'riga';
  r1.appendChild(tag(stato === 'aperto' ? 'Aperto ora' : stato === 'chiuso' ? 'Chiuso ora' : 'Orari da verificare',
    stato === 'aperto' ? 'ok' : stato === 'chiuso' ? 'no' : 'warn'));
  if (stato !== 'ignoto') r1.appendChild(tag(orariOggi(p, giornoScelto)));
  if (p.da_confermare) r1.appendChild(tag('verifica sul posto', 'warn'));
  f.appendChild(r1);

  const testoDesc = p.descrizione || p.perche;
  if (testoDesc) {
    const d = document.createElement('p');
    d.className = 'descrizione';
    d.textContent = testoDesc;
    f.appendChild(d);
  }

  const dl = document.createElement('dl');
  dl.className = 'fatti';
  const z = p.prezzo || {};
  voceFatto(dl, 'Ingresso', z.normale_zl != null ? z.normale_zl + ' zł' : '');
  voceFatto(dl, 'Ridotto', z.ridotto_zl != null ? z.ridotto_zl + ' zł' : '');
  voceFatto(dl, 'Prezzi', z.nota);
  voceFatto(dl, 'Sconto studenti', p.sconto_studenti);
  voceFatto(dl, 'Pesce', { si: 'pescatariano', opzioni: 'ci sono opzioni pescatariane', no: 'niente pesce' }[p.pescatariano] || '');
  voceFatto(dl, 'Orari', p.orari_nota);
  voceFatto(dl, 'Quanto ci vuole', durataTesto(p.durata_min));
  if (dl.children.length) f.appendChild(dl);

  const links = document.createElement('div');
  links.className = 'links';
  const sito = linkSicuro(p.sito);
  const ig = linkSicuro(p.instagram);
  voceLink(links, 'Sito ufficiale', sito, dominio(sito));
  voceLink(links, 'Instagram', ig, profiloIg(ig));
  voceLink(links, 'Apri in Google Maps', M.linkNavigazione(p), 'indicazioni');
  f.appendChild(links);

  const cuori = document.createElement('div');
  cuori.className = 'cuori';
  for (const chi of ['D', 'A']) {
    const b = document.createElement('button');
    b.className = 'cuore' + (c[chi] ? ' on' : '');
    b.textContent = '♥ ' + NOMI[chi];
    b.addEventListener('click', async () => {
      await store.cambiaCuore(p.id, chi, !(store.stato.cuori[p.id] || {})[chi]);
      b.classList.toggle('on');
    });
    cuori.appendChild(b);
  }
  f.appendChild(cuori);

  const agg = document.createElement('button');
  agg.className = 'btn aggiungi';
  agg.textContent = 'Aggiungi a un giorno';
  agg.addEventListener('click', () => scegliGiorno(p));
  f.appendChild(agg);

  const fonte = document.createElement('div');
  fonte.className = 'fonte';
  fonte.textContent = 'Fonte: ' + ((p.fonti && p.fonti[0]) || 'da confermare') +
    (p.verificato ? ' · verificato il ' + dataIt(p.verificato) : '');
  f.appendChild(fonte);

  f.classList.remove('nascosto');
  $('#velo').classList.remove('nascosto');
  $('#velo').onclick = chiudiFoglio;
}

function tag(testo, cls) {
  const s = document.createElement('span');
  s.className = 'tag' + (cls ? ' ' + cls : '');
  s.textContent = testo;
  return s;
}

function costruisci(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.firstElementChild;
}

function dataIt(iso) {
  const p = String(iso).split('-');
  return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
}

function scegliGiorno(p) {
  apriModale('In che giorno?', (corpo, chiudi) => {
    for (const g of GIORNI) {
      const b = document.createElement('button');
      b.className = 'btn grigio';
      b.style.marginBottom = '8px';
      b.textContent = LUNGHI[g];
      b.addEventListener('click', async () => {
        await aggiungiTappa(g, p);
        chiudi();
        chiudiFoglio();
        giornoScelto = g;
        vaiA('piano');
      });
      corpo.appendChild(b);
    }
  });
}

// Elenco completo dei posti, con ricerca e categorie. Il cuore non c'entra:
// qui ci sono tutti e 64, non solo quelli segnati.
function scegliTappa(data) {
  apriModale('Aggiungi una tappa a ' + LUNGHI[data], (corpo, chiudi) => {
    const tutti = POSTI.concat(store.stato.posti || []);
    let cat = 'tutti';

    const cerca = document.createElement('input');
    cerca.type = 'search';
    cerca.className = 'pesca-cerca';
    cerca.placeholder = 'Cerca fra tutti i posti';
    cerca.autocomplete = 'off';
    cerca.autocapitalize = 'none';
    cerca.enterKeyHint = 'search';
    corpo.appendChild(cerca);

    const chips = document.createElement('div');
    chips.className = 'chips pesca-chips';
    corpo.appendChild(chips);

    const lista = document.createElement('div');
    lista.className = 'pesca-lista';
    corpo.appendChild(lista);

    const voci = [['tutti', 'Tutti']].concat(CATEGORIE.map((c) => [c, c[0].toUpperCase() + c.slice(1)]));
    for (const [id, testo] of voci) {
      const b = document.createElement('button');
      b.className = 'chip' + (id === cat ? ' on' : '');
      b.textContent = testo;
      b.addEventListener('click', () => {
        cat = id;
        chips.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
        disegnaScelta();
      });
      chips.appendChild(b);
    }

    function disegnaScelta() {
      const testo = cerca.value.trim().toLowerCase();
      const visti = tutti.filter((p) => {
        if (cat !== 'tutti' && p.categoria !== cat) return false;
        if (!testo) return true;
        return (p.nome + ' ' + (p.zona || '') + ' ' + (p.indirizzo || '')).toLowerCase().includes(testo);
      });
      lista.innerHTML = '';
      if (!visti.length) {
        const v = document.createElement('p');
        v.className = 'perche';
        v.textContent = 'Nessun posto con questo nome.';
        lista.appendChild(v);
        return;
      }
      for (const p of visti) {
        const b = document.createElement('button');
        b.innerHTML = '<span></span><small></small>';
        b.children[0].textContent = p.nome;
        b.children[1].textContent = [p.categoria, p.zona, p.indirizzo].filter(Boolean).join(' · ');
        b.addEventListener('click', async () => {
          await aggiungiTappa(data, p);
          chiudi();
          giornoScelto = data;
          vaiA('piano');
        });
        lista.appendChild(b);
      }
    }

    cerca.addEventListener('input', disegnaScelta);
    disegnaScelta();
  });
}

function vaiA(nome) {
  const b = $('#tabs button[data-vista="' + nome + '"]');
  if (b) b.click();
}

// --- piano -------------------------------------------------------------

function giornoDati(data) {
  const g = store.stato.giorni[data];
  return g && g.tappe ? g : { data: data, partenza: '10:00', limite: null, tappe: [] };
}

async function aggiungiTappa(data, posto) {
  const g = JSON.parse(JSON.stringify(giornoDati(data)));
  const tappa = {
    id: store.nuovoId('t'), postoId: posto.id, nome: posto.nome,
    durata_min: posto.durata_min || 60, bloccata: false, ora: null, nota: '', mezzo: null
  };
  // prima di una eventuale tappa finale bloccata (la partenza per l'aeroporto)
  const ultima = g.tappe[g.tappe.length - 1];
  if (ultima && ultima.bloccata && ultima.fine_giornata) g.tappe.splice(g.tappe.length - 1, 0, tappa);
  else g.tappe.push(tappa);
  await store.salvaGiorno(data, g);
}

function disegnaPiano() {
  const cont = $('#timeline');
  const g = giornoDati(giornoScelto);
  const calcolo = P.calcola(g, INDICE, stime);
  testa('Il piano', LUNGHI[giornoScelto] + ' · ' + g.tappe.length + ' tappe');

  const giorni = $('#giorni');
  giorni.innerHTML = '';
  for (const data of GIORNI) {
    const b = document.createElement('button');
    b.className = 'g' + (data === giornoScelto ? ' on' : '');
    b.innerHTML = '<b></b><span></span>';
    b.children[0].textContent = ETICHETTE[data][0];
    b.children[1].textContent = ETICHETTE[data][1];
    b.addEventListener('click', () => { giornoScelto = data; disegnaPiano(); });
    giorni.appendChild(b);
  }

  cont.innerHTML = '';
  if (giornoScelto === '2026-10-10') {
    const t = document.createElement('div');
    t.className = 'torta';
    t.textContent = '\u{1F382} Oggi Alessia compie 24 anni';
    cont.appendChild(t);
  }
  if (giornoScelto === '2026-10-12') cont.appendChild(riquadroLunedi());
  if (!store.stato.casa) {
    const b = document.createElement('button');
    b.className = 'avviso';
    b.textContent = 'Casa non ancora impostata: toccami per aggiungere l\'appartamento.';
    b.addEventListener('click', modaleCasa);
    cont.appendChild(b);
  }

  const lista = document.createElement('div');
  lista.id = 'lista-tappe';
  cont.appendChild(lista);

  calcolo.righe.forEach((r, i) => {
    const blocco = document.createElement('div');
    blocco.className = 'blocco';
    blocco.dataset.id = r.tappa.id;
    blocco.dataset.bloccata = r.tappa.bloccata ? '1' : '0';

    if (r.tratta) {
      const v = document.createElement('div');
      v.className = 'viaggio';
      v.appendChild(document.createTextNode(testoTratta(r.tratta)));
      const cambia = document.createElement('button');
      cambia.textContent = 'cambia';
      cambia.addEventListener('click', () => modaleMezzo(r.tappa));
      v.appendChild(cambia);
      blocco.appendChild(v);
    }
    for (const a of calcolo.avvisi.filter((x) => x.tappa === r.tappa.id)) {
      const d = document.createElement('div');
      d.className = 'avviso';
      d.textContent = '⚠ ' + a.testo;
      blocco.appendChild(d);
    }

    const t = document.createElement('div');
    t.className = 'tappa';
    t.innerHTML = '<div class="ora"></div><div class="box"><button class="drag"></button>' +
      '<div class="t"></div><div class="d"></div></div>';
    t.querySelector('.ora').textContent = r.oraArrivo;
    const box = t.querySelector('.box');
    if (r.tappa.bloccata) box.classList.add('lock');
    box.querySelector('.drag').textContent = r.tappa.bloccata ? '\u{1F512}' : '⠇';
    box.querySelector('.t').textContent = r.tappa.nome;
    box.querySelector('.d').textContent = descrizioneTappa(r);
    box.addEventListener('click', (e) => { if (!e.target.closest('.drag')) modaleTappa(r.tappa); });
    blocco.appendChild(t);
    lista.appendChild(blocco);
  });

  for (const a of calcolo.avvisi.filter((x) => !x.tappa)) {
    const d = document.createElement('div');
    d.className = 'avviso';
    d.textContent = '⚠ ' + a.testo;
    cont.appendChild(d);
  }

  const agg = document.createElement('button');
  agg.className = 'btn sec';
  agg.style.marginTop = '12px';
  agg.textContent = '+ Aggiungi una tappa';
  agg.addEventListener('click', () => scegliTappa(giornoScelto));
  cont.appendChild(agg);

  attaccaDrag(lista, g);
  calcolaStime(g);
}

function descrizioneTappa(r) {
  const t = r.tappa;
  const p = t.postoId ? INDICE[t.postoId] : null;
  const parti = [];
  if (t.nota) parti.push(t.nota);
  if (t.durata_min) parti.push(t.durata_min + ' min');
  if (p) parti.push(orariOggi(p, giornoScelto));
  if (p && p.da_confermare) parti.push('verifica sul posto');
  return parti.join(' · ');
}

function testoTratta(tr) {
  if (!tr.mezzo) return 'tempo di viaggio da calcolare';
  const nome = { piedi: '\u{1F6B6} a piedi', mezzi: '\u{1F68C} mezzi', taxi: '\u{1F695} taxi o Bolt' }[tr.mezzo];
  const parti = [nome];
  if (tr.minuti != null) parti.push(tr.minuti + ' min');
  if (tr.metri != null) parti.push(tr.metri >= 1000 ? (tr.metri / 1000).toFixed(1) + ' km' : tr.metri + ' m');
  if (tr.stimato) parti.push('stima');
  if (tr.manuale) parti.push('scelto a mano');
  return parti.join(' · ') + ' ';
}

// Chiede i tempi mancanti (cache o Routes) e ridisegna una volta sola.
async function calcolaStime(g) {
  const mancanti = [];
  for (let i = 1; i < g.tappe.length; i++) {
    const a = g.tappe[i - 1].postoId, b = g.tappe[i].postoId;
    const k = P.chiaveTratta(a, b);
    if (!(k in stime)) mancanti.push([a, b, k]);
  }
  if (!mancanti.length) return;
  let cambiato = false;
  for (const [a, b, k] of mancanti) {
    const t = await M.tempiDiViaggio(a, b, INDICE[a], INDICE[b]);
    stime[k] = t;
    if (t) cambiato = true;
  }
  if (cambiato && vista === 'piano') disegnaPiano();
}

function riquadroLunedi() {
  const d = document.createElement('div');
  d.className = 'chiusure';
  d.innerHTML = '<b>Lunedi: cosa e\' chiuso</b>' +
    '<div>Chiusi: Museo della Seconda guerra mondiale, Museo Nazionale, Zuraw (Museo Marittimo).</div>' +
    '<div style="margin-top:6px"><b>Gratis o aperto</b></div>' +
    '<div>Gratis: Museo dell\'ambra (12-18), Ratusz Glownego Miasta (10-18), Dwor Artusa (12-18), ' +
    'Dom Uphagena (12-18), Twierdza Wisloujscie (10-16). Aperti: ECS (10-17), Torre di Santa Caterina (12-14), ' +
    'Westerplatte (10-16), Malbork solo percorso esterno (9-16, gratis).</div>';
  return d;
}

// Trascinamento con eventi pointer: funziona con il dito e con il mouse.
function attaccaDrag(lista, giorno) {
  let preso = null, y0 = 0, dy = 0;

  lista.addEventListener('pointerdown', (e) => {
    const maniglia = e.target.closest('.drag');
    if (!maniglia) return;
    const blocco = maniglia.closest('.blocco');
    if (!blocco || blocco.dataset.bloccata === '1') return;
    e.preventDefault();
    preso = blocco; y0 = e.clientY; dy = 0;
    preso.classList.add('presa');
    maniglia.setPointerCapture(e.pointerId);
  });

  lista.addEventListener('pointermove', (e) => {
    if (!preso) return;
    e.preventDefault();
    dy = e.clientY - y0;
    preso.style.transform = 'translateY(' + dy + 'px)';
    const r = preso.getBoundingClientRect();
    const prec = preso.previousElementSibling;
    const succ = preso.nextElementSibling;
    if (prec && prec.dataset.bloccata === '0') {
      const rp = prec.getBoundingClientRect();
      if (r.top < rp.top + rp.height / 2) {
        lista.insertBefore(preso, prec);
        y0 -= rp.height; dy = e.clientY - y0;
        preso.style.transform = 'translateY(' + dy + 'px)';
        return;
      }
    }
    if (succ && succ.dataset.bloccata === '0') {
      const rs = succ.getBoundingClientRect();
      if (r.bottom > rs.top + rs.height / 2) {
        lista.insertBefore(succ, preso);
        y0 += rs.height; dy = e.clientY - y0;
        preso.style.transform = 'translateY(' + dy + 'px)';
      }
    }
  });

  const finito = async () => {
    if (!preso) return;
    preso.classList.remove('presa');
    preso.style.transform = '';
    preso = null;
    const ordine = Array.from(lista.children).map((b) => b.dataset.id);
    const g = JSON.parse(JSON.stringify(giorno));
    g.tappe.sort((a, b) => ordine.indexOf(a.id) - ordine.indexOf(b.id));
    stime = {}; // le tratte cambiano
    await store.salvaGiorno(giornoScelto, g);
    disegnaPiano();
  };
  lista.addEventListener('pointerup', finito);
  lista.addEventListener('pointercancel', finito);
}

function modaleTappa(tappa) {
  apriModale(tappa.nome, (corpo, chiudi) => {
    corpo.appendChild(campo('Durata (minuti)', 'numero', 'durata', tappa.durata_min || 0));
    corpo.appendChild(campo('Nota', 'testo', 'nota', tappa.nota || ''));
    if (tappa.bloccata) {
      const p = document.createElement('p');
      p.className = 'sub';
      p.style.color = 'var(--muted)';
      p.textContent = 'Tappa fissata alle ' + tappa.ora + ': non si sposta.';
      corpo.appendChild(p);
    }
    const salva = document.createElement('button');
    salva.className = 'btn';
    salva.textContent = 'Salva';
    salva.addEventListener('click', async () => {
      const g = JSON.parse(JSON.stringify(giornoDati(giornoScelto)));
      const t = g.tappe.find((x) => x.id === tappa.id);
      if (t) {
        t.durata_min = Number(corpo.querySelector('[name=durata]').value) || 0;
        t.nota = corpo.querySelector('[name=nota]').value.trim();
      }
      await store.salvaGiorno(giornoScelto, g);
      chiudi(); disegnaPiano();
    });
    corpo.appendChild(salva);

    const via = document.createElement('button');
    via.className = 'btn grigio';
    via.style.marginTop = '8px';
    via.textContent = 'Togli dal piano';
    via.addEventListener('click', async () => {
      if (!confirm('Tolgo "' + tappa.nome + '" dal ' + LUNGHI[giornoScelto] + '?')) return;
      const g = JSON.parse(JSON.stringify(giornoDati(giornoScelto)));
      g.tappe = g.tappe.filter((x) => x.id !== tappa.id);
      stime = {};
      await store.salvaGiorno(giornoScelto, g);
      chiudi(); disegnaPiano();
    });
    corpo.appendChild(via);
  });
}

function modaleMezzo(tappa) {
  apriModale('Come ci arrivate?', (corpo, chiudi) => {
    for (const [id, testo] of [['', 'Sceglilo l\'app'], ['piedi', 'A piedi'], ['mezzi', 'Mezzi pubblici'], ['taxi', 'Taxi o Bolt']]) {
      const b = document.createElement('button');
      b.className = 'btn grigio';
      b.style.marginBottom = '8px';
      b.textContent = testo;
      b.addEventListener('click', async () => {
        const g = JSON.parse(JSON.stringify(giornoDati(giornoScelto)));
        const t = g.tappe.find((x) => x.id === tappa.id);
        if (t) t.mezzo = id || null;
        await store.salvaGiorno(giornoScelto, g);
        chiudi(); disegnaPiano();
      });
      corpo.appendChild(b);
    }
  });
}

function modaleCasa() {
  apriModale('Dove dormite', (corpo, chiudi) => {
    const casa = store.stato.casa || {};
    corpo.appendChild(campo('Nome', 'testo', 'nome', casa.nome || 'Casa'));
    corpo.appendChild(campo('Indirizzo', 'testo', 'indirizzo', casa.indirizzo || ''));
    corpo.appendChild(campo('Coordinate (lat, lng) se le sai', 'testo', 'coord',
      casa.lat != null ? casa.lat + ', ' + casa.lng : ''));
    const salva = document.createElement('button');
    salva.className = 'btn';
    salva.textContent = 'Salva';
    salva.addEventListener('click', async () => {
      const c = corpo.querySelector('[name=coord]').value.split(',').map((x) => parseFloat(x.trim()));
      await store.impostaCasa({
        nome: corpo.querySelector('[name=nome]').value.trim() || 'Casa',
        indirizzo: corpo.querySelector('[name=indirizzo]').value.trim(),
        lat: isFinite(c[0]) ? c[0] : null, lng: isFinite(c[1]) ? c[1] : null
      });
      indicizza(); stime = {};
      chiudi(); disegnaPiano();
    });
    corpo.appendChild(salva);
  });
}

// --- posti -------------------------------------------------------------

function disegnaPosti() {
  const cont = $('#lista-posti');
  const cuori = store.stato.cuori || {};
  const tutti = POSTI.concat(store.stato.posti || []);
  const scelti = tutti.filter((p) => {
    const c = cuori[p.id];
    if (!c) return false;
    return filtroPosti === 'due' ? (c.D && c.A) : (c.D || c.A);
  });
  testa('Posti che vi piacciono', scelti.length + ' su ' + tutti.length);

  $$('#filtri-posti .chip').forEach((b) => {
    b.classList.toggle('on', b.dataset.filtro === filtroPosti);
    b.onclick = () => { filtroPosti = b.dataset.filtro; disegnaPosti(); };
  });

  cont.innerHTML = '';
  if (!scelti.length) {
    const p = document.createElement('p');
    p.className = 'perche';
    p.textContent = 'Nessun posto con un cuore. Aprine uno dalla mappa e tocca il cuore.';
    cont.appendChild(p);
    return;
  }
  for (const cat of CATEGORIE) {
    const gruppo = scelti.filter((p) => p.categoria === cat);
    if (!gruppo.length) continue;
    const s = document.createElement('div');
    s.className = 'sez';
    s.textContent = cat;
    cont.appendChild(s);
    for (const p of gruppo) {
      const b = document.createElement('button');
      b.className = 'sp';
      b.innerHTML = '<div class="n"><span></span><small></small></div><div class="z"></div>';
      b.querySelector('span').textContent = p.nome;
      b.querySelector('small').textContent = [p.zona, orariOggi(p, giornoScelto)].filter(Boolean).join(' · ');
      b.querySelector('.z').textContent = cuoriTesto(p.id);
      b.addEventListener('click', () => apriScheda(p));
      cont.appendChild(b);
    }
  }
}

// --- spese -------------------------------------------------------------

function collegaSpese() {
  $('#nuova-spesa').addEventListener('click', () => modaleSpesa(null));
}

function euro(grosz) {
  const e = S.inEuro(grosz, tasso.EUR);
  return e == null ? '' : '≈ ' + e.toFixed(2).replace('.', ',') + ' €';
}

function disegnaSpese() {
  const cont = $('#lista-spese');
  const spese = store.stato.spese || [];
  testa('Spese', 'tutto in zloty · divisione 50/50');
  cont.innerHTML = '';

  const s = document.createElement('div');
  s.className = 'saldo';
  const frase = S.frasesaldo(spese, NOMI);
  s.innerHTML = '<div class="p">Saldo</div><div class="v"></div><div class="e"></div>';
  s.querySelector('.v').textContent = frase;
  s.querySelector('.e').textContent = (S.saldo(spese) ? euro(Math.abs(S.saldo(spese))) + ' · ' : '') +
    (tasso.data ? 'tasso BCE del ' + dataIt(tasso.data) : 'tasso non aggiornato');
  if (S.saldo(spese) !== 0) {
    const b = document.createElement('button');
    b.className = 'b';
    b.textContent = 'Segna come saldato';
    b.addEventListener('click', async () => {
      const r = S.rimborsoDiPareggio(spese, store.nuovoId('rimb'));
      if (!r) return;
      if (!confirm(NOMI[r.chi] + ' ha dato ' + S.formatta(r.grosz) + ' zl all\'altro. Registro il rimborso?')) return;
      await store.aggiungiSpesa(r);
      disegnaSpese();
    });
    s.appendChild(b);
  }
  cont.appendChild(s);

  const perGiorno = S.totaliPerGiorno(spese);
  const giorni = GIORNI.slice().reverse();
  const rimborsi = spese.filter((x) => x.tipo === 'rimborso');
  for (const g of giorni) {
    const delGiorno = spese.filter((x) => x.tipo !== 'rimborso' && x.giorno === g);
    if (!delGiorno.length) continue;
    const t = document.createElement('div');
    t.className = 'sez';
    t.textContent = LUNGHI[g] + ' · ' + S.formatta(perGiorno[g] || 0) + ' zl · ' + euro(perGiorno[g] || 0);
    cont.appendChild(t);
    for (const sp of delGiorno) cont.appendChild(rigaSpesa(sp));
  }
  if (rimborsi.length) {
    const t = document.createElement('div');
    t.className = 'sez';
    t.textContent = 'Rimborsi';
    cont.appendChild(t);
    for (const sp of rimborsi) cont.appendChild(rigaSpesa(sp));
  }

  const perCat = S.totaliPerCategoria(spese);
  const chiavi = Object.keys(perCat).filter((k) => perCat[k]);
  if (chiavi.length) {
    const t = document.createElement('div');
    t.className = 'sez';
    t.textContent = 'Per categoria · totale ' + S.formatta(S.totale(spese)) + ' zl';
    cont.appendChild(t);
    for (const k of chiavi.sort((a, b) => perCat[b] - perCat[a])) {
      const d = document.createElement('div');
      d.className = 'sp';
      d.innerHTML = '<div class="n"></div><div class="z"><span></span><small></small></div>';
      d.querySelector('.n').textContent = k || 'senza categoria';
      d.querySelector('span').textContent = S.formatta(perCat[k]) + ' zl';
      d.querySelector('small').textContent = euro(perCat[k]);
      cont.appendChild(d);
    }
  }
}

function rigaSpesa(sp) {
  const b = document.createElement('button');
  b.className = 'sp';
  b.innerHTML = '<div class="av"></div><div class="n"><span></span><small></small></div>' +
    '<div class="z"><span></span><small></small></div>';
  const av = b.querySelector('.av');
  av.textContent = sp.chi;
  if (sp.chi === 'A') av.classList.add('a');
  b.querySelector('.n span').textContent = sp.descrizione || (sp.tipo === 'rimborso' ? 'Saldato' : 'spesa');
  b.querySelector('.n small').textContent = sp.tipo === 'rimborso'
    ? 'rimborso di ' + NOMI[sp.chi]
    : (sp.categoria || 'altro') + ' · ' + (sp.divisione === 'meta' ? '50/50' : 'solo ' + NOMI[sp.divisione]);
  b.querySelector('.z span').textContent = S.formatta(sp.grosz);
  b.querySelector('.z small').textContent = euro(sp.grosz);
  b.addEventListener('click', () => modaleSpesa(sp));
  return b;
}

function modaleSpesa(esistente) {
  apriModale(esistente ? 'Modifica spesa' : 'Nuova spesa', (corpo, chiudi) => {
    const sp = esistente || { chi: store.chi(), grosz: 0, descrizione: '', categoria: 'cibo', giorno: giornoScelto, divisione: 'meta', tipo: 'spesa' };
    corpo.appendChild(campo('Importo in zloty', 'testo', 'importo', sp.grosz ? S.formatta(sp.grosz) : ''));
    corpo.appendChild(campo('Descrizione', 'testo', 'descrizione', sp.descrizione || ''));
    corpo.appendChild(scelta('Ha pagato', 'chi', [['D', NOMI.D], ['A', NOMI.A]], sp.chi));
    corpo.appendChild(scelta('Divisione', 'divisione',
      [['meta', '50/50'], ['D', 'solo ' + NOMI.D], ['A', 'solo ' + NOMI.A]], sp.divisione || 'meta'));
    corpo.appendChild(elenco('Categoria', 'categoria', CAT_SPESE.map((c) => [c, c]), sp.categoria || 'cibo'));
    corpo.appendChild(elenco('Giorno', 'giorno', GIORNI.map((g) => [g, LUNGHI[g]]), sp.giorno || giornoScelto));
    const errore = document.createElement('p');
    errore.className = 'errore';
    corpo.appendChild(errore);

    const salva = document.createElement('button');
    salva.className = 'btn';
    salva.textContent = 'Salva';
    salva.addEventListener('click', async () => {
      const grosz = S.parseImporto(corpo.querySelector('[name=importo]').value);
      if (grosz == null || grosz <= 0) { errore.textContent = 'Importo non valido. Scrivi per esempio 12,50'; return; }
      const dati = {
        tipo: 'spesa', grosz: grosz,
        descrizione: corpo.querySelector('[name=descrizione]').value.trim(),
        chi: corpo.querySelector('[name=chi] .on').dataset.valore,
        divisione: corpo.querySelector('[name=divisione] .on').dataset.valore,
        categoria: corpo.querySelector('[name=categoria]').value,
        giorno: corpo.querySelector('[name=giorno]').value
      };
      if (esistente) await store.modificaSpesa(esistente.id, dati);
      else await store.aggiungiSpesa(dati);
      chiudi(); disegnaSpese();
    });
    corpo.appendChild(salva);

    if (esistente) {
      const via = document.createElement('button');
      via.className = 'btn grigio';
      via.style.marginTop = '8px';
      via.textContent = 'Elimina';
      via.addEventListener('click', async () => {
        if (!confirm('Elimino "' + (esistente.descrizione || 'questa spesa') + '"?')) return;
        await store.eliminaSpesa(esistente.id);
        chiudi(); disegnaSpese();
      });
      corpo.appendChild(via);
    }
  });
}

// --- info --------------------------------------------------------------

// La BCE pubblica un cambio al giorno: chiederlo piu' spesso non serve.
const OGNI_QUANTO_MS = 30 * 60 * 1000;
let scaricoInCorso = false;

async function caricaTassi(forza) {
  if (!tasso.data) {
    try {
      const salvato = JSON.parse(localStorage.getItem('danzica:tassi') || 'null');
      if (salvato) tasso = salvato;
    } catch (e) { /* niente */ }
  }
  if (scaricoInCorso) return;
  if (!forza && tasso.controllato && Date.now() - tasso.controllato < OGNI_QUANTO_MS) return;
  scaricoInCorso = true;
  try {
    const r = await fetch('https://api.frankfurter.dev/v1/latest?base=PLN&symbols=EUR,DKK', { cache: 'no-store' });
    const d = await r.json();
    tasso = { EUR: d.rates.EUR, DKK: d.rates.DKK, data: d.date, controllato: Date.now() };
    localStorage.setItem('danzica:tassi', JSON.stringify(tasso));
    // aggiorno i numeri senza ridisegnare: la cifra che si sta scrivendo resta
    const box = document.querySelector('#info .conv-box');
    if (box && box.ricalcola) box.ricalcola();
    if (vista === 'spese') disegna();
  } catch (e) {
    /* offline: restano i tassi salvati */
  } finally {
    scaricoInCorso = false;
    const box = document.querySelector('#info .conv-box');
    if (box && box.etichetta) box.etichetta();
  }
}

function statoTassi() {
  if (!tasso.data) return 'tassi non ancora scaricati: uso una stima';
  const base = 'tassi BCE del ' + dataIt(tasso.data);
  if (!tasso.controllato) return base + ', salvati per l\'uso offline';
  const quando = new Date(tasso.controllato);
  const ora = String(quando.getHours()).padStart(2, '0') + ':' + String(quando.getMinutes()).padStart(2, '0');
  const oggi = new Date().toDateString() === quando.toDateString();
  const vecchio = Date.now() - tasso.controllato > 6 * 3600 * 1000;
  return base + ' · controllati ' + (oggi ? 'alle ' + ora : 'il ' + quando.getDate() + '/' + (quando.getMonth() + 1)) +
    (vecchio && !navigator.onLine ? ' (sei offline)' : '');
}

function disegnaInfo() {
  testa('Info', 'tassi, sconti e cose pratiche');
  const cont = $('#info');
  cont.innerHTML = '';

  const conv = document.createElement('div');
  conv.className = 'info-blocco conv-box';
  conv.innerHTML = '<h2>Convertitore</h2><div class="conv">' +
    '<label>PLN<input id="conv-pln" type="text" inputmode="decimal" data-val="PLN" value="100"></label>' +
    '<label>EUR<input id="conv-eur" type="text" inputmode="decimal" data-val="EUR"></label>' +
    '<label>DKK<input id="conv-dkk" type="text" inputmode="decimal" data-val="DKK"></label></div>' +
    '<small class="conv-stato"></small>';
  cont.appendChild(conv);
  collegaConvertitore(conv);
  caricaTassi();

  cont.appendChild(blocco('Info pratiche', [
    'Emergenze: 112.',
    'Mancia 10% al ristorante se il servizio e\' buono: dillo al cameriere prima che batta la carta, il POS spesso non la chiede.',
    'Carta accettata quasi ovunque, anche su bus e taxi. Poco contante per le bancarelle.',
    'Al POS scegli sempre zloty, mai euro: il cambio del terminale e\' peggiore.',
    'Zabka: minimarket aperti anche nelle domeniche senza commercio.',
    'Biglietti ZTM: corsa singola 4,80 zl, 75 minuti con cambi 6 zl, 24 ore 22 zl. In app (Jakdojade, moBILET, SkyCash) valgono anche su SKM.',
    'Aeroporto-centro: bus 210 fino a Gdansk Glowny, 40-50 min (a bordo non si comprano biglietti), oppure treno PKM con cambio SKM a Wrzeszcz, circa 45 min. Bolt o Uber circa 40 zl.',
    'Sopot: treno SKM da Gdansk Glowny, 15-25 min, circa 5,20 zl, ogni 7-15 minuti.',
    'Malbork: treno da Gdansk Glowny, 24-50 min. Castello da ottobre mar-dom 9-15, ultimo ingresso 12:45.'
  ], 'Fonti: gdansk.pl, odkryjgdansk.pl, gdanskbyjakub.pl · verificate il 13-14/09/2026'));

  cont.appendChild(blocco('Offerte verificate', [
    'Musei gratis il lunedi (Muzeum Gdanska): Museo dell\'ambra 12-18, Ratusz Glownego Miasta 10-18, Dwor Artusa 12-18, Dom Uphagena 12-18, Twierdza Wisloujscie 10-16. Vale per tutti e due. Fonte: muzeumgdansk.pl, 13/09/2026.',
    'Olivia Star terrazza: da ottobre 16 zl online, ridotto 13 zl per studenti fino a 26 anni, quindi solo Alessia. In loco 2 zl in piu\'. Comprando 3 giorni prima: -30%. Fonte: oliviastar.pl, 14/09/2026.',
    'Malbork il lunedi: ingresso gratis ma solo percorso esterno, 9-16. Fonte: zamek.malbork.pl, 14/09/2026.',
    'Sconto 10% con la tessera universitaria da: Pomelo Bistro, Under Beer, Faloviec, Akademic Bar, Zabusia. Fonte: raccolta locali, 14/09/2026.',
    'Masna Micha: 15% dal lunedi al venerdi dalle 16 alle 19. Fonte: raccolta locali, 14/09/2026.',
    'Riduzioni studenti dei musei: Museo 2a guerra 23 zl invece di 33 e ECS 35 invece di 40 valgono fino a 26 anni, quindi solo Alessia. Al Muzeum Gdanska il ridotto e\' per "studenci" senza limite d\'eta\' scritto: da chiedere in cassa.',
    'Too Good To Go funziona anche a Danzica: cibo invenduto a poco.',
    'Karta Turysty Odkrywca: 24h 75/60 zl, 48h 85/70, 72h 95/80. Non include i trasporti e non include il Museo della Seconda guerra mondiale; il lunedi le sedi del Muzeum Gdanska sono gia\' gratis. Nel vostro caso quasi sicuramente non conviene.',
    'Attenzione: molti sconti commerciali chiedono la ISIC, che voi non avete. La tessera universitaria normale basta solo dove scritto sopra.'
  ], 'Tutte le offerte vengono da fonti_grezze.md, verificate il 13-14/09/2026'));
}

function blocco(titolo, voci, nota) {
  const d = document.createElement('div');
  d.className = 'info-blocco';
  const h = document.createElement('h2');
  h.textContent = titolo;
  d.appendChild(h);
  const ul = document.createElement('ul');
  for (const v of voci) {
    const li = document.createElement('li');
    li.textContent = v;
    ul.appendChild(li);
  }
  d.appendChild(ul);
  if (nota) {
    const s = document.createElement('small');
    s.textContent = nota;
    d.appendChild(s);
  }
  return d;
}

function collegaConvertitore(box) {
  const campi = Array.from(box.querySelectorAll('[data-val]'));
  const tassi = () => ({ PLN: 1, EUR: tasso.EUR || CONFIG.tassoFallback, DKK: tasso.DKK || null });
  function aggiorna(da) {
    const t = tassi();
    const v = parseFloat(String(da.value).replace(',', '.'));
    if (!isFinite(v)) return;
    const inPln = v / (t[da.dataset.val] || 1);
    for (const c of campi) {
      if (c === da) continue;
      const k = t[c.dataset.val];
      c.value = k ? (inPln * k).toFixed(2).replace('.', ',') : '';
    }
  }
  let ultimo = campi[0];
  campi.forEach((c) => c.addEventListener('input', () => { ultimo = c; aggiorna(c); }));
  box.ricalcola = () => aggiorna(ultimo);
  box.etichetta = () => { box.querySelector('.conv-stato').textContent = statoTassi(); };
  aggiorna(campi[0]);
  box.etichetta();
}

// --- pezzi di modulo ---------------------------------------------------

function campo(etichetta, tipo, nome, valore) {
  const d = document.createElement('div');
  d.className = 'campo';
  const l = document.createElement('label');
  l.textContent = etichetta;
  const i = document.createElement('input');
  i.name = nome;
  i.value = valore == null ? '' : valore;
  if (tipo === 'numero') { i.type = 'number'; i.inputMode = 'numeric'; }
  else i.type = 'text';
  d.appendChild(l); d.appendChild(i);
  return d;
}

function scelta(etichetta, nome, opzioni, valore) {
  const d = document.createElement('div');
  d.className = 'campo';
  const l = document.createElement('label');
  l.textContent = etichetta;
  const g = document.createElement('div');
  g.className = 'scelte';
  g.setAttribute('name', nome);
  for (const [v, t] of opzioni) {
    const b = document.createElement('button');
    b.dataset.valore = v;
    b.textContent = t;
    if (v === valore) b.classList.add('on');
    b.addEventListener('click', () => g.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)));
    g.appendChild(b);
  }
  d.appendChild(l); d.appendChild(g);
  return d;
}

function elenco(etichetta, nome, opzioni, valore) {
  const d = document.createElement('div');
  d.className = 'campo';
  const l = document.createElement('label');
  l.textContent = etichetta;
  const s = document.createElement('select');
  s.name = nome;
  for (const [v, t] of opzioni) {
    const o = document.createElement('option');
    o.value = v; o.textContent = t;
    if (v === valore) o.selected = true;
    s.appendChild(o);
  }
  d.appendChild(l); d.appendChild(s);
  return d;
}

function apriModale(titolo, riempi) {
  const m = $('#modale');
  m.innerHTML = '';
  const h = document.createElement('h2');
  h.textContent = titolo;
  m.appendChild(h);
  const corpo = document.createElement('div');
  m.appendChild(corpo);
  const chiudi = () => { m.classList.add('nascosto'); m.innerHTML = ''; };
  riempi(corpo, chiudi);
  const annulla = document.createElement('button');
  annulla.className = 'btn grigio';
  annulla.style.marginTop = '12px';
  annulla.textContent = 'Chiudi';
  annulla.addEventListener('click', chiudi);
  m.appendChild(annulla);
  m.classList.remove('nascosto');
}

avvia().catch((e) => {
  console.error(e);
  alert('Qualcosa non ha funzionato all\'avvio: ' + e.message);
});
