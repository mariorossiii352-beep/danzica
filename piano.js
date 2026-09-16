// Logica del piano: orari a catena, scelta del mezzo, avvisi.
// Modulo puro: niente DOM, niente rete, niente Firebase.
//
// Un giorno:
// { data: '2026-10-10', partenza: '10:30', limite: null|'14:30', tappe: [...] }
// Una tappa:
// { id, postoId, nome, durata_min, bloccata: bool, ora: '12:30'|null, nota, mezzo: null|'piedi'|'mezzi'|'taxi' }
//
// I tempi di viaggio arrivano gia' calcolati (cache di Routes) in una mappa
// stime['idA>idB'] = { piedi_min, mezzi_min, taxi_min, metri, biglietto_zl }.

const GIORNI = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
const PRESTO = 10 * 60; // mai prima delle 10
const MARGINE_MIN = 10; // avviso se resta meno di questo prima di una tappa bloccata

// '12:30' -> 750. Accetta anche '24:00' -> 1440.
function minuti(hhmm) {
  if (typeof hhmm === 'number') return hhmm;
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

// 750 -> '12:30'. Oltre la mezzanotte torna all'inizio (1470 -> '00:30').
function ore(min) {
  const v = ((Math.round(min) % 1440) + 1440) % 1440;
  return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');
}

// Sigla del giorno della settimana da '2026-10-10', senza fuso orario.
function siglaGiorno(dataIso) {
  const p = String(dataIso || '').split('-').map(Number);
  if (p.length !== 3) return null;
  return GIORNI[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()];
}

// 'aperto' | 'chiuso' | 'ignoto'
// Gli intervalli che finiscono dopo la mezzanotte ("18:00"-"02:00") valgono
// anche nelle prime ore del giorno dopo: guardo pure il giorno precedente.
function statoApertura(posto, dataIso, minutoDelGiorno) {
  const orari = posto && posto.orari;
  const sig = siglaGiorno(dataIso);
  if (!orari || !sig) return 'ignoto';
  const oggi = orari[sig];
  if (oggi === null || oggi === undefined) return 'ignoto';
  if (dentro(oggi, minutoDelGiorno)) return 'aperto';
  const ieri = orari[GIORNI[(GIORNI.indexOf(sig) + 6) % 7]];
  if (Array.isArray(ieri) && dentro(ieri, minutoDelGiorno + 1440)) return 'aperto';
  return 'chiuso';
}

function dentro(fasce, minuto) {
  if (!Array.isArray(fasce)) return false;
  for (const f of fasce) {
    const a = minuti(f[0]);
    let b = minuti(f[1]);
    if (a === null || b === null) continue;
    if (b <= a) b += 1440; // finisce dopo la mezzanotte
    if (minuto >= a && minuto < b) return true;
  }
  return false;
}

// Vero se quel giorno il posto e' chiuso tutto il giorno (array vuoto).
function chiusoTuttoIlGiorno(posto, dataIso) {
  const sig = siglaGiorno(dataIso);
  const o = posto && posto.orari && sig ? posto.orari[sig] : undefined;
  return Array.isArray(o) && o.length === 0;
}

// Regola del prompt: a piedi <=20 min, altrimenti mezzi <=35 min, altrimenti taxi.
function scegliMezzo(stima) {
  if (!stima) return null;
  if (stima.piedi_min != null && stima.piedi_min <= 20) return 'piedi';
  if (stima.mezzi_min != null && stima.mezzi_min <= 35) return 'mezzi';
  if (stima.taxi_min != null) return 'taxi';
  if (stima.mezzi_min != null) return 'mezzi';
  if (stima.piedi_min != null) return 'piedi';
  return null;
}

function durataMezzo(stima, mezzo) {
  if (!stima || !mezzo) return null;
  const v = stima[mezzo + '_min'];
  return v == null ? null : v;
}

function chiaveTratta(a, b) {
  return (a || 'casa') + '>' + (b || 'casa');
}

// Calcola orari e avvisi. Non tocca l'oggetto giorno: torna roba nuova.
// posti: mappa id -> posto (per orari e nome). stime: mappa chiave -> tempi.
function calcola(giorno, posti, stime) {
  const P = posti || {};
  const S = stime || {};
  const tappe = (giorno && giorno.tappe) || [];
  const righe = [];
  const avvisi = [];
  let orologio = minuti(giorno && giorno.partenza) ;
  if (orologio === null || orologio === undefined) orologio = PRESTO;

  for (let i = 0; i < tappe.length; i++) {
    const t = tappe[i];
    const prec = i > 0 ? tappe[i - 1] : null;
    let tratta = null;

    if (prec) {
      const stima = S[chiaveTratta(prec.postoId, t.postoId)] || null;
      const mezzo = t.mezzo || scegliMezzo(stima);
      const durata = durataMezzo(stima, mezzo);
      tratta = {
        mezzo: mezzo,
        minuti: durata,
        metri: stima ? stima.metri : null,
        biglietto_zl: stima ? stima.biglietto_zl : null,
        manuale: !!t.mezzo,
        stimato: !stima
      };
      orologio += durata == null ? 15 : durata; // senza dato: 15 min di cortesia
    }

    const oraFissa = t.bloccata ? minuti(t.ora) : null;
    let arrivo = orologio;
    if (oraFissa != null) {
      const margine = oraFissa - orologio;
      if (prec) {
        if (margine < 0) {
          avvisi.push({
            tipo: 'ritardo', tappa: t.id,
            testo: 'Con questo giro arrivi alle ' + ore(orologio) + ', ' + (-margine) +
              ' min dopo l\'orario fissato di ' + ore(oraFissa) + ' per ' + t.nome + '.'
          });
        } else if (margine < MARGINE_MIN) {
          avvisi.push({
            tipo: 'margine', tappa: t.id,
            testo: 'Arrivo alle ' + ore(orologio) + ': restano ' + margine +
              ' minuti prima di ' + t.nome + ' delle ' + ore(oraFissa) + '.'
          });
        }
      }
      arrivo = Math.max(oraFissa, orologio);
    }

    const durata = Number(t.durata_min) > 0 ? Number(t.durata_min) : 0;
    const fine = arrivo + durata;
    const posto = t.postoId ? P[t.postoId] : null;

    if (posto) {
      if (chiusoTuttoIlGiorno(posto, giorno.data)) {
        avvisi.push({ tipo: 'chiuso', tappa: t.id, testo: t.nome + ' e\' chiuso tutto il giorno.' });
      } else {
        const stato = statoApertura(posto, giorno.data, arrivo);
        if (stato === 'chiuso') {
          avvisi.push({
            tipo: 'chiuso', tappa: t.id,
            testo: t.nome + ' alle ' + ore(arrivo) + ' e\' chiuso.' +
              (posto.da_confermare ? ' Orari da verificare sul posto.' : '')
          });
        }
      }
    }

    // Le tappe bloccate (voli, prenotazioni) non si possono spostare: avvisare
    // che sono presto sarebbe solo rumore.
    if (arrivo < PRESTO && !t.bloccata) {
      avvisi.push({
        tipo: 'presto', tappa: t.id,
        testo: t.nome + ' alle ' + ore(arrivo) + ': prima delle 10 e\' troppo presto.'
      });
    }

    righe.push({
      tappa: t, tratta: tratta,
      arrivo: arrivo, fine: fine,
      oraArrivo: ore(arrivo), oraFine: ore(fine),
      apertura: posto ? statoApertura(posto, giorno.data, arrivo) : 'ignoto'
    });
    orologio = fine;
  }

  const limite = minuti(giorno && giorno.limite);
  if (limite != null && righe.length) {
    const ultima = righe[righe.length - 1];
    // Se l'ultima tappa e' la partenza (durata 0) conta l'arrivo, altrimenti la fine.
    const chiusura = ultima.tappa.durata_min ? ultima.fine : ultima.arrivo;
    if (chiusura > limite) {
      avvisi.push({
        tipo: 'limite',
        testo: 'La giornata finisce alle ' + ore(chiusura) + ', oltre l\'orario limite delle ' +
          ore(limite) + '. Togli o accorcia una tappa.'
      });
    }
  }

  return { righe: righe, avvisi: avvisi };
}

export { GIORNI, PRESTO, MARGINE_MIN, minuti, ore, siglaGiorno, statoApertura, chiusoTuttoIlGiorno, scegliMezzo, durataMezzo, chiaveTratta, calcola };
export default { minuti, ore, siglaGiorno, statoApertura, chiusoTuttoIlGiorno, scegliMezzo, calcola };
