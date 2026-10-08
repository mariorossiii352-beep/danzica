// Icone Lucide (https://lucide.dev, licenza ISC: Copyright (c) Lucide Icons
// and Contributors). Solo i disegni che servono all'app, copiati qui dentro:
// funzionano senza rete e non dipendono da nessun servizio.

const DISEGNI = {
  'map': '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/> <path d="M15 5.764v15"/> <path d="M9 3.236v15"/>',
  'calendar-days': '<path d="M8 2v3"/> <path d="M16 2v3"/> <rect x="3" y="3" width="18" height="18" rx="2"/> <path d="M3 9h18"/> <path d="M8 13h.01"/> <path d="M12 13h.01"/> <path d="M16 13h.01"/> <path d="M8 17h.01"/> <path d="M12 17h.01"/> <path d="M16 17h.01"/>',
  'heart': '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
  'wallet': '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/> <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  'info': '<circle cx="12" cy="12" r="10"/> <path d="M12 16v-4"/> <path d="M12 8h.01"/>',
  'search': '<path d="m21 21-4.34-4.34"/> <circle cx="11" cy="11" r="8"/>',
  'house': '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/> <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/> <path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'grip-vertical': '<circle cx="9" cy="12" r="1"/> <circle cx="9" cy="5" r="1"/> <circle cx="9" cy="19" r="1"/> <circle cx="15" cy="12" r="1"/> <circle cx="15" cy="5" r="1"/> <circle cx="15" cy="19" r="1"/>',
  'footprints': '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/> <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/> <path d="M16 17h4"/> <path d="M4 13h4"/>',
  'tram-front': '<rect width="16" height="16" x="4" y="3" rx="2"/> <path d="M4 11h16"/> <path d="M12 3v8"/> <path d="m8 19-2 3"/> <path d="m18 22-2-3"/> <path d="M8 15h.01"/> <path d="M16 15h.01"/>',
  'car-taxi-front': '<path d="M10 2h4"/> <path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8"/> <path d="M7 14h.01"/> <path d="M17 14h.01"/> <rect width="18" height="8" x="3" y="10" rx="2"/> <path d="M5 18v2"/> <path d="M19 18v2"/>',
  'cake': '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/> <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/> <path d="M2 21h20"/> <path d="M7 8v3"/> <path d="M12 8v3"/> <path d="M17 8v3"/> <path d="M7 4h.01"/> <path d="M12 4h.01"/> <path d="M17 4h.01"/>',
  'utensils': '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/> <path d="M7 2v20"/> <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  'cake-slice': '<path d="M16 13H3"/> <path d="M16 17H3"/> <path d="m7.2 7.9-3.388 2.5A2 2 0 0 0 3 12.01V20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-8.654c0-2-2.44-6.026-6.44-8.026a1 1 0 0 0-1.082.057L10.4 5.6"/> <circle cx="9" cy="7" r="2"/>',
  'coffee': '<path d="M10 2v2"/> <path d="M14 2v2"/> <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/> <path d="M6 2v2"/>',
  'wine': '<path d="M8 22h8"/> <path d="M7 10h10"/> <path d="M12 15v7"/> <path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/>',
  'landmark': '<path d="M10 18v-7"/> <path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"/> <path d="M14 18v-7"/> <path d="M18 18v-7"/> <path d="M3 22h18"/> <path d="M6 18v-7"/>',
  'binoculars': '<path d="M10 10h4"/> <path d="M19 7V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3"/> <path d="M20 21a2 2 0 0 0 2-2v-3.851c0-1.39-2-2.962-2-4.829V8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2z"/> <path d="M 22 16 L 2 16"/> <path d="M4 21a2 2 0 0 1-2-2v-3.851c0-1.39 2-2.962 2-4.829V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2z"/> <path d="M9 7V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3"/>',
  'church': '<path d="M10 9h4"/> <path d="M12 7v5"/> <path d="M14 21v-3a2 2 0 0 0-4 0v3"/> <path d="m18 9 3.52 2.147a1 1 0 0 1 .48.854V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.999a1 1 0 0 1 .48-.854L6 9"/> <path d="M6 21V7a1 1 0 0 1 .376-.782l5-3.999a1 1 0 0 1 1.249.001l5 4A1 1 0 0 1 18 7v14"/>',
  'camera': '<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/> <circle cx="12" cy="13" r="3"/>',
  'shopping-bag': '<path d="M16 10a4 4 0 0 1-8 0"/> <path d="M3.103 6.034h17.794"/> <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',
  'train-front': '<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/> <path d="m9 15-1-1"/> <path d="m15 15 1-1"/> <path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/> <path d="m8 19-2 3"/> <path d="m16 19 2 3"/>',
  'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/> <path d="M12 9v4"/> <path d="M12 17h.01"/>',
  'x': '<path d="M18 6 6 18"/> <path d="m6 6 12 12"/>',
  'navigation': '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  'plus': '<path d="M5 12h14"/> <path d="M12 5v14"/>',
};

// '<svg>' pronto da inserire; il colore lo prende dal testo intorno
function icona(nome, cls) {
  return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (DISEGNI[nome] || '') + '</svg>';
}

// Icona per ogni categoria di posto (segnaposti della mappa)
const PER_CATEGORIA = {
  cibo: 'utensils', dolci: 'cake-slice', caffe: 'coffee', bar: 'wine', museo: 'landmark', vista: 'binoculars',
  chiesa: 'church', attrazione: 'camera', shopping: 'shopping-bag', gita: 'train-front', casa: 'house'
};

export { icona, PER_CATEGORIA };
