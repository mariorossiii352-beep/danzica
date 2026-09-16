import assert from 'node:assert/strict';
import {
  minuti,
  ore,
  siglaGiorno,
  statoApertura,
  scegliMezzo,
  calcola
} from '../piano.js';

let passati = 0;
let falliti = 0;

function test(nome, fn) {
  try {
    fn();
    passati++;
    console.log(`OK - ${nome}`);
  } catch (errore) {
    falliti++;
    console.error(`FALLITO - ${nome}`);
    console.error(errore.stack || errore);
  }
}

test("minuti e ore gestiscono orari normali, 24:00 e oltre mezzanotte", () => {
  assert.equal(minuti('12:30'), 750);
  assert.equal(minuti('24:00'), 1440);
  assert.equal(minuti(1470), 1470);
  assert.equal(ore(750), '12:30');
  assert.equal(ore(1440), '00:00');
  assert.equal(ore(1470), '00:30');
});

test('siglaGiorno calcola correttamente i giorni di ottobre 2026', () => {
  assert.equal(siglaGiorno('2026-10-09'), 'ven');
  assert.equal(siglaGiorno('2026-10-10'), 'sab');
  assert.equal(siglaGiorno('2026-10-11'), 'dom');
  assert.equal(siglaGiorno('2026-10-12'), 'lun');
});

test('statoApertura riconosce fasce normali', () => {
  const posto = {
    orari: {
      sab: [['10:00', '18:00']]
    }
  };

  assert.equal(statoApertura(posto, '2026-10-10', minuti('10:00')), 'aperto');
  assert.equal(statoApertura(posto, '2026-10-10', minuti('17:59')), 'aperto');
  assert.equal(statoApertura(posto, '2026-10-10', minuti('18:00')), 'chiuso');
});

test('statoApertura considera aperta una fascia del giorno prima oltre mezzanotte', () => {
  const posto = {
    orari: {
      ven: [['18:00', '02:00']],
      sab: []
    }
  };

  assert.equal(statoApertura(posto, '2026-10-10', minuti('00:30')), 'aperto');
  assert.equal(statoApertura(posto, '2026-10-10', minuti('02:00')), 'chiuso');
});

test('statoApertura gestisce chiuso, ignoto e aperto tutto il giorno', () => {
  assert.equal(
    statoApertura({ orari: { sab: [] } }, '2026-10-10', minuti('12:00')),
    'chiuso'
  );
  assert.equal(
    statoApertura({ orari: { sab: null } }, '2026-10-10', minuti('12:00')),
    'ignoto'
  );
  assert.equal(
    statoApertura(
      { orari: { sab: [['00:00', '24:00']] } },
      '2026-10-10',
      minuti('23:59')
    ),
    'aperto'
  );
});

test('scegliMezzo applica le tre soglie previste', () => {
  assert.equal(scegliMezzo({ piedi_min: 20, mezzi_min: 10, taxi_min: 5 }), 'piedi');
  assert.equal(scegliMezzo({ piedi_min: 21, mezzi_min: 35, taxi_min: 5 }), 'mezzi');
  assert.equal(scegliMezzo({ piedi_min: 21, mezzi_min: 36, taxi_min: 5 }), 'taxi');
});

test('calcola crea una catena di orari e tutti gli avvisi necessari', () => {
  const giorno = {
    data: '2026-10-10',
    partenza: '09:45',
    limite: '11:30',
    tappe: [
      {
        id: 'prima',
        postoId: 'a',
        nome: 'Museo',
        durata_min: 20,
        bloccata: false,
        ora: null,
        mezzo: null
      },
      {
        id: 'seconda',
        postoId: 'b',
        nome: 'Visita guidata',
        durata_min: 20,
        bloccata: true,
        ora: '10:30',
        mezzo: null
      },
      {
        id: 'terza',
        postoId: 'c',
        nome: 'Galleria',
        durata_min: 30,
        bloccata: true,
        ora: '11:00',
        mezzo: null
      }
    ]
  };

  const posti = {
    a: { orari: { sab: [['09:00', '18:00']] } },
    b: { orari: { sab: [['10:00', '18:00']] } },
    c: { orari: { sab: [] } }
  };

  const stime = {
    'a>b': { piedi_min: 20, mezzi_min: 30, taxi_min: 10, metri: 1200, biglietto_zl: 0 },
    'b>c': { piedi_min: 20, mezzi_min: 30, taxi_min: 10, metri: 1200, biglietto_zl: 0 }
  };

  const risultato = calcola(giorno, posti, stime);

  assert.deepEqual(
    risultato.righe.map((riga) => ({
      arrivo: riga.oraArrivo,
      fine: riga.oraFine,
      mezzo: riga.tratta && riga.tratta.mezzo
    })),
    [
      { arrivo: '09:45', fine: '10:05', mezzo: null },
      { arrivo: '10:30', fine: '10:50', mezzo: 'piedi' },
      { arrivo: '11:10', fine: '11:40', mezzo: 'piedi' }
    ]
  );

  assert.ok(risultato.avvisi.some((avviso) =>
    avviso.tipo === 'presto' && avviso.tappa === 'prima'
  ));
  assert.ok(risultato.avvisi.some((avviso) =>
    avviso.tipo === 'margine' && avviso.tappa === 'seconda'
  ));
  assert.ok(risultato.avvisi.some((avviso) =>
    avviso.tipo === 'ritardo' && avviso.tappa === 'terza'
  ));
  assert.ok(risultato.avvisi.some((avviso) =>
    avviso.tipo === 'chiuso' && avviso.tappa === 'terza'
  ));
  assert.ok(risultato.avvisi.some((avviso) => avviso.tipo === 'limite'));
});

console.log(`\nRiepilogo: ${passati} passati, ${falliti} falliti.`);
process.exit(falliti > 0 ? 1 : 0);
