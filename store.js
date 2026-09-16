// Stato condiviso e salvataggio.
// Se in config.js c'e' la configurazione Firebase usa Firestore (con cache offline),
// altrimenti tiene tutto nel browser: l'app funziona lo stesso, solo senza sincronia.
//
// In Firestore, sotto viaggi/{codice}:
//   documento principale: { casa, giorni, cuori }
//   sottoraccolta spese/{id}
//   sottoraccolta posti/{id}   (posti aggiunti con la ricerca Places)

import { CONFIG } from './config.js';

const VUOTO = () => ({ casa: null, giorni: {}, cuori: {}, spese: [], posti: [] });

const stato = VUOTO();
let codice = null;
let io = 'D';
let fb = null; // { db, doc, ... } quando Firestore e' attivo
const ascoltatori = [];

function ascolta(fn) { ascoltatori.push(fn); return () => ascoltatori.splice(ascoltatori.indexOf(fn), 1); }
function avvisa() { for (const f of ascoltatori) { try { f(stato); } catch (e) { console.error(e); } } }

function chiaveLocale() { return 'danzica:' + (codice || 'locale'); }

function salvaLocale() {
  try { localStorage.setItem(chiaveLocale(), JSON.stringify(stato)); } catch (e) { /* quota */ }
}

function caricaLocale() {
  try {
    const g = JSON.parse(localStorage.getItem(chiaveLocale()) || 'null');
    if (g) Object.assign(stato, VUOTO(), g);
  } catch (e) { /* dati rovinati: riparto vuoto */ }
}

// --- Firestore ---------------------------------------------------------

async function apriFirestore() {
  const app = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
  const auth = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const a = app.initializeApp(CONFIG.firebase);
  const db = fs.initializeFirestore(a, {
    localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() })
  });
  await auth.signInAnonymously(auth.getAuth(a));
  return { fs, db, radice: fs.doc(db, 'viaggi', codice) };
}

function collegaAscolti() {
  const { fs, db, radice } = fb;
  fs.onSnapshot(radice, (d) => {
    const v = d.data() || {};
    stato.casa = v.casa || null;
    stato.giorni = v.giorni || {};
    stato.cuori = v.cuori || {};
    salvaLocale(); avvisa();
  }, console.error);
  fs.onSnapshot(fs.collection(db, 'viaggi', codice, 'spese'), (q) => {
    stato.spese = q.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    salvaLocale(); avvisa();
  }, console.error);
  fs.onSnapshot(fs.collection(db, 'viaggi', codice, 'posti'), (q) => {
    stato.posti = q.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    salvaLocale(); avvisa();
  }, console.error);
}

// --- avvio -------------------------------------------------------------

async function init(opzioni) {
  codice = opzioni.codice;
  io = opzioni.io || 'D';
  caricaLocale();
  avvisa();
  if (CONFIG.firebase && CONFIG.firebase.apiKey) {
    try {
      fb = await apriFirestore();
      collegaAscolti();
    } catch (e) {
      console.error('Firestore non disponibile, resto in locale:', e);
      fb = null;
    }
  }
  return stato;
}

// --- scritture ---------------------------------------------------------

async function scriviRadice(campi) {
  if (!fb) { salvaLocale(); avvisa(); return; }
  await fb.fs.setDoc(fb.radice, campi, { merge: true });
}

async function salvaGiorno(data, giorno) {
  stato.giorni[data] = giorno;
  salvaLocale(); avvisa();
  if (fb) await fb.fs.setDoc(fb.radice, { giorni: { [data]: giorno } }, { merge: true });
}

async function impostaCasa(casa) {
  stato.casa = casa;
  salvaLocale(); avvisa();
  await scriviRadice({ casa: casa });
}

// cuori[postoId] = { D: bool, A: bool }
async function cambiaCuore(postoId, chi, acceso) {
  const c = stato.cuori[postoId] || { D: false, A: false };
  c[chi] = !!acceso;
  stato.cuori[postoId] = c;
  salvaLocale(); avvisa();
  if (fb) await fb.fs.setDoc(fb.radice, { cuori: { [postoId]: c } }, { merge: true });
}

function nuovoId(pre) {
  return pre + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

async function aggiungiSpesa(sp) {
  const s = Object.assign({ id: nuovoId('sp'), creata: Date.now() }, sp);
  stato.spese.push(s);
  salvaLocale(); avvisa();
  if (fb) await fb.fs.setDoc(fb.fs.doc(fb.db, 'viaggi', codice, 'spese', s.id), s);
  return s;
}

async function modificaSpesa(id, campi) {
  const s = stato.spese.find((x) => x.id === id);
  if (s) Object.assign(s, campi);
  salvaLocale(); avvisa();
  if (fb) await fb.fs.setDoc(fb.fs.doc(fb.db, 'viaggi', codice, 'spese', id), campi, { merge: true });
}

async function eliminaSpesa(id) {
  stato.spese = stato.spese.filter((x) => x.id !== id);
  salvaLocale(); avvisa();
  if (fb) await fb.fs.deleteDoc(fb.fs.doc(fb.db, 'viaggi', codice, 'spese', id));
}

async function aggiungiPosto(posto) {
  const p = Object.assign({ id: nuovoId('p') }, posto);
  stato.posti.push(p);
  salvaLocale(); avvisa();
  if (fb) await fb.fs.setDoc(fb.fs.doc(fb.db, 'viaggi', codice, 'posti', p.id), p);
  return p;
}

// Scrive i dati iniziali del viaggio solo se non c'e' gia' un piano.
async function semina(dati) {
  if (Object.keys(stato.giorni || {}).length) return false;
  stato.casa = stato.casa || dati.casa || null;
  stato.giorni = dati.giorni || {};
  salvaLocale(); avvisa();
  await scriviRadice({ casa: stato.casa, giorni: stato.giorni });
  return true;
}

const chi = () => io;
const conSincronia = () => !!fb;

export {
  stato, init, ascolta, salvaGiorno, impostaCasa, cambiaCuore,
  aggiungiSpesa, modificaSpesa, eliminaSpesa, aggiungiPosto, semina,
  chi, conSincronia, nuovoId
};
