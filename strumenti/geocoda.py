# Riempie lat/lng in contenuti/posti.json usando Nominatim (OpenStreetMap, senza chiave).
# Una richiesta al secondo, come chiede la loro politica d'uso.
# I risultati fuori dall'area di Danzica vengono segnalati, non scritti.
import json, time, urllib.parse, urllib.request, io, sys, os

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FILE = os.path.join(BASE, 'contenuti', 'posti.json')
UA = 'danzica-app/1.0 (uso personale, viaggio ottobre 2026)'
# riquadro largo: Danzica, Sopot, Gdynia, Malbork
BOX = (18.1, 53.9, 19.4, 54.7)  # lon_min, lat_min, lon_max, lat_max


def cerca(q, viewbox=True):
    p = {'q': q, 'format': 'json', 'limit': '1', 'addressdetails': '0'}
    if viewbox:
        p['viewbox'] = '%s,%s,%s,%s' % (BOX[0], BOX[3], BOX[2], BOX[1])
        p['bounded'] = '1'
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(p)
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.load(r)
    time.sleep(1.1)
    if not d:
        return None
    return float(d[0]['lat']), float(d[0]['lon']), d[0].get('display_name', '')


def main():
    posti = json.load(io.open(FILE, encoding='utf-8'))
    mancanti, trovati = [], 0
    for p in posti:
        if p.get('lat') and p.get('lng'):
            continue
        tentativi = []
        ind = (p.get('indirizzo') or '').strip()
        if ind:
            tentativi.append(ind + ', Gdansk, Polska')
        tentativi.append(p['nome'] + ', Gdansk, Polska')
        tentativi.append(p['nome'] + ', ' + (p.get('zona') or '') + ', Polska')
        ris = None
        for q in tentativi:
            try:
                ris = cerca(q)
            except Exception as e:
                print('errore', p['id'], e)
                ris = None
            if ris:
                break
        if not ris:
            mancanti.append(p['id'])
            print('MANCA   ', p['id'])
            continue
        lat, lon, nome = ris
        p['lat'], p['lng'] = round(lat, 6), round(lon, 6)
        trovati += 1
        print('ok      ', p['id'], p['lat'], p['lng'], '|', nome[:70])
    json.dump(posti, io.open(FILE, 'w', encoding='utf-8', newline='\n'),
              ensure_ascii=False, indent=1)
    print('\nTrovati %d, mancanti %d: %s' % (trovati, len(mancanti), ', '.join(mancanti)))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
