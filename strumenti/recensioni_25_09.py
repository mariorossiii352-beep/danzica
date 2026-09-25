# Voto, numero di recensioni e riassunto delle recensioni di Google Maps,
# letti il 25-26/09/2026 (vista pubblica senza accesso: le recensioni "più
# pertinenti" e i temi più citati). I riassunti sono scritti da Claude con
# parole proprie: il testo delle recensioni non si copia.
# Si lancia: python strumenti/recensioni_25_09.py  -> contenuti/posti.json
import json
from pathlib import Path

FILE = Path(__file__).resolve().parent.parent / 'contenuti' / 'posti.json'
DATA = '2026-09-26'

R = {
    # --- cibo e dolci ---
    'pierogarnia-stary-mlyn': (4.6, 16994, 'Il posto più amato per i pierogi in centro: molti ci tornano più volte nello stesso viaggio. Lodati i pierogi al forno, fritti e dolci, lo żurek e l\'ambiente caratteristico; lo staff è descritto come simpatico.', ['pierogi al forno', 'żurek', 'frittelle di patate', 'bigos']),
    'pierogarnia-mandu-srodmiescie': (4.8, 17352, 'Voto altissimo su moltissime recensioni: i pierogi sono il motivo per andarci, con ripieni anche insoliti (cinghiale, chorizo). Il tema più citato dopo i pierogi è la coda (oltre 200 recensioni ne parlano).', ['pierogi', 'limonata', 'żurek', 'lamponi']),
    'restauracja-bazar': (4.7, 3017, 'Cucina polacca tradizionale ma curata, con piatti ben presentati. Consigliati cinghiale, bigos, żurek e zuppa di pesce; servizio gentile. Locale piccolo, a volte strapieno.', ['cinghiale', 'bigos', 'zuppa di pesce', 'aringa']),
    'bar-leon': (4.5, 1475, 'Piccoli piatti da condividere di ispirazione mediorientale, con menu che cambia spesso. La feta al forno con miele è il piatto più nominato; ottimi anche i cocktail. Via turistica e rumore alto la sera. Spesa indicata 60-100 zł a persona.', ['feta al forno con miele', 'hummus', 'cocktail']),
    'bar-turystyczny': (4.4, 9903, 'Bar mleczny (mensa economica polacca) in pieno centro: piatti casalinghi abbondanti a prezzi molto bassi. Attenzione alla coda all\'ora di pranzo e al servizio sbrigativo. È un self service: si ordina al banco.', ['piatti del giorno', 'zuppe', 'cotoletta']),
    'bar-mleczny-stagiewna': (4.2, 5431, 'Bar mleczny vicino al fiume, self service con vassoi. Economico, frequentato anche da turisti, con menu tradotto. Citati lo stroganoff di manzo e le uova strapazzate a colazione; a volte c\'è coda.', ['stroganoff', 'uova strapazzate']),
    'bar-neptun': (3.4, 3480, 'Bar mleczny in via Długa, economico e centralissimo. Il voto è basso: chi lo apprezza parla di cucina genuina a prezzi bassi, chi no di menu solo in polacco e poca pazienza al banco.', ['gulasch', 'frittelle di patate']),
    'akademicki-bar-mleczny': (4.4, 2080, 'Mensa economica vicino all\'università, frequentata da studenti: porzioni grandi e prezzi bassi. Lodati gli involtini di cavolo e il kompot. Ci sono scale fra cassa e sala.', ['involtini di cavolo (gołąbki)', 'kompot']),
    'jaros': (4.7, 5264, 'Bar mleczny fuori dal centro molto amato dai residenti: cibo buono, abbondante ed economico, anche i dolci. Molto affollato a pranzo, con code lunghe ma veloci.', ['pierogi', 'cotoletta', 'cheesecake']),
    'fala': (4.5, 1526, 'Piccolo bar mleczny di quartiere con clienti abituali: cucina polacca casalinga, porzioni abbondanti, servizio cordiale. Pranzo con zuppa, piatto e insalata sui 26-29 zł.', ['pierogi russi', 'piatto del giorno']),
    'pyra-bar': (4.5, 9418, 'Tutto a base di patate: casseruole gratinate, frittelle e altre ricette, porzioni abbondanti e prezzi onesti. Si ordina al banco (c\'è spesso coda): meglio occupare prima il tavolo.', ['casseruola di patate', 'patate con salmone', 'frittelle di patate']),
    'pomelo-bistro-bar': (4.6, 5684, 'Bistrot molto apprezzato per colazione e brunch: uova alla Benedict, shakshuka, bagel e pane fatto in casa. La sera cucina polacca curata (zuppe, aringa). Personale lodato per gentilezza.', ['uova alla Benedict', 'shakshuka', 'zuppa di pesce']),
    'rednek': (4.7, None, '(Descrizione dal sito del locale: le recensioni non si sono caricate.) Burger con pulled pork e zapiekanki (baguette gratinate) lunghe mezzo metro, birre artigianali, musica country e arredamento fai da te. Ci sono opzioni vegetariane.', ['burger pulled pork', 'zapiekanka']),
    'treinta-y-tres': (4.5, 784, 'Ristorante spagnolo raffinato al 33° piano con vista sul golfo: piatti curati, buona carta dei vini e dessert lodati. La vista è il punto forte; qualche recensione segnala un servizio non sempre all\'altezza; una indica 180-200 zł a persona.', ['dessert', 'tapas', 'vini']),
    'slony-spichlerz': (4.6, 5873, 'Food hall sul fiume con una decina di cucine diverse (ramen, pizza, messicano, thai, greco): ognuno sceglie il suo piatto e le bevande arrivano al tavolo. Comodo per cene varie a prezzi onesti.', ['ramen', 'pizza', 'cocktail']),
    'montownia': (4.7, 6501, 'Grande food hall nel vecchio cantiere navale: molte cucine (ramen, thai, georgiana, fish and chips) e atmosfera giovane, a volte con concerti. Prezzi medi 20-40 zł a persona.', ['ramen', 'cucina georgiana', 'fish and chips']),
    '100cznia': (4.8, 10519, 'Zona di container colorati nell\'ex cantiere navale: food truck di cucine diverse, sdraio sulla sabbia, street art, DJ e concerti. A 15-20 minuti a piedi dal centro. Più una serata che un ristorante.', ['food truck', 'birra']),
    'gyozilla': (4.8, 5602, 'Ramen giapponese fuori dal centro con voto altissimo: brodo tonkotsu e ramen di manzo lodatissimi, gyoza e opzioni vegane. Locale piccolo: si aspetta, e qualcuno segnala servizio lento.', ['tonkotsu ramen', 'ramen di manzo', 'gyoza']),
    'laka-bar': (4.7, 4765, 'Bistrot fusion con molte opzioni vegane e un interno curato. Citati pollo al latticello con waffle, udon, pad thai e caffè vietnamita.', ['chicken and waffles', 'udon', 'caffè vietnamita']),
    'targ-rybny': (4.4, 1725, 'Ristorante di pesce sul fiume con veranda: fish and chips, bouillabaisse, astice, halibut e aringa. Qualità buona, prezzi considerati corretti.', ['fish and chips', 'bouillabaisse', 'aringa']),
    'masna-micha': (4.5, 1505, 'Bowl, zuppe e wrap, anche vegetariani e vegani, a prezzi bassi. Molti ordinano da asporto; qualche recensione recente lamenta porzioni e qualità incostanti.', ['bowl', 'zuppa']),
    'faloviec': (4.7, 2610, 'Cucina vegetale (vegana) apprezzata anche da chi mangia carne: porzioni grandi, zuppe e limonate lodate, birra propria. Alcuni trovano i prezzi saliti.', ['pad thai', 'zuppa', 'falafel']),
    'kebab-mim': (3.9, 1973, 'Kebab e shawarma aperto 24 ore, porzioni grandi e prezzi bassi. Voto nella media: utile per mangiare tardi, non una meta.', ['shawarma']),
    'kawiarnia-drukarnia': (4.7, 5478, 'Caffè specialty in via Mariacka con tavolini sulla via: croissant famosissimi, flat white, chai latte, bagel e torte, opzioni vegane. Interno piccolo, spesso pieno.', ['croissant', 'flat white', 'granola bowl']),
    'omni-kaiser-patisserie': (4.5, 794, 'Pasticceria di stile francese sul lungofiume, su più piani con vetrate sull\'acqua. Croissant e cruffin alla vaniglia molto lodati; prezzi un po\' sopra la media.', ['cruffin', 'croissant', 'cappuccino']),
    'umam-cukiernia-gdanska': (4.5, 1581, 'Pasticceria artigianale con dolci grandi e croissant burrosi; molto lodato il cruffin alla vaniglia, buoni anche i dolci al pistacchio e ai lamponi. Locale piccolo con pochi posti. Due dolci e due caffè sui 50-60 zł.', ['cruffin', 'croissant', 'dolci al pistacchio']),
    'dobra-paczkarnia-gdansk': (4.6, 1346, 'I pączki (bomboloni polacchi) appena fatti, ben farciti, con gusti classici e nuovi: rosa, ciliegia, caramello, pistacchio. Da asporto, economici (sotto i 20 zł).', ['pączki alla rosa', 'pączki al pistacchio']),
    'pijalnia-czekolady-e-wedel': (4.1, 3207, 'Sala della cioccolata E.Wedel sul fiume: la cioccolata calda è il motivo per andarci. Diverse recensioni lamentano servizio lento e poca accoglienza.', ['cioccolata calda', 'cheesecake']),
    'gdansk-sweet-factory-store': (4.4, 414, 'Negozio di caramelle a peso con scelta enorme, divertente con bambini. Prezzi alti; qualcuno ha trovato prodotti non freschissimi.', []),
    'mimosa': (4.7, 139, 'Panetteria e pasticceria artigianale con caffè: pane e dolci molto apprezzati, servizio cordiale. Poche recensioni perché aperta da poco.', ['pane artigianale', 'dolci']),
    'under-beer': (4.6, 1856, 'Pub di birre artigianali in una via laterale del centro: grande scelta, i baristi aiutano a scegliere. Buone anche pizza e snack; la pizza "Roulette russa" è molto piccante. Bagno piccolo.', ['birre artigianali', 'pizza']),
    'crackhouse': (4.0, 538, 'Club techno nell\'ex cantiere navale, aperto solo venerdì e sabato notte. Recensioni divise: musica e atmosfera lodate, ma diverse lamentele sui buttafuori e sul prezzo d\'ingresso che varia (40-60 zł).', ['techno']),
    # --- musei e attrazioni ---
    'museo-seconda-guerra-mondiale': (4.8, 53988, 'Considerato uno dei musei più belli e coinvolgenti visitati: percorso chiaro, ricostruzioni e testimonianze toccanti. L\'audioguida (anche in italiano) parte da sola stanza per stanza. Chi lo consiglia dice di dedicargli qualche ora; la coda è citata spesso.', ['audioguida', 'ricostruzioni']),
    'europejskie-centrum-solidarnosci': (4.8, 10334, 'Museo moderno e coinvolgente sulla storia di Solidarność e della fine del comunismo. L\'audioguida è inclusa e parte da sola in ogni sala. Da non perdere anche la terrazza sul tetto.', ['audioguida', 'cantiere navale']),
    'museo-ambra': (4.7, 12505, 'Museo nel vecchio mulino in mattoni: ambra grezza e lavorata, gioielli, insetti intrappolati nella resina, sezioni interattive. Gratis il lunedì, e molti lo citano per questo.', ['insetti nell\'ambra', 'gioielli']),
    'ratusz-glownego-miasta': (4.6, 2218, 'Sale storiche del Municipio con soffitti dipinti e arredi; racconta la storia della città. Molte recensioni parlano della torre, ma ora è chiusa per lavori.', ['soffitti dipinti']),
    'dwor-artusa': (4.6, 2527, 'Grande sala gotica con modelli di velieri appesi, statue e la stufa in maiolica più grande d\'Europa. Meno affollato di altri musei e molto apprezzato da chi entra.', ['stufa in maiolica', 'modelli di navi']),
    'dom-uphagena': (4.3, 1300, 'Casa di un mercante del Settecento con interni ricostruiti e arredati. Piacevole ma piccola: poche stanze e poche spiegazioni. Visita breve.', ['interni del Settecento']),
    'katownia-brama-wyzynna': (4.6, 550, 'Museo nella vecchia prigione e sala delle torture, con mostre sulla giustizia medievale. La vista dalla torre è molto lodata. Poco affollato; testi soprattutto in inglese e polacco.', ['vista dalla torre']),
    'torre-santa-caterina': (4.6, 301, 'Museo degli orologi da torre con salita panoramica: meccanismi antichi e il pendolo più lungo del mondo. A ottobre è chiuso.', []),
    'poczta-polska': (4.5, 1401, 'Luogo della memoria del 1° settembre 1939, molto toccante, soprattutto il cortile delle esecuzioni. Riapre a ottobre con una mostra nuova.', []),
    'westerplatte': (4.7, 28139, 'Il luogo dove iniziò la Seconda guerra mondiale: grande area verde con monumento e rovine, ingresso libero. Si arriva in autobus o in battello. Qualcuno avrebbe voluto più spiegazioni sul posto.', ['monumento', 'battello']),
    'twierdza-wisloujscie': (4.6, 4960, 'Fortezza alla foce della Vistola con torre panoramica. Lodata per la storia e la vista, ma alcuni hanno trovato la cassa già chiusa prima dell\'orario indicato. Dalla fermata c\'è da camminare.', ['torre', 'vista']),
    'museo-nazionale': (4.5, 2840, 'Museo nell\'ex monastero francescano, suggestivo di per sé. Il Giudizio universale di Memling è l\'opera più famosa, ma nel 2026 non è esposto: senza, alcuni lo trovano poca cosa.', ['Memling (non esposto nel 2026)', 'dipinti']),
    'zuraw': (4.8, 1891, 'La gru medievale in legno simbolo della città, sul lungofiume: dentro si vede il meccanismo con le grandi ruote azionate a piedi. Visita breve e molto apprezzata.', ['ruote di legno', 'lungofiume']),
    'hevelianum': (4.5, 1931, 'Centro della scienza interattivo in un forte sulla collina Góra Gradowa, pensato soprattutto per bambini e ragazzi. Nei giorni affollati gli ingressi finiscono: meglio prenotare.', ['esperimenti', 'vista dalla collina']),
    'deja-vu': (4.6, 7880, 'Museo delle illusioni ottiche piccolo ma divertente, con molte foto da fare. Si visita in meno di un\'ora; qualcuno lo trova caro per la durata.', ['illusioni', 'foto']),
    'basilica-santa-maria': (4.7, 20992, 'Enorme chiesa gotica in mattoni, una delle più grandi al mondo: organo, orologio astronomico e molte opere. Da non perdere la salita alla torre.', ['orologio astronomico', 'organo']),
    'torre-basilica-santa-maria': (4.7, 613, 'Circa 400 gradini: la prima parte su una scala a chiocciola stretta e ripida, poi il panorama su tutta la città. Terrazza piccola e affollata; sconsigliata a chi soffre di claustrofobia.', ['panorama']),
    'basilica-santa-brigida': (4.7, 2497, 'Chiesa legata a Solidarność con l\'altare d\'ambra unico al mondo, ancora in lavorazione, e una cripta. Poco citata dalle guide ma molto apprezzata da chi la visita.', ['altare d\'ambra', 'cripta']),
    'olivia-star-top': (4.6, 7907, 'Terrazza panoramica al 32° piano con giardino di ulivi, pizza e cocktail. La maggior parte ne è entusiasta; una minoranza trova la vista meno speciale del previsto.', ['vista', 'cocktail', 'pizza']),
    'ambra-sky': (4.6, 22904, 'Ruota panoramica sull\'isola Ołowianka, con cabine climatizzate e musica; bella soprattutto al tramonto e la sera. Alcuni la trovano veloce, con troppi giri.', ['tramonto', 'vista']),
    'gora-gradowa': (4.8, 8213, 'Collina a pochi minuti dalla stazione con la vista migliore sulla città vecchia, gratis. Bellissima al tramonto.', ['vista', 'tramonto']),
    'fontana-nettuno': (4.8, 44056, 'La fontana in bronzo del Seicento simbolo della città, sul Długi Targ. Molto romantica la sera; sempre affollata.', []),
    'porta-doro': (4.7, 13254, 'Porta seicentesca con decorazioni dorate: da qui inizia la Via Reale verso il centro.', []),
    'porta-verde': (4.7, 2060, 'Porta rinascimentale fra il Długi Targ e il fiume, molto fotografata, soprattutto con la luce del mattino.', []),
    'mariacka': (4.9, 858, 'La via più suggestiva della città: lastricata, con le terrazze delle case, negozi d\'ambra e caffè. Sembra un set cinematografico.', ['negozi d\'ambra']),
    'dluga': (4.8, 16603, 'Il cuore della città: la piazza e la via lunga con facciate colorate, caffè, musicisti di strada. Sempre piena di gente, a tutte le ore.', []),
    'piwna': (4.8, 153, 'Via pedonale fra la Basilica e la Grande Armeria, piena di bar per birra e drink. Tranquilla la mattina.', []),
    'ponte-dei-lucchetti': (4.7, 3032, 'Piccolo ponte sui canali vicino al Museo dell\'ambra, con lucchetti degli innamorati e la casetta che si riflette nell\'acqua: un posto da foto.', []),
    'castello-di-malbork': (4.8, 85432, 'Il castello in mattoni più grande del mondo: entusiasmo quasi unanime. L\'audioguida con GPS parte da sola; la visita completa richiede diverse ore. Il lunedì solo il percorso esterno, gratis.', ['audioguida', 'lunedì gratis all\'esterno']),
    'molo-di-sopot': (4.6, 127853, 'Il molo in legno più lungo d\'Europa (511 m): bella passeggiata sul mare. L\'ingresso è a pagamento, con biglietto alle macchinette; il prezzo di ottobre non l\'ho verificato.', ['passeggiata sul mare']),
    'nave-museo-blyskawica': (4.7, 8926, 'Cacciatorpediniere della Seconda guerra mondiale visitabile dentro e fuori, ben tenuto. Ora però è chiuso fino al 31/03/2027.', []),
    'oliwski-park': (4.8, 36777, 'Grande parco curatissimo accanto alla Cattedrale di Oliwa: cascate, anatre, giardino giapponese e serra delle palme. L\'organo della cattedrale accanto è tra i temi più citati.', ['giardino giapponese', 'cattedrale']),
    'krzywy-domek': (4.3, 13735, 'La "casa storta" di Sopot, sulla via principale: si guarda da fuori e si fa la foto; dentro c\'è un piccolo centro commerciale. Gli alberi davanti coprono un po\' la vista.', []),
    'filharmonia': (4.8, 7137, 'Sala da concerto in una ex centrale elettrica sull\'isola Ołowianka, con acustica molto lodata. Programma dei concerti sul sito della Filharmonia.', []),
    'sopot-centrum': (4.4, 7011, 'Centro commerciale alla stazione di Sopot: comodo per una pausa, non una meta.', []),
    'kuznia-wodna': (4.5, 356, 'Fucina ad acqua storica con dimostrazioni di forgiatura, interessante soprattutto per chi ama la tecnica. A ottobre è chiusa.', []),
}
# stessi dati del food hall
R['neon'] = R['slony-spichlerz']
R['amito-ramen-sushi'] = R['slony-spichlerz']


def main():
    posti = json.loads(FILE.read_text(encoding='utf-8'))
    n = 0
    for p in posti:
        r = R.get(p['id'])
        if not r:
            continue
        voto, num, testo, piatti = r
        p['recensioni'] = {
            'voto': voto, 'numero': num, 'riassunto': testo,
            'da_provare': piatti, 'fonte': 'Google Maps', 'letto': DATA,
        }
        n += 1
    FILE.write_text(json.dumps(posti, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('recensioni su', n, 'posti')


if __name__ == '__main__':
    main()
