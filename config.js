// Impostazioni dell'app. La configurazione Firebase non e' un segreto:
// a proteggere i dati sono le regole di Firestore, non il fatto di nasconderla.
//
// La mappa usa OpenStreetMap e non vuole nessuna chiave.

export const CONFIG = {
  // Firebase -> Impostazioni progetto -> Le tue app -> Configurazione SDK
  // Esempio: { apiKey: '...', authDomain: '...', projectId: '...', appId: '...' }
  // Progetto danzica-viaggio (account mariorossiii352), creato il 27/09/2026
  firebase: {
    apiKey: 'AIzaSyAoG4lf3JYjhe6BIUJbIkHGyACd5R1RwFU',
    authDomain: 'danzica-viaggio.firebaseapp.com',
    projectId: 'danzica-viaggio',
    appId: '1:207455452051:web:50560ee83bc6983ee8c666'
  },

  // Centro della mappa: Danzica centro storico
  centro: { lat: 54.3489, lng: 18.6532 },

  // Tasso usato finche' Frankfurter non risponde (1 PLN in EUR)
  tassoFallback: 0.2333
};
