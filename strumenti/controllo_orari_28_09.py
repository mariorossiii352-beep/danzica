# Ricontrollo del 28/09/2026: i posti rimasti al 14-16/09 o "da confermare".
# Stessa regola del 25/09: prima il sito ufficiale, Google Maps solo se il sito
# non ha gli orari (tabella degli orari aperta col clic), e la fonte e' scritta.
# Quello che non si trova resta "da confermare": niente orari indovinati.
# Si lancia una volta: python strumenti/controllo_orari_28_09.py
import json
from pathlib import Path

FILE = Path(__file__).resolve().parent.parent / 'contenuti' / 'posti.json'
OGGI = '2026-09-28'
GIORNI = ('lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom')


def o(**kw):
    """o(tutti='09-18', dom=None) -> orari. None = chiuso."""
    base = kw.pop('tutti', None)
    out = {}
    for g in GIORNI:
        v = kw.get(g, base)
        out[g] = [] if v is None else [fascia(f) for f in v.split(',')]
    return out


def fascia(s):
    a, b = s.strip().split('-')
    fmt = lambda x: x if ':' in x else x + ':00'
    return [fmt(a).zfill(5), fmt(b).zfill(5)]


GM = 'Google Maps (letto il 28/09/2026; il sito ufficiale non riporta gli orari)'
GM_OK = 'Google Maps (ricontrollato il 28/09/2026: orari uguali a quelli nell\'app)'

M = {
    # --- orari confermati, uguali a prima ---
    'slony-spichlerz': dict(fonte=GM_OK, da_confermare=False),
    'museo-nazionale': dict(fonte=GM_OK, da_confermare=False),
    'basilica-santa-brigida': dict(indirizzo='Profesorska 17', fonte=GM_OK, da_confermare=False),

    # --- orari nuovi ---
    'oliwski-park': dict(orari=o(tutti='05-23'), orari_nota='Aperto tutti i giorni dalle 5 alle 23.',
                         fonte=GM, da_confermare=False),
    'krzywy-domek': dict(orari=o(tutti='08-23'), orari_nota='L\'edificio (negozi e locali) è aperto 8-23; la facciata si vede sempre dalla strada.',
                         fonte=GM, da_confermare=False),
    'sopot-centrum': dict(orari=o(tutti='09-20'), orari_nota='Tutti i giorni 9-20.', fonte=GM, da_confermare=False),

    # --- incerti: restano "da confermare" ---
    'filharmonia': dict(orari=o(lun=None, tutti='13-18', sab=None, dom=None),
                        orari_nota='Su Google Maps: mar-ven 13-18, chiuso sab-dom-lun. Probabilmente è l\'orario della biglietteria, non dei concerti: per i concerti vale il programma sul sito.',
                        fonte=GM, da_confermare=True),
    'pierogarnia-stary-mlyn': dict(orari_nota='Né il sito ufficiale né Google Maps pubblicano gli orari (ricontrollato il 28/09). Il pranzo del 10 è prenotato 12:30-14:30. Servizio lento: tenere margine.',
                                   fonte='sito pierogarnie.com e Google Maps (28/09/2026): orari non pubblicati', da_confermare=True),
    'castello-di-malbork': dict(fonte='sito ufficiale zamek.malbork.pl (ricontrollato il 28/09/2026: c\'è ancora solo l\'orario estivo fino al 30/09)',
                                orari_nota='ATTENZIONE: il 28/09 il sito pubblica ancora solo l\'orario estivo (fino al 30/09: mar-dom 9-20, ultimo ingresso al percorso storico 16:30; il lunedì solo il percorso all\'aperto, gratis, biglietto solo in cassa). Gli orari qui sono della ricerca del 14/09, da ricontrollare prima di partire.',
                                da_confermare=True),
    'poczta-polska': dict(fonte='sito ufficiale muzeumgdansk.pl (ricontrollato il 28/09/2026: orari non ancora pubblicati)', da_confermare=True),
    'torre-basilica-santa-maria': dict(fonte='sito ufficiale bazylikamariacka.gdansk.pl (ricontrollato il 28/09/2026: testo invariato)', da_confermare=True),
}


def main():
    posti = json.loads(FILE.read_text(encoding='utf-8'))
    per_id = {p['id']: p for p in posti}
    for pid, mod in M.items():
        p = per_id[pid]
        mod = dict(mod)
        fonte = mod.pop('fonte')
        p.update(mod)
        p['fonti'] = [fonte] + [f for f in p.get('fonti', []) if f != fonte]
        p['verificato'] = OGGI
    FILE.write_text(json.dumps(posti, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('aggiornati', len(M))


if __name__ == '__main__':
    main()
