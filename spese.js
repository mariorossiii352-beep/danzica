// Logica delle spese. Modulo puro: niente DOM, niente Firebase.
// Tutti gli importi sono in grosz interi (1 zloty = 100 grosz). Mai float.
//
// Forma di una spesa:
// { id, tipo: 'spesa'|'rimborso', chi: 'D'|'A', grosz, descrizione, categoria,
//   giorno: '2026-10-10', divisione: 'meta'|'D'|'A' }
//
// Convenzione del saldo: positivo = Alessia deve a Daniele.

const PERSONE = ['D', 'A'];

// "12,50" / "12.50" / "12" / " 1 234,5 " -> grosz interi
function parseImporto(testo) {
  if (typeof testo === 'number') return Math.round(testo * 100);
  const pulito = String(testo == null ? '' : testo)
    .replace(/\s| /g, '')
    .replace(/z[lł]$/i, '')
    .replace(',', '.');
  if (!/^-?\d*\.?\d*$/.test(pulito) || pulito === '' || pulito === '.') return null;
  const n = Number(pulito);
  if (!isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

// grosz -> "42,50"
function formatta(grosz) {
  const segno = grosz < 0 ? '-' : '';
  const v = Math.abs(Math.round(grosz));
  return segno + Math.floor(v / 100) + ',' + String(v % 100).padStart(2, '0');
}

// Quanto di questa spesa tocca a ciascuno.
// Nella divisione a meta' il grosz dispari va a chi ha pagato: deterministico.
function quote(spesa) {
  const q = { D: 0, A: 0 };
  const chi = spesa.chi === 'A' ? 'A' : 'D';
  const altro = chi === 'D' ? 'A' : 'D';
  if (spesa.divisione === 'D' || spesa.divisione === 'A') {
    q[spesa.divisione] = spesa.grosz;
  } else {
    q[altro] = Math.floor(spesa.grosz / 2);
    q[chi] = spesa.grosz - q[altro];
  }
  return q;
}

// Saldo complessivo in grosz. Positivo: Alessia deve a Daniele.
function saldo(spese) {
  let s = 0;
  for (const sp of spese || []) {
    if (sp.tipo === 'rimborso') {
      // Un rimborso pagato da Alessia azzera parte del suo debito.
      s += sp.chi === 'A' ? -sp.grosz : sp.grosz;
      continue;
    }
    const q = quote(sp);
    s += sp.chi === 'D' ? q.A : -q.D;
  }
  return s;
}

// Frase pronta da mostrare.
function frasesaldo(spese, nomi) {
  const n = nomi || { D: 'Daniele', A: 'Alessia' };
  const s = saldo(spese);
  if (s === 0) return 'In pari';
  if (s > 0) return n.A + ' deve ' + formatta(s) + ' zł a ' + n.D;
  return n.D + ' deve ' + formatta(-s) + ' zł a ' + n.A;
}

// Rimborso che azzera il saldo attuale, o null se sono gia' in pari.
function rimborsoDiPareggio(spese, id) {
  const s = saldo(spese);
  if (s === 0) return null;
  return {
    id: id || 'rimb-' + Date.now(),
    tipo: 'rimborso',
    chi: s > 0 ? 'A' : 'D',
    grosz: Math.abs(s),
    descrizione: 'Saldato',
    categoria: 'rimborso',
    giorno: null,
    divisione: 'meta'
  };
}

function totaliPer(spese, campo) {
  const t = {};
  for (const sp of spese || []) {
    if (sp.tipo === 'rimborso') continue;
    const k = sp[campo] == null ? '' : sp[campo];
    t[k] = (t[k] || 0) + sp.grosz;
  }
  return t;
}

const totaliPerGiorno = (spese) => totaliPer(spese, 'giorno');
const totaliPerCategoria = (spese) => totaliPer(spese, 'categoria');

function totale(spese) {
  let t = 0;
  for (const sp of spese || []) if (sp.tipo !== 'rimborso') t += sp.grosz;
  return t;
}

// grosz -> euro, con il tasso PLN->EUR del convertitore (es. 0.2333)
function inEuro(grosz, tassoPlnEur) {
  if (!tassoPlnEur) return null;
  return Math.round(grosz * tassoPlnEur) / 100;
}

const API = {
  PERSONE, parseImporto, formatta, quote, saldo, frasesaldo,
  rimborsoDiPareggio, totaliPerGiorno, totaliPerCategoria, totale, inEuro
};

export { PERSONE, parseImporto, formatta, quote, saldo, frasesaldo, rimborsoDiPareggio, totaliPerGiorno, totaliPerCategoria, totale, inEuro };
export default API;
