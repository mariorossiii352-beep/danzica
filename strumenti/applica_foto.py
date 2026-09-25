# Scrive in contenuti/posti.json le foto scelte a mano da Wikimedia Commons
# (strumenti/foto_commons.json: miniatura da 1000 px, autore, licenza, pagina).
# Tutte le licenze permettono il riuso citando l'autore: l'app lo mostra sotto la foto.
import json
from pathlib import Path
QUI = Path(__file__).resolve().parent
posti_f = QUI.parent / 'contenuti' / 'posti.json'
foto = json.loads((QUI / 'foto_commons.json').read_text(encoding='utf-8'))
posti = json.loads(posti_f.read_text(encoding='utf-8'))
n = 0
for p in posti:
    if p['id'] in foto:
        p['foto'] = foto[p['id']]; n += 1
    else:
        p.pop('foto', None)
posti_f.write_text(json.dumps(posti, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('foto su', n, 'posti')
