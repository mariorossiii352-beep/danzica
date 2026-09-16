import assert from 'node:assert/strict';
import {
  parseImporto,
  formatta,
  quote,
  saldo,
  frasesaldo,
  rimborsoDiPareggio,
  totaliPerGiorno,
  totaliPerCategoria,
  totale
} from '../spese.js';

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

test('parseImporto converte importi validi', () => {
  assert.equal(parseImporto('12,50'), 1250);
  assert.equal(parseImporto('12.50'), 1250);
  assert.equal(parseImporto('12'), 1200);
  assert.equal(parseImporto('0,05'), 5);
});

test('parseImporto rifiuta importi non validi o negativi', () => {
  assert.equal(parseImporto(''), null);
  assert.equal(parseImporto('testo non numerico'), null);
  assert.equal(parseImporto('-12,50'), null);
});

test('formatta formatta importi positivi, zero e negativi', () => {
  assert.equal(formatta(0), '0,00');
  assert.equal(formatta(5), '0,05');
  assert.equal(formatta(4250), '42,50');
  assert.equal(formatta(-4250), '-42,50');
  assert.equal(formatta(-5), '-0,05');
});

test("quote divide a meta' un importo dispari lasciando il grosz a chi ha pagato", () => {
  const pagataDaDaniele = quote({ chi: 'D', grosz: 101, divisione: 'meta' });
  assert.deepEqual(pagataDaDaniele, { D: 51, A: 50 });
  assert.equal(pagataDaDaniele.D + pagataDaDaniele.A, 101);

  const pagataDaAlessia = quote({ chi: 'A', grosz: 101, divisione: 'meta' });
  assert.deepEqual(pagataDaAlessia, { D: 50, A: 51 });
  assert.equal(pagataDaAlessia.D + pagataDaAlessia.A, 101);
});

test("quote assegna tutto a una sola persona", () => {
  assert.deepEqual(
    quote({ chi: 'D', grosz: 2500, divisione: 'D' }),
    { D: 2500, A: 0 }
  );
  assert.deepEqual(
    quote({ chi: 'A', grosz: 2500, divisione: 'A' }),
    { D: 0, A: 2500 }
  );
});

test('saldo calcola correttamente spese miste pagate da Daniele e Alessia', () => {
  const spese = [
    { tipo: 'spesa', chi: 'D', grosz: 10000, divisione: 'meta' },
    { tipo: 'spesa', chi: 'A', grosz: 4000, divisione: 'meta' },
    { tipo: 'spesa', chi: 'D', grosz: 3000, divisione: 'A' },
    { tipo: 'spesa', chi: 'A', grosz: 1000, divisione: 'A' }
  ];

  assert.equal(saldo(spese), 6000);
  assert.equal(frasesaldo(spese), 'Alessia deve 60,00 zł a Daniele');
});

test("saldo cambia verso aggiungendo una grossa spesa dell'altra persona", () => {
  const spese = [
    { tipo: 'spesa', chi: 'D', grosz: 10000, divisione: 'meta' },
    { tipo: 'spesa', chi: 'A', grosz: 4000, divisione: 'meta' }
  ];

  assert.equal(saldo(spese), 3000);

  spese.push({ tipo: 'spesa', chi: 'A', grosz: 10000, divisione: 'meta' });

  assert.equal(saldo(spese), -2000);
  assert.equal(frasesaldo(spese), 'Daniele deve 20,00 zł a Alessia');
});

test('rimborsoDiPareggio azzera il saldo e produce la frase In pari', () => {
  const spese = [
    { tipo: 'spesa', chi: 'D', grosz: 10001, divisione: 'meta' },
    { tipo: 'spesa', chi: 'A', grosz: 1000, divisione: 'D' }
  ];
  const rimborso = rimborsoDiPareggio(spese, 'rimborso-1');

  assert.deepEqual(rimborso, {
    id: 'rimborso-1',
    tipo: 'rimborso',
    chi: 'A',
    grosz: 4000,
    descrizione: 'Saldato',
    categoria: 'rimborso',
    giorno: null,
    divisione: 'meta'
  });

  spese.push(rimborso);
  assert.equal(saldo(spese), 0);
  assert.equal(frasesaldo(spese), 'In pari');
});

