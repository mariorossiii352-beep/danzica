# Aggiorna le sedi del Muzeum Gdanska in contenuti/posti.json con i dati
# letti su muzeumgdansk.pl il 25/09/2026 (pagina "Godziny otwarcia i ceny",
# news "Nowe Muzeum Poczty Polskiej", pagine delle mostre, "Darmowy wstep").
# Si lancia una volta: python strumenti/aggiorna_muzeum_gdanska.py
import json
from pathlib import Path

FILE = Path(__file__).resolve().parent.parent / 'contenuti' / 'posti.json'
OGGI = '2026-09-25'
FONTE = 'muzeumgdansk.pl (letto il 25/09/2026)'
EN = 'https://muzeumgdansk.pl/en/oddzialy-muzeum/'
IG = 'https://www.instagram.com/muzeumgdansk/'


def sett(lun, altri, mar=None):
    """Orario settimanale: lun, mar (se diverso), mer-dom uguali."""
    f = lambda x: [] if x is None else [x]
    o = {'lun': f(lun)}
    o.update({g: f(altri) for g in ('mar', 'mer', 'gio', 'ven', 'sab', 'dom')})
    if mar is not None:
        o['mar'] = [] if mar == 'chiuso' else [mar]
    return o


CHIUSO = {g: [] for g in ('lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom')}
IGNOTO = {g: None for g in ('lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom')}
GRATIS_NOTA = ' Nei giorni a ingresso gratuito alcune mostre temporanee possono non essere visitabili.'
PASS = 'Pass 90 giorni per tutte le sedi: 160 zł, ridotto 110 zł.'

