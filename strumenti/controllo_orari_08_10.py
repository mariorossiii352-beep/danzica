# Ricontrollo dell'8/10/2026, il giorno prima della partenza.
# Dal 1° ottobre molti musei sono passati all'orario invernale: qui ci sono
# gli orari e i prezzi letti oggi sui siti ufficiali, con la fonte scritta.
# Quello che non si trova resta com'era e lo si dice: niente orari indovinati.
# Si lancia una volta: python strumenti/controllo_orari_08_10.py
import json
from pathlib import Path

FILE = Path(__file__).resolve().parent.parent / 'contenuti' / 'posti.json'
OGGI = '2026-10-08'
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


MG = 'sito ufficiale muzeumgdansk.pl/wizyta-w-muzeum-gdanska/oddzialy (ricontrollato l\'8/10/2026: orario invernale)'
MG_ORARI = o(tutti='10-16', mar=None, gio='10-18')   # Ratusz, Artus, Uphagen, Przedbramie
NIEDZIELA = ('legge polacca sul divieto di commercio domenicale; calendario 2026 delle domeniche commerciali '
             'da wiadomoscihandlowe.pl e gazetaprawna.pl (letti l\'8/10/2026): in ottobre non ce ne sono')

M = {
    # --- Muzeum Gdańska: orario invernale ---
    'museo-ambra': dict(
        orari=o(tutti='10-18', mar=None),
        orari_nota='Lunedì 10-18 ingresso gratuito; martedì chiuso. Nei giorni a ingresso gratuito alcune mostre temporanee possono non essere visitabili. Biglietti fino a 60 minuti prima della chiusura. Non si prenota.',
        desc=[('Il lunedì dalle 12 alle 18 è gratuito.', 'Il lunedì (10-18) è gratuito.')],
        fonte=MG),
    'ratusz-glownego-miasta': dict(
        orari=MG_ORARI,
        orari_nota='Lunedì 10-16 ingresso gratuito; martedì chiuso; giovedì fino alle 18, gli altri giorni fino alle 16. Nei giorni a ingresso gratuito alcune mostre temporanee possono non essere visitabili. La torre panoramica è chiusa per lavori. Biglietti fino a 45 minuti prima della chiusura.',
        fonte=MG),
    'dwor-artusa': dict(
        orari=MG_ORARI,
        orari_nota='ATTENZIONE: venerdì 9/10 aperta solo fino alle 14; sabato 10/10 chiusa. Lunedì 10-16 ingresso gratuito; martedì chiusa. Nei giorni a ingresso gratuito alcune mostre temporanee possono non essere visitabili. Biglietti fino a 45 minuti prima della chiusura. Non si prenota.',
        desc=[('lunedì 12/10 è gratuita (12-18)', 'lunedì 12/10 è gratuita (10-16)')],
        fonte=MG),
    'dom-uphagena': dict(
        orari=MG_ORARI,
        orari_nota='Lunedì 10-16 ingresso gratuito; martedì chiuso. Nei giorni a ingresso gratuito alcune mostre temporanee possono non essere visitabili. Biglietti fino a 30 minuti prima della chiusura.',
        desc=[('Lunedì gratuita (12-18).', 'Lunedì gratuita (10-16).')],
        fonte=MG),
    'katownia-brama-wyzynna': dict(
        orari=MG_ORARI,
        orari_nota='Lunedì 10-16: aperta ma NON gratuita. Martedì chiusa. Biglietti alla cassa del negozio, ingresso dal cortile, fino a 45 minuti prima della chiusura.',
        fonte=MG),
    'poczta-polska': dict(
        orari=o(tutti='10-18'),
        orari_nota='Ha riaperto dopo la modernizzazione: tutti i giorni 10-18, lunedì ingresso gratuito. Biglietti fino a 30 minuti prima della chiusura.',
        prezzo={'normale_zl': 15, 'ridotto_zl': 10, 'nota': 'Ridotto per studenti con tessera valida. Pass 90 giorni per tutte le sedi: 160 zł, ridotto 110 zł.'},
        sconto_studenti='Ridotto per studenti con tessera valida.',
        desc=[('Riapre dopo la modernizzazione con una nuova mostra sui polacchi nella Città Libera di Danzica, visitabile dal 6 ottobre.',
               'Ha riaperto a ottobre 2026 dopo la modernizzazione, con una nuova mostra sui polacchi nella Città Libera di Danzica. Lunedì gratuito.')],
        da_confermare=False, fonte=MG),
    'twierdza-wisloujscie': dict(orari=o(tutti='10-16', mar=None), fonte=MG),
    'torre-santa-caterina': dict(fonte=MG + ': chiusa, stagionale aprile-settembre'),
    'kuznia-wodna': dict(fonte=MG + ': chiusa, stagionale aprile-settembre'),

    # --- Museo della Seconda guerra mondiale e Westerplatte ---
    'museo-seconda-guerra-mondiale': dict(
        orari_nota='Lunedì chiuso; martedì 10-16 gratis; mer-dom 10-18. Casse fino alle 17 (mar 14:30).',
        fonte='sito ufficiale muzeum1939.pl/wizyta/wizyta-miiws/godziny-otwarcia (ricontrollato l\'8/10/2026: orari uguali)'),
    'westerplatte': dict(
        orari=o(tutti='10-16', lun=None),
        orari_nota='Mostra nella Centrale elettrica ("Pamięć w ziemi zapisana. Archeologia Westerplatte"): lunedì chiusa, mar-dom 10-16. Centro visitatori tutti i giorni 9-16. Da febbraio 2026 ci sono lavori: via Sucharskiego è chiusa al traffico e nel cantiere non si entra. La Wartownia nr 1 del Muzeum Gdańska è chiusa in ottobre.',
        sito='https://www.muzeum1939.pl/wizyta/wizyta-westerplatte/godziny-otwarcia',
        fonte='sito ufficiale muzeum1939.pl/wizyta/wizyta-westerplatte/godziny-otwarcia (letto l\'8/10/2026)'),

    # --- altri musei ---
    'zuraw': dict(
        prezzo={'normale_zl': 23, 'ridotto_zl': 17, 'nota': 'Mercoledì ingresso gratuito. Listino valido fino al 31/12/2026.'},
        fonte='sito ufficiale nmm.pl/zuraw (ricontrollato l\'8/10/2026: orari uguali, prezzi nuovi)'),
    'museo-nazionale': dict(
        orari=o(tutti='10-17', lun=None),
        prezzo={'normale_zl': 25, 'ridotto_zl': 20, 'nota': 'Studenti dai 7 ai 26 anni: 1 zł (programma "Muzeum za 1 zł" del Ministero della Cultura, solo mostre permanenti): vale per Alessia. Martedì ingresso gratuito.'},
        sconto_studenti='Studenti dai 7 ai 26 anni: 1 zł.',
        fonte='sito ufficiale mng.gda.pl/lokalizacje/oddzial-sztuki-dawnej (letto l\'8/10/2026); elenco dei musei "Muzeum za 1 zł" su gov.pl'),
    'europejskie-centrum-solidarnosci': dict(
        fonte='sito ufficiale ecs.gda.pl/en/plan-your-visit/opening-hours (ricontrollato l\'8/10/2026: orari uguali, nessuna chiusura dal 9 al 12/10)'),
    'hevelianum': dict(
        fonte='sito ufficiale hevelianum.pl/zaplanuj-wizyte-gora-gradowa (ricontrollato l\'8/10/2026: orari uguali)'),
    'deja-vu': dict(fonte='sito ufficiale dejavumuzeum.pl (ricontrollato l\'8/10/2026: orari uguali)'),
    'nave-museo-blyskawica': dict(
        orari_nota='CHIUSA fino al 31/03/2027 (periodo invernale). Nella stessa zona è aperto il sottomarino ORP Sokół, mar-dom 10-16 (10 persone alla volta, visita di 15 minuti).',
        fonte='sito ufficiale muzeummw.pl/cennik-i-godziny-otwarcia (letto l\'8/10/2026)'),
    'castello-di-malbork': dict(
        orari=o(tutti='09-16'),
        orari_nota='Orario dal 1/10/2026 al 25/4/2027. Mar-dom: percorso storico completo 9-16, ultimo ingresso 12:45; interni e mostre chiudono alle 15. Percorso esterno mar-dom dalle 13:30 alle 16 (la pagina degli orari dice dalle 13:00), ultimo ingresso 14:30. Lunedì: solo il percorso esterno, 9-16, ultimo ingresso 14:30, gratis con biglietto da ritirare in cassa (non online). Massimo 500 ingressi l\'ora: conviene comprare online.',
        prezzo={'normale_zl': 80, 'ridotto_zl': 60, 'nota': 'Percorso storico completo, con guida in polacco o audioguida inclusa (anche in italiano). Percorso esterno 35 zł, ridotto 25. "Muzeum za 1 zł": dal 1/10 al 31/12/2026 chi ha dagli 8 ai 26 anni entra con 1 zł mostrando una tessera scolastica o universitaria valida, quindi Alessia. Si sceglie il biglietto "Muzeum za złotówkę" su bilety.zamek.malbork.pl o in cassa.'},
        sconto_studenti='1 zł dagli 8 ai 26 anni con tessera scolastica o universitaria (fino al 31/12/2026).',
        da_confermare=False,
        fonte='sito ufficiale zamek.malbork.pl: godziny-otwarcia, wizyta/bilety e notizia "Muzeum za 1zł od października" (letti l\'8/10/2026)'),

    # --- chiese, viste, Olivia Star ---
    'basilica-santa-maria': dict(fonte='sito ufficiale bazylikamariacka.gdansk.pl/bazylika/informacja-dla-turystow (ricontrollato l\'8/10/2026: testo invariato)'),
    'torre-basilica-santa-maria': dict(fonte='sito ufficiale bazylikamariacka.gdansk.pl/bazylika/informacja-dla-turystow (ricontrollato l\'8/10/2026: testo invariato, l\'orario di ottobre resta poco chiaro)'),
    'olivia-star-top': dict(
        orari=o(tutti='12-22', ven='12-01', sab='11-23', dom='11-20'),
        orari_nota='Lun-gio 12-22, ven 12-01, sab 11-23, dom 11-20. Ultimo ingresso 1 ora e 20 minuti prima della chiusura (sabato 10/10: entro le 21:40).',
        fonte='sito ufficiale oliviastar.pl/pietro-widokowe (letto l\'8/10/2026: il sabato ora chiude alle 23)'),
    'treinta-y-tres': dict(
        orari_nota='Lunedì chiuso; mar-ven 16-24; sabato 12-24; domenica 13-18. Telefono: +48 731 334 332.',
        fonte='sito ufficiale oliviastar.pl/restauracje/treinta-y-tres (ricontrollato l\'8/10/2026: orari uguali)'),
    'pierogarnia-stary-mlyn': dict(
        orari_nota='Il sito ufficiale scrive solo "aperti tutti i giorni dalle 8:03", senza l\'ora di chiusura. Il pranzo del 10 è prenotato 12:30-14:30. Telefono: 58 727 71 14. Servizio lento: tenere margine.',
        fonte='sito ufficiale pierogarnie.com/restauracje/stary-mlyn-gdansk (letto l\'8/10/2026: apertura dalle 8:03, chiusura non scritta)'),

    # --- Sopot ---
    'molo-di-sopot': dict(
        orari_nota='Il molo è sempre aperto (Google Maps). Biglietto 2026: 10 zł nella stagione a pagamento cominciata il 10/4. Quando finisce la stagione 2026 non è scritto in nessuna fonte che ho trovato (nel 2025 si pagava fino al 30/9): chiedere alla cassa.',
        prezzo={'normale_zl': 10, 'ridotto_zl': None, 'nota': 'Prezzo della stagione a pagamento 2026; in ottobre non è confermato che si paghi.'},
        sito='',
        fonte='gazetaprawna.pl (prezzi 2026) e rmf24.pl (stagione 2025), letti l\'8/10/2026; il sito molo.sopot.pl rimanda a una pagina del MOSiR senza informazioni sul molo'),
    'sopot-centrum': dict(
        eccezioni={'2026-10-11': []},
        orari_nota='Tutti i giorni 9-20 secondo Google Maps. ATTENZIONE: domenica 11/10 in Polonia è una domenica senza commercio: i negozi restano chiusi per legge, possono restare aperti ristoranti e bar.',
        sito='',
        fonte=NIEDZIELA + '; il sito sopotcentrum.com.pl non esiste più'),
    'gdansk-sweet-factory-store': dict(
        eccezioni={'2026-10-11': []},
        orari_nota='Domenica 11/10 è una domenica senza commercio: per legge i negozi restano chiusi, salvo eccezioni (per esempio se al banco c\'è il titolare). Google Maps indica comunque 10-22: verificare sul posto.',
        fonte=NIEDZIELA),
    'krzywy-domek': dict(
        orari_nota='L\'edificio (negozi e locali) è aperto 8-23; la facciata si vede sempre dalla strada. Domenica 11/10 (senza commercio) i negozi dentro sono chiusi per legge, i locali possono restare aperti.',
        fonte='Google Maps (letto il 28/09/2026; il sito ufficiale non riporta gli orari); ' + NIEDZIELA),

    # --- siti che non rispondono piu' (8/10/2026): tolgo il link ---
    'restauracja-bazar': dict(sito='', fonte_extra='il sito restauracjabazar.pl l\'8/10/2026 non risponde: link tolto'),
    'bar-mleczny-stagiewna': dict(sito='', fonte_extra='il sito barstagiewna.pl l\'8/10/2026 non risponde: link tolto'),
    'oliwski-park': dict(sito='', fonte_extra='il sito parkoliwski.gdansk.pl l\'8/10/2026 risponde "pagina non trovata": link tolto'),
}


def main():
    posti = json.loads(FILE.read_text(encoding='utf-8'))
    per_id = {p['id']: p for p in posti}
    for pid, mod in M.items():
        p = per_id[pid]
        mod = dict(mod)
        for vecchio, nuovo in mod.pop('desc', []):
            assert vecchio in (p.get('descrizione') or ''), (pid, vecchio)
            p['descrizione'] = p['descrizione'].replace(vecchio, nuovo)
        extra = mod.pop('fonte_extra', None)
        fonte = mod.pop('fonte', None)
        p.update(mod)
        if fonte:
            p['fonti'] = [fonte] + [f for f in p.get('fonti', []) if f != fonte]
            p['verificato'] = OGGI
        if extra:
            p['fonti'] = p.get('fonti', []) + [extra]
    FILE.write_text(json.dumps(posti, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('aggiornati', len(M))


if __name__ == '__main__':
    main()
