// Tappe iniziali del piano: le tre prenotazioni di sabato 10 ottobre.
// Questo file e' pubblico. I voli non ci sono, per scelta.
//
// L'app lo legge al primo avvio e scrive queste tappe nel piano una volta
// sola: se c'e' gia' un piano non tocca niente (vedi semina() in store.js).
// Da quel momento il piano si modifica dall'app, non da qui.

window.SEME = {

  // L'appartamento non e' ancora prenotato: si imposta dall'app.
  casa: null,

  giorni: {

    '2026-10-09': { data: '2026-10-09', partenza: '10:00', limite: null, tappe: [] },

    '2026-10-10': {
      data: '2026-10-10',
      partenza: '10:00',
      limite: null,
      tappe: [
        {
          id: 'sab-pranzo',
          postoId: 'pierogarnia-stary-mlyn',
          nome: 'Pierogarnia Stary Młyn',
          ora: '12:30',
          bloccata: true,
          durata_min: 120,
          mezzo: null,
          nota: 'Pranzo prenotato, 12:30-14:30. Oggi Alessia compie 24 anni.'
        },
        {
          id: 'sab-aperitivo',
          postoId: 'olivia-star-top',
          nome: 'Olivia Garden',
          ora: '19:15',
          bloccata: true,
          // la cena e' alle 20:30 nello stesso edificio: un'ora di terrazza
          // lascia un quarto d'ora per scendere al piano 33 con calma
          durata_min: 60,
          mezzo: null,
          nota: 'Aperitivo sulla terrazza al 32esimo piano, prenotato per 2. Comprando il biglietto 3 giorni prima c’è il 30% di sconto; il ridotto vale solo per Alessia, under 26.'
        },
        {
          id: 'sab-cena',
          postoId: 'treinta-y-tres',
          nome: 'Treinta y Tres',
          ora: '20:30',
          bloccata: true,
          // il ristorante chiude alle 22
          durata_min: 90,
          mezzo: null,
          nota: 'Cena di compleanno, tavolo per 2 confermato. Tolleranza di 15 minuti: se tardate di più, telefonate al ristorante.'
        }
      ]
    },

    '2026-10-11': { data: '2026-10-11', partenza: '10:00', limite: null, tappe: [] },

    '2026-10-12': { data: '2026-10-12', partenza: '10:00', limite: null, tappe: [] }

  }
};