MODIFICHE = {
    'museo-ambra': dict(
        orari=sett(['12:00', '18:00'], ['10:00', '18:00']),
        orari_nota='Lunedì 12-18 ingresso gratuito.' + GRATIS_NOTA +
                   ' Biglietti fino a 60 minuti prima della chiusura. Non si prenota.',
        prezzo={'normale_zl': 37, 'ridotto_zl': 26, 'nota': 'Ridotto per studenti con tessera valida. ' + PASS},
        durata_min=120,
        descrizione="Il museo dell'ambra, la resina fossile che ha reso ricca Danzica, nel Grande Mulino costruito dai Cavalieri Teutonici. "
                    "Primo piano: l'ambra in natura; secondo piano: l'ambra nella cultura. Il museo indica almeno 2 ore di visita. "
                    "Consigliato da tre creator su sei. Il lunedì dalle 12 alle 18 è gratuito. Mostre temporanee in corso: \"Historie, które wydarzyły się naprawdę\" "
                    "(gioielli di Marcin Tymiński) e \"Spoiler Alert 2027\" (gioielli sperimentali), entrambe fino al 21/02/2027.",
        sito=EN + 'museum-of-amber/',
    ),
    'ratusz-glownego-miasta': dict(
        orari=sett(['12:00', '18:00'], ['10:00', '18:00']),
        orari_nota='Lunedì 12-18 ingresso gratuito.' + GRATIS_NOTA +
                   ' La torre panoramica è chiusa per lavori. Biglietti fino a 45 minuti prima della chiusura.',
        prezzo={'normale_zl': 26, 'ridotto_zl': 19,
                'nota': 'Audioguida PL/EN/DE 10 zł (non in italiano). Galleria Palowa, stesso palazzo, biglietto a parte 11/7 zł, non gratuita il lunedì. ' + PASS},
        durata_min=45,
        descrizione="Il Municipio della Città Principale, all'incrocio fra Długa e Długi Targ. Dentro c'è una delle più belle sale "
                    "rinascimentali del Nord Europa, la porta più antica di Danzica, sotterranei e passaggi segreti. Il museo indica "
                    "almeno 45 minuti. La torre panoramica ora è chiusa per lavori. Nello stesso palazzo c'è la Galleria Palowa, "
                    "con mostre temporanee (ora \"Nasi Chłopcy\", sugli abitanti della Pomerania nell'esercito del Terzo Reich).",
        sito=EN + 'main-town-hall/',
    ),
    'dwor-artusa': dict(
        orari=sett(['12:00', '18:00'], ['10:00', '18:00']),
        eccezioni={'2026-10-09': [['10:00', '14:00']], '2026-10-10': []},
        orari_nota='ATTENZIONE: venerdì 9/10 aperta solo fino alle 14; sabato 10/10 chiusa. Lunedì 12-18 ingresso gratuito.' + GRATIS_NOTA +
                   ' Biglietti fino a 45 minuti prima della chiusura. Non si prenota.',
        prezzo={'normale_zl': 26, 'ridotto_zl': 19, 'nota': 'Audioguida PL/EN/DE 10 zł (non in italiano). ' + PASS},
        descrizione="La Corte di Artù, dove si riunivano le confraternite dei mercanti, di fronte alla Fontana di Nettuno sul Długi Targ. "
                    "Grande sala gotica con modelli di navi appesi e la stufa in maiolica più grande d'Europa: 10,64 m, 530 piastrelle. "
                    "Venerdì 9/10 chiude alle 14, sabato 10/10 è chiusa, lunedì 12/10 è gratuita (12-18).",
        sito=EN + 'artus-court/',
    ),
    'dom-uphagena': dict(
        orari=sett(['12:00', '18:00'], ['10:00', '18:00']),
        orari_nota='Lunedì 12-18 ingresso gratuito.' + GRATIS_NOTA + ' Biglietti fino a 30 minuti prima della chiusura.',
        prezzo={'normale_zl': 26, 'ridotto_zl': 19, 'nota': PASS},
        descrizione="La casa di Johann Uphagen, ricco mercante che la comprò nel 1775 e la arredò: dall'ingresso con lo scalone alla "
                    "sala da tè, al salotto, alla sala da pranzo, alla stanza della musica, fino alle cucine. Sta su via Długa. "
                    "Lunedì gratuita (12-18).",
        sito=EN + 'uphagen-house/',
    ),
    'katownia-brama-wyzynna': dict(
        nome='Zespół Przedbramia (Katownia e Torre della prigione)',
        orari=sett(['12:00', '18:00'], ['10:00', '18:00']),
        orari_nota='Il lunedì è aperta ma NON è gratuita. Biglietti alla cassa del negozio, ingresso dal cortile, fino a 45 minuti prima della chiusura.',
        prezzo={'normale_zl': 18, 'ridotto_zl': 13, 'nota': 'Ridotto per studenti con tessera valida.'},
        descrizione="Il complesso davanti alla Porta Alta (Brama Wyżynna), all'inizio della Via Reale: la Torre della prigione e la "
                    "Katownia, dove un tempo si giudicavano e si tenevano i condannati. Dentro ci sono due mostre.",
        sito='https://muzeumgdansk.pl/wizyta-w-muzeum-gdanska/oddzialy/',
    ),
    'torre-santa-caterina': dict(
        nome='Torre di Santa Caterina (Museo della scienza)',
        orari=CHIUSO,
        orari_nota='CHIUSA durante il viaggio: il museo è aperto solo da aprile a settembre (ven-dom 10-16).',
        prezzo={'normale_zl': 26, 'ridotto_zl': 19, 'nota': 'Chiusa in ottobre.'},
        descrizione="Il Muzeum Nauki Gdańskiej, nella torre della chiesa di Santa Caterina: collezione di orologi da torre dal XIV secolo "
                    "e il primo orologio a pulsar del mondo (2011). È stagionale, da aprile a settembre: a ottobre è chiuso.",
        sito=EN + 'gdansk-museum-of-science/',
    ),
    'poczta-polska': dict(
        nome='Muzeum Poczty Polskiej',
        indirizzo='plac Obrońców Poczty Polskiej 1/2',
        zona='Centro storico',
        orari=IGNOTO,
        orari_nota='Chiuso per modernizzazione. Riapre lunedì 5/10 con la cerimonia; per i visitatori la nuova mostra è aperta dal 6/10. '
                   'Gli orari nuovi non sono ancora pubblicati.',
        prezzo={'normale_zl': 15, 'ridotto_zl': 10, 'nota': 'Prezzi della pagina attuale; con la riapertura potrebbero cambiare. ' + PASS},
        da_confermare=True,
        descrizione="L'ufficio postale polacco difeso dai suoi impiegati il 1° settembre 1939, uno dei luoghi dove cominciò la Seconda "
                    "guerra mondiale. Riapre dopo la modernizzazione con una nuova mostra sui polacchi nella Città Libera di Danzica, "
                    "visitabile dal 6 ottobre.",
        sito='https://muzeumgdansk.pl/wydarzenia/szczegoly/news/nowe-muzeum-poczty-polskiej/',
    ),
    'westerplatte': dict(
        orari=IGNOTO,
        orari_nota="La Wartownia nr 1, l'unico museo al chiuso di Westerplatte (8/5 zł), è aperta solo da aprile a settembre: "
                   "a ottobre è CHIUSA. Il sito del museo non indica orari per l'area all'aperto.",
        prezzo={'normale_zl': None, 'ridotto_zl': None, 'nota': 'Wartownia nr 1: 8/5 zł, ma chiusa in ottobre.'},
        da_confermare=True,
        descrizione="La penisola dove il 1° settembre 1939 cominciò la Seconda guerra mondiale. Si visitano il monumento e le rovine "
                    "delle difese polacche. La Wartownia nr 1, il corpo di guardia con il museo, a ottobre è chiusa. "
                    "C'è anche una crociera in battello dal centro, circa 100 minuti.",
        sito=EN + 'guardhouse-no-1-at-westerplatte/',
    ),
    'twierdza-wisloujscie': dict(
        orari=sett(['10:00', '16:00'], ['10:00', '16:00'], mar='chiuso'),
        orari_nota='Lunedì 10-16 ingresso gratuito; martedì chiusa. Biglietti fino a 60 minuti prima della chiusura.',
        prezzo={'normale_zl': 37, 'ridotto_zl': 26, 'nota': 'Ridotto per studenti con tessera valida.'},
        descrizione="Fortezza alla foce della Vistola che per secoli ha difeso il porto; la torre centrale è del 1482. Dentro le caserme "
                    "napoleoniche c'è la mostra \"Od Batorego do Groma\". Bus 106 o 138 fino a Pokładowa, poi 1,4 km a piedi (circa 18 minuti). "
                    "Lunedì gratuita, martedì chiusa.",
        sito=EN + 'wisloujscie-fortress/',
    ),
}