test('modifica ed eliminazione di spese aggiornano il saldo', () => {
  const spese = [
    { id: '1', tipo: 'spesa', chi: 'D', grosz: 10000, divisione: 'meta' },
    { id: '2', tipo: 'spesa', chi: 'A', grosz: 2000, divisione: 'meta' },
    { id: '3', tipo: 'spesa', chi: 'D', grosz: 3000, divisione: 'A' }
  ];

  assert.equal(saldo(spese), 7000);

  const daModificare = spese.find((spesa) => spesa.id === '2');
  daModificare.grosz = 8000;
  assert.equal(saldo(spese), 4000);

  spese.splice(spese.findIndex((spesa) => spesa.id === '3'), 1);
  assert.equal(saldo(spese), 1000);
});

test('totaliPerGiorno e totaliPerCategoria escludono i rimborsi', () => {
  const spese = [
    {
      tipo: 'spesa',
      chi: 'D',
      grosz: 1200,
      giorno: '2026-10-10',
      categoria: 'cibo',
      divisione: 'meta'
    },
    {
      tipo: 'spesa',
      chi: 'A',
      grosz: 800,
      giorno: '2026-10-10',
      categoria: 'trasporti',
      divisione: 'meta'
    },
    {
      tipo: 'spesa',
      chi: 'D',
      grosz: 500,
      giorno: '2026-10-11',
      categoria: 'cibo',
      divisione: 'D'
    },
    {
      tipo: 'rimborso',
      chi: 'A',
      grosz: 1000,
      giorno: '2026-10-10',
      categoria: 'rimborso',
      divisione: 'meta'
    }
  ];

  assert.deepEqual(totaliPerGiorno(spese), {
    '2026-10-10': 2000,
    '2026-10-11': 500
  });
  assert.deepEqual(totaliPerCategoria(spese), {
    cibo: 1700,
    trasporti: 800
  });
});

test('totale somma solo le spese ed esclude i rimborsi', () => {
  const spese = [
    { tipo: 'spesa', grosz: 1200 },
    { tipo: 'spesa', grosz: 800 },
    { tipo: 'rimborso', grosz: 1000 }
  ];

  assert.equal(totale(spese), 2000);
});


// --- controlli aggiunti a mano, diversi da quelli generati ---

test("la somma delle quote e' sempre uguale all'importo, su molti importi", () => {
  for (let g = 0; g < 2000; g++) {
    for (const chi of ['D', 'A']) {
      const q = quote({ chi, grosz: g, divisione: 'meta' });
      assert.equal(q.D + q.A, g, 'importo ' + g + ' pagato da ' + chi);
      assert.ok(q.D >= 0 && q.A >= 0);
    }
  }
});

test('parseImporto regge spazi, migliaia e suffisso zl', () => {
  assert.equal(parseImporto(' 12,50 '), 1250);
  assert.equal(parseImporto('1 234,50'), 123450);
  assert.equal(parseImporto('29 zł'), 2900);
  assert.equal(parseImporto('12,5'), 1250);
  assert.equal(parseImporto('12,999'), 1300);
});

test('una lunga catena di spese miste finisce in pari dopo il rimborso', () => {
  const spese = [];
  for (let i = 1; i <= 40; i++) {
    spese.push({
      id: 's' + i,
      tipo: 'spesa',
      chi: i % 3 === 0 ? 'A' : 'D',
      grosz: 137 * i + (i % 7),
      divisione: i % 5 === 0 ? 'D' : (i % 11 === 0 ? 'A' : 'meta'),
      giorno: '2026-10-' + (9 + (i % 4)),
      categoria: 'cibo'
    });
  }
  const r = rimborsoDiPareggio(spese, 'r1');
  assert.ok(r && r.grosz > 0);
  spese.push(r);
  assert.equal(saldo(spese), 0);
  assert.equal(rimborsoDiPareggio(spese, 'r2'), null);
});

console.log(`\nRiepilogo: ${passati} passati, ${falliti} falliti.`);
process.exit(falliti > 0 ? 1 : 0);
