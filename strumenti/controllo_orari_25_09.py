# Controllo generale degli orari del 25/09/2026.
# Fonte preferita: il sito ufficiale del posto. Google Maps solo dove il sito
# non riporta gli orari, e allora la fonte e' scritta come "Google Maps".
# Si lancia una volta: python strumenti/controllo_orari_25_09.py
import json
from pathlib import Path

FILE = Path(__file__).resolve().parent.parent / 'contenuti' / 'posti.json'
OGGI = '2026-09-25'
GIORNI = ('lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom')


def o(**kw):
    """o(tutti='09-18', ven='09-22', dom=None) -> orari. None = chiuso."""
    base = kw.pop('tutti', None)
    out = {}
    for g in GIORNI:
        v = kw.get(g, base)
        if v is None:
            out[g] = []
        else:
            out[g] = [fascia(f) for f in v.split(',')]
    return out


def fascia(s):
    a, b = s.strip().split('-')
    fmt = lambda x: x if ':' in x else x + ':00'
    return [fmt(a).zfill(5), fmt(b).zfill(5)]


def sito(url):
    return 'sito ufficiale ' + url + ' (letto il 25/09/2026)'


GM = 'Google Maps (letto il 25/09/2026; il sito del locale non riporta gli orari)'

M = {
    # --- dal sito ufficiale ---
    'dobra-paczkarnia-gdansk': dict(orari=o(tutti='08-18'), orari_nota='Tutti i giorni 8-18; il sito avverte che l\'orario può variare di un\'ora.', fonte=sito('dobrapaczkarnia.pl')),
    'bar-turystyczny': dict(orari=o(tutti='08-18'), orari_nota='Tutti i giorni 8-18.', fonte=sito('bar-turystyczny.pl')),
    'bar-mleczny-stagiewna': dict(orari=o(tutti='09-18'), orari_nota='Tutti i giorni 9-18 (9-19 solo giugno-agosto).', fonte=sito('barstagiewna.pl')),
    'pomelo-bistro-bar': dict(orari=o(tutti='09-21', ven='09-22', sab='09-22'), orari_nota='Lun-gio e dom 9-21, ven-sab 9-22. Colazioni 9-13 (Google Maps).', fonte=sito('pomelogdansk.pl')),
    'rednek': dict(orari=o(tutti='12-22', ven='12-24', sab='12-24'), orari_nota='Sede di via Szeroka: lun-gio 12-22, ven-sab 12-24, dom 12-22.', fonte=sito('rednek.pl')),
    'treinta-y-tres': dict(orari=o(lun=None, mar='16-24', mer='16-24', gio='16-24', ven='16-24', sab='12-24', dom='13-18'), orari_nota='Lunedì chiuso; mar-ven 16-24; sabato 12-24; domenica 13-18.', fonte=sito('oliviastar.pl/restauracje/treinta-y-tres')),
    '100cznia': dict(orari=o(lun=None, mar='13-22', mer='13-22', gio='13-22', ven='13-02', sab='12-02', dom='12-22'), orari_nota='Lunedì chiuso; mar-gio 13-22; ven 13-02; sab 12-02; dom 12-22.', fonte=sito('100cznia.pl'), da_confermare=False),
    'targ-rybny': dict(orari=o(tutti='13-24'), orari_nota='Tutti i giorni 13-24.', fonte=sito('targrybny.pl'), da_confermare=False),
    'laka-bar': dict(orari=o(tutti='09-21', gio='09-22', ven='09-22', sab='09-22'), orari_nota='Lun-mer e dom 9-21; gio-sab 9-22.', fonte=sito('laka.bar'), da_confermare=False),
    'mimosa': dict(orari=o(tutti='07-18', sab='08-16', dom='08-16'), orari_nota='Sede di via Wajdeloty 17: lun-ven 7-18, sab-dom 8-16.', fonte=sito('mimosawypieki.pl'), da_confermare=False),
    'deja-vu': dict(orari=o(tutti='10-18', sab='10-20', dom='10-20'), orari_nota='Lun-ven 10-18, sab-dom 10-20. Biglietti solo sul posto, senza prenotazione.', fonte=sito('dejavumuzeum.pl'), da_confermare=False),
    'museo-seconda-guerra-mondiale': dict(
        orari=o(lun=None, mar='10-16', tutti='10-18'),
        orari_nota='Lunedì chiuso; martedì 10-16 gratis; mer-dom 10-18. Casse fino alle 17 (mar 14:30). Chiuso anche martedì 6/10.',
        prezzo={'normale_zl': 33, 'ridotto_zl': 23, 'nota': 'Ridotto per studenti fino a 26 anni: solo Alessia. Biglietto dell\'ultima mezz\'ora di cassa 17/12 zł. Audioguida 12 zł, anche in italiano. Online su bilety.muzeum1939.pl: una parte dei biglietti è venduta solo lì.'},
        fonte=sito('muzeum1939.pl'), da_confermare=False),
    'westerplatte': dict(
        indirizzo='Majora Henryka Sucharskiego 77 (centro visitatori)',
        orari=o(lun=None, mar='10-16', mer='10-18', gio='10-18', ven='10-18', sab='10-18', dom='13-19'),
        orari_nota='Orari del Muzeum Westerplatte (Museo della Seconda guerra mondiale): mostra nella Centrale elettrica e centro visitatori. '
                   'Lunedì chiuso; mar 10-16; mer-sab 10-18; dom 13-19. La Wartownia nr 1 del Muzeum Gdańska è chiusa in ottobre.',
        prezzo={'normale_zl': None, 'ridotto_zl': None, 'nota': 'Il prezzo della mostra nella Centrale elettrica non è scritto nella pagina dei prezzi: si compra su bilety.muzeum1939.pl.'},
        descrizione="La penisola dove il 1° settembre 1939 cominciò la Seconda guerra mondiale. Oltre al monumento e alle rovine, il Museo della "
                    "Seconda guerra mondiale ha aperto qui la mostra archeologica nella vecchia Centrale elettrica del deposito e un centro visitatori "
                    "con ristorante e caffè sul golfo. La Wartownia nr 1 del Muzeum Gdańska a ottobre è chiusa. C'è anche una crociera in battello dal centro, circa 100 minuti.",
        sito='https://www.muzeum1939.pl/en/visit-and-tickets/westerplatte-visit/opening-hours-8032',
        fonte=sito('muzeum1939.pl') + '; muzeumgdansk.pl', da_confermare=False),
    'europejskie-centrum-solidarnosci': dict(
        orari=o(lun='10-17', mar=None, mer='10-17', gio='10-17', ven='10-17', sab='10-18', dom='10-18'),
        orari_nota='Ottobre: mostra permanente lun e mer-ven 10-17, sab-dom 10-18; martedì chiusa. Terrazza panoramica sul tetto gratuita, se il tempo lo permette: lun-ven 10-17, sab-dom 10-20.',
        fonte=sito('ecs.gda.pl/en/plan-your-visit/opening-hours'), da_confermare=False),
    'zuraw': dict(
        orari=o(lun=None, mar='09-17', mer='13-17', tutti='09-17'),
        orari_nota='Lunedì chiuso; mar 9-17; mer 13-17 ingresso gratuito; gio-dom 9-17. Ultimo ingresso 60 minuti prima della chiusura.',
        prezzo={'normale_zl': 26, 'ridotto_zl': 19, 'nota': 'Listino indicato valido fino al 29/09/2026: in ottobre potrebbe cambiare.'},
        fonte=sito('nmm.pl/zuraw'), da_confermare=False),
    'hevelianum': dict(
        orari=o(lun=None, mar='08-16', mer='08-16', gio='08-16', ven='08-16', sab='10-18', dom='10-18'),
        orari_nota='Lunedì chiuso; mar-ven 8-16; sab-dom 10-18. Casse nelle Koszary Schronowe, accanto alla piazza del forte.',
        fonte=sito('hevelianum.pl/zaplanuj-wizyte-gora-gradowa'), da_confermare=False,
        prezzo_nota_extra=' Prezzo non ricontrollato il 25/09.'),
    'basilica-santa-maria': dict(
        indirizzo='Podkramarska 5',
        orari=o(tutti='08:30-17:30', dom='11-12,13-17:30'),
        orari_nota='Lun-sab 8:30-17:30; domenica 11-12 e 13-17:30. Non si visita durante le messe. Ogni giorno alle 11:57 lo spettacolo dell\'orologio astronomico (una volta al giorno).',
        fonte=sito('bazylikamariacka.gdansk.pl/bazylika/informacja-dla-turystow')),
    'torre-basilica-santa-maria': dict(
        orari={g: None for g in GIORNI},
        orari_nota='Il sito ufficiale indica "lun-dom 10-18 (luglio-agosto-settembre)" e "lun-dom 10-20", senza dire chiaramente l\'orario di ottobre. Chiusa con maltempo.',
        prezzo={'normale_zl': 20, 'ridotto_zl': 10, 'nota': 'Offerta ("cegiełka") per la manutenzione della basilica.'},
        fonte=sito('bazylikamariacka.gdansk.pl/bazylika/informacja-dla-turystow'), da_confermare=True),
    'nave-museo-blyskawica': dict(
        orari={g: [] for g in GIORNI},
        orari_nota='CHIUSA fino al 31/03/2027 (periodo invernale). Nella stessa zona è aperta la nave ORP Sokół, mar-dom 10-18.',
        descrizione="Il cacciatorpediniere Błyskawica, nave da guerra polacca della Seconda guerra mondiale, ormeggiato a Gdynia. È chiuso fino al 31 marzo 2027.",
        fonte=sito('muzeummw.pl'), da_confermare=False),
    'castello-di-malbork': dict(
        orari_nota='ATTENZIONE: il sito oggi pubblica solo l\'orario estivo (fino al 30/09: mar-dom 9-20, ultimo ingresso al percorso storico 16:30). '
                   'Quello di ottobre non è ancora pubblicato: gli orari qui sono della ricerca del 14/09, da ricontrollare prima di partire.',
        fonte=sito('zamek.malbork.pl/godziny-otwarcia'), da_confermare=True),
    # --- da Google Maps (il sito non riporta orari) ---
    'bar-leon': dict(orari=o(tutti='13-23', ven='13-01', sab='09-01', dom='09-23'), orari_nota='Colazione sab-dom 9-13.', fonte=GM),
    'omni-kaiser-patisserie': dict(orari=o(tutti='10-19', sab='10-20'), orari_nota='', fonte=GM),
    'umam-cukiernia-gdanska': dict(orari=o(tutti='08-20:30'), orari_nota='', fonte=GM),
    'kawiarnia-drukarnia': dict(orari=o(tutti='08-20', ven='08-21:30', sab='08-21:30'), orari_nota='', fonte=GM),
    'bar-neptun': dict(orari=o(tutti='09-18', sab='09-19', dom='09-19'), orari_nota='', fonte=GM, da_confermare=False),
    'akademicki-bar-mleczny': dict(orari=o(tutti='11-18', sab='11-17', dom=None), orari_nota='Domenica chiuso.', fonte=GM, da_confermare=False),
    'gdansk-sweet-factory-store': dict(indirizzo='Długa 30/31', orari=o(tutti='10-22'), orari_nota='', fonte=GM),
    'pierogarnia-mandu-srodmiescie': dict(orari=o(tutti='11-22'), fonte=GM),
    'restauracja-bazar': dict(orari=o(tutti='13-22', sab='12-22', dom='12-22'), orari_nota='', fonte=GM),
    'pijalnia-czekolady-e-wedel': dict(orari=o(tutti='10-22'), orari_nota='', fonte=GM),
    'under-beer': dict(orari=o(tutti='11-23', ven='11-01:30', sab='11-01:30'), orari_nota='', fonte=GM, da_confermare=False),
    'masna-micha': dict(indirizzo='Mariana Hemara 23', orari=o(tutti='09-18'), orari_nota='Sconto studenti 15% lun-ven 16-19 (raccolta locali del 14/09).', fonte=GM, da_confermare=False),
    'jaros': dict(nome='Bar Mleczny Jaros', indirizzo='Jagiellońska 38', orari=o(tutti='09-18', sab='10-17', dom=None), orari_nota='Domenica chiuso.', fonte=GM, da_confermare=False),
    'fala': dict(nome='Bar Mleczny Fala', orari=o(tutti='09-18', sab='10-17', dom=None), orari_nota='Domenica chiuso.', fonte=GM, da_confermare=False),
    'kebab-mim': dict(orari=o(tutti='00-24'), orari_nota='Aperto 24 ore su 24.', fonte=GM, da_confermare=False),
    'crackhouse': dict(indirizzo='Niterów 29b', orari=o(lun=None, mar=None, mer=None, gio=None, ven='22-24', sab='00-08,22-24', dom='00-08'), orari_nota='Solo venerdì e sabato notte, dalle 22 alle 8.', fonte=GM, da_confermare=False),
    'montownia': dict(orari=o(tutti='07-24', ven='07-02', sab='07-02'), orari_nota='Orario del food hall; i singoli banchi possono aprire più tardi.', fonte=GM, da_confermare=False),
    'gyozilla': dict(orari=o(tutti='12-21', ven='12-22', sab='13-22', dom='13-20'), orari_nota='', fonte=GM, da_confermare=False),
    'pyra-bar': dict(orari=o(tutti='11-21', ven='11-22', sab='11-22'), orari_nota='', fonte=GM, da_confermare=False),
    'faloviec': dict(orari=o(tutti='11-19', ven='11-20', sab='11-20'), orari_nota='Il sito indica il ritiro asporto fino alle 18:45 (ven-sab 19:45).', fonte=GM + '; faloviec.pl', da_confermare=False),
    'ambra-sky': dict(indirizzo='Ołowianka 1', orari=o(tutti='10:30-22', ven='10-24', sab='10-24', dom='10-22'), orari_nota='Orari di Google Maps; il sito ambersky.pl non li riporta.', fonte=GM, da_confermare=False),
    'molo-di-sopot': dict(indirizzo='Plac Zdrojowy 2, Sopot', orari=o(tutti='00-24'), orari_nota='Aperto 24 ore su 24 (Google Maps). Il biglietto d\'ingresso non è stato ricontrollato.', fonte=GM, da_confermare=True),
}

MANTIENI_NOTA = {'pierogarnia-mandu-srodmiescie'}


def main():
    posti = json.loads(FILE.read_text(encoding='utf-8'))
    per_id = {p['id']: p for p in posti}
    for pid, mod in M.items():
        p = per_id[pid]
        mod = dict(mod)
        fonte = mod.pop('fonte')
        extra = mod.pop('prezzo_nota_extra', '')
        if pid in MANTIENI_NOTA:
            mod.pop('orari_nota', None)
        p.update(mod)
        if extra and isinstance(p.get('prezzo'), dict):
            p['prezzo']['nota'] = (p['prezzo'].get('nota') or '') + extra
        p['fonti'] = [fonte] + [f for f in p.get('fonti', []) if f != fonte]
        p['verificato'] = OGGI
    FILE.write_text(json.dumps(posti, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('aggiornati', len(M))


if __name__ == '__main__':
    main()