NUOVI = [
    {
        'id': 'kuznia-wodna',
        'nome': 'Kuźnia Wodna (Fucina ad acqua di Oliwa)',
        'categoria': 'museo',
        'zona': 'Oliwa',
        'indirizzo': 'Bytowska 1',
        'lat': 54.4066328, 'lng': 18.5392364,
        'orari': CHIUSO,
        'orari_nota': 'CHIUSA durante il viaggio: aperta solo da aprile a settembre (ven-dom 10-16).',
        'prezzo': {'normale_zl': 10, 'ridotto_zl': 6, 'nota': 'Chiusa in ottobre.'},
        'pescatariano': 'n.a.',
        'sconto_studenti': 'Ridotto per studenti con tessera valida.',
        'perche': 'Sede del Muzeum Gdańska, vicino al Parco Oliwski.',
        'durata_min': 45,
        'fonti': [FONTE],
        'verificato': OGGI,
        'da_confermare': False,
        'descrizione': "L'unica fucina ad acqua di questo tipo rimasta: ha lavorato per circa 350 anni con l'acqua del torrente di Oliwa. "
                       "È stagionale, da aprile a settembre: a ottobre è chiusa.",
        'sito': EN + 'hammer-forge-at-oliwa/',
        'instagram': IG,
    },
]


def main():
    posti = json.loads(FILE.read_text(encoding='utf-8'))
    per_id = {p['id']: p for p in posti}
    for pid, mod in MODIFICHE.items():
        p = per_id[pid]
        p.update(mod)
        p['verificato'] = OGGI
        p.setdefault('da_confermare', False)
        if 'da_confermare' not in mod:
            p['da_confermare'] = False
        p['fonti'] = [FONTE] + [f for f in p.get('fonti', []) if not f.startswith('muzeumgdansk.pl')]
        p['instagram'] = IG
    for n in NUOVI:
        if n['id'] not in per_id:
            posti.append(n)
    FILE.write_text(json.dumps(posti, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('aggiornati', len(MODIFICHE), 'aggiunti', len(NUOVI), 'totale', len(posti))


if __name__ == '__main__':
    main()
