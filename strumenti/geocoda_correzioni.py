# Seconda passata: query mirate per i posti che Nominatim non aveva trovato
# o aveva sbagliato (omonimie, filiali della stessa catena).
import json, io, os, sys
from geocoda import cerca, FILE

# id -> query mirata, oppure None se il posto non ha una posizione singola
MIRATE = {
    'gdansk-sweet-factory-store': 'Długa 32, Gdańsk',
    'pierogarnia-stary-mlyn': 'Świętego Ducha 64, Gdańsk',
    'basilica-santa-maria': 'Bazylika Mariacka, Gdańsk',
    'torre-basilica-santa-maria': 'Bazylika Mariacka, Gdańsk',
    'basilica-santa-brigida': 'Bazylika św. Brygidy, Gdańsk',
    'olivia-star-top': 'Olivia Star, Aleja Grunwaldzka 472, Gdańsk',
    'porta-verde': 'Brama Zielona, Gdańsk',
    'ponte-dei-lucchetti': 'Wyspa Młyńska, Gdańsk',
    'nave-museo-blyskawica': 'ORP Błyskawica, Gdynia',
    'dom-mlynarza': 'Dom Młynarza, Wyspa Młyńska, Gdańsk',
    'poczta-polska': 'Plac Obrońców Poczty Polskiej, Gdańsk',
    'westerplatte': 'Pomnik Obrońców Wybrzeża, Westerplatte, Gdańsk',
    'umam-cukiernia-gdanska': 'Grobla II, Gdańsk',
    'castello-di-malbork': 'Zamek w Malborku, Malbork',
    'sopot': 'Monte Cassino, Sopot',
    'pamiatki-gdanskie': 'Mariacka, Gdańsk',
    'dawid-ambra': 'Mariacka 13, Gdańsk',
    # senza posizione singola o non identificabili: restano vuoti
    'zabka': None,
    'under-beer': None,
    'scritta-neon-gdansk': None,
    'albero-del-millennio': None,
    'fala': None,
}


def main():
    posti = json.load(io.open(FILE, encoding='utf-8'))
    for p in posti:
        if p['id'] not in MIRATE:
            continue
        q = MIRATE[p['id']]
        if q is None:
            p['lat'], p['lng'] = None, None
            p['da_confermare'] = True
            print('vuoto   ', p['id'])
            continue
        try:
            r = cerca(q, viewbox=False)
        except Exception as e:
            print('errore  ', p['id'], e)
            continue
        if not r:
            print('MANCA   ', p['id'], '|', q)
            continue
        lat, lon, nome = r
        p['lat'], p['lng'] = round(lat, 6), round(lon, 6)
        print('ok      ', p['id'], p['lat'], p['lng'], '|', nome[:70])
    json.dump(posti, io.open(FILE, 'w', encoding='utf-8', newline='\n'),
              ensure_ascii=False, indent=1)
    vuoti = [p['id'] for p in posti if not p.get('lat')]
    print('\nSenza coordinate: %d -> %s' % (len(vuoti), ', '.join(vuoti)))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
