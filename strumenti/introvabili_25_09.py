# Posti delle liste/video che il 25/09/2026 non si trovano come descritti.
# Non si tolgono (vengono dalle ricerche di Alessia e Daniele): si segnano.
import json
from pathlib import Path

FILE = Path(__file__).resolve().parent.parent / 'contenuti' / 'posti.json'
TUTTO = {g: [['00:00', '24:00']] for g in ('lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom')}
IGNOTO = {g: None for g in ('lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom')}

M = {
    'dom-mlynarza': dict(
        nome='Dwór Cechu Młynarzy (casa dei mugnai)',
        categoria='attrazione',
        indirizzo='Młyńska 2',
        zona='Wyspa Młyńska',
        orari=TUTTO,
        orari_nota='Edificio storico da vedere da fuori.',
        descrizione="La casa della corporazione dei mugnai, a graticcio, del 1831 e ricostruita nel 1997, sull'isola dei mulini lungo il canale "
                    "Radunia, vicino al Museo dell'ambra e al ponte dei lucchetti. Nel video era indicata come ristorante: su Google Maps (25/09) "
                    "risulta solo come edificio storico, senza un ristorante registrato qui. Accanto, in Na Piaskach 1, c'è il Café Archer Praline.",
        da_confermare=False,
        fonti=['Google Maps (letto il 25/09/2026)', 'TikTok @vpcn.travel'],
        recensioni={'voto': 4.9, 'numero': 100, 'riassunto': 'Uno degli angoli più fotografati della città: casa a graticcio sul canale, bella soprattutto riflessa nell\'acqua.',
                    'da_provare': [], 'fonte': 'Google Maps', 'letto': '2026-09-25'},
    ),
    'dawid-ambra': dict(
        orari=IGNOTO,
        orari_nota='NON TROVATO: il 25/09 su Google Maps non c\'è un negozio "Dawid" in via Mariacka 13/15. Potrebbe aver chiuso o chiamarsi in altro modo.',
        da_confermare=True,
    ),
    'pamiatki-gdanskie': dict(
        orari=IGNOTO,
        orari_nota='NON TROVATO: il 25/09 su Google Maps non c\'è un negozio con questo nome. Nel video non c\'era l\'indirizzo.',
        da_confermare=True,
    ),
}

posti = json.loads(FILE.read_text(encoding='utf-8'))
for p in posti:
    if p['id'] in M:
        p.update(M[p['id']])
        p['verificato'] = '2026-09-25'
FILE.write_text(json.dumps(posti, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('ok')
