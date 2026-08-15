# De projectensite (zakmonsters.nl)

De publieke etalage: een korte uitleg over wie we zijn, en per project een pagina met de
status en de patches. Los van de vertaaleditor (`vertalen.zakmonsters.nl`), zodat een
bezoeker niet hoeft in te loggen.

**Alle inhoud staat in `content/`.** Dat zijn gewone tekstbestanden — je past ze aan met
elke editor en ververst de pagina. Geen bouwstap, geen deploy.

## Wat staat waar?

```
site/
  content/site.json              ← titel, introtekst, projectvolgorde, voettekst
  content/projecten/<naam>.md    ← één bestand per project
  content/teasers/               ← de grote plaatjes voor de knoppen
  content/pokedex/               ← de Pokédex-gegevens (gemaakt, niet met de hand bewerken)
  content/sprites/               ← de sprite-atlassen bij die Pokédex (idem)
  content/voorwerpen/            ← de voorwerpgegevens (idem)
  content/aanvallen/             ← de aanvalsgegevens (idem)
  index.html · project.html      ← de twee pagina's (raamwerk)
  pokedex.html · aanvallen.html · voorwerpen.html   ← de drie naslagpagina's
  assets/                        ← stijl + code; alleen aankomen bij vormgeving
  serve.js                       ← minimale webserver om lokaal te bekijken
  publiceer.sh                   ← zet de site online (GitHub Pages)
  CNAME · .nojekyll              ← nodig voor Pages; laten staan
```

## Tekst op de homepagina aanpassen

Open `content/site.json`:

| Sleutel | Wat het doet |
| --- | --- |
| `titel` | Naam bovenaan en in het browsertabblad |
| `ondertitel` | Zin onder de titel |
| `intro` | Het introverhaal (Markdown; `\n\n` is een nieuwe alinea) |
| `groepen` | **De indeling van de knoppen.** Een lijst van `{ titel, projecten }`; elke groep krijgt zijn eigen kop op de homepagina ("Generatie 1", "Generatie 2", …). De projecten zijn bestandsnamen uit `content/projecten/` zonder `.md` |
| `voortgangBron` | Waar de voortgangsbalken vandaan komen; laat staan |
| `meedoen` | Het blok onderaan: `titel`, `tekst` en de Discord-knop (zie onder). Laat `titel` en `tekst` leeg om het hele blok te verbergen |
| `footer` | De kleine tekst onderaan |

De naam die je hier invult, staat ook links in de kopbalk.

### De kopbalk

Bovenaan elke pagina staat dezelfde balk: de naam links, vier ingangen rechts (**Projecten**
naar de homepagina, **Pokédex**, **Aanvallen** en **Voorwerpen**) en daarnaast de knop voor het
nachtthema. Hij blijft bij het
scrollen staan — op een dexlijst van 251 Pokémon is de weg terug anders ver naar boven.

De ingangen naar de Pokédex, de Aanvallen en de Voorwerpen verschijnen alleen als die gegevens
er ook echt zijn; zolang geen enkel project is afgerond, wijst het menu dus nergens naartoe waar
niets staat.

De balk staat als HTML in alle drie de pagina's (`index.html`, `project.html`,
`pokedex.html`) — drie keer dezelfde tien regels. Dat is expres: zo staat het menu er meteen,
ook als het ophalen van de inhoud misgaat. Het beetje leven dat de balk nodig heeft, staat in
`assets/kop.js`.

### Licht en donker

De site is standaard licht; met de knop rechts in de kopbalk gaat hij op nacht. Die keuze wordt
onthouden (`localStorage`, sleutel `thema`) en geldt meteen op elke pagina.

Alle kleuren staan als variabelen bovenin `assets/site.css`: `:root` is het lichte thema,
`[data-thema="donker"]` het donkere. Wil je iets aan de kleuren doen, dan is dat blok meestal
het enige wat je aanraakt. Twee dingen om te weten:

- Elke pagina zet dat `data-thema` in een klein scriptje in de `<head>`, vóór de eerste
  tekening. Zonder dat ziet wie nacht heeft gekozen eerst een lichte flits.
- Wat op een foto ligt (de statusbadge en het percentage op een teaser) heeft vaste kleuren.
  Die ondergrond is altijd donker, ongeacht het thema van de pagina.

### De Discord-knop

Onder de tekst van het "Meehelpen?"-blok staat één knop, in Discord-kleur:

```json
"meedoen": {
  "titel": "Meehelpen?",
  "tekst": "…jouw tekst…",
  "discord": { "label": "Kom langs op onze Discord", "url": "https://discord.gg/xxxxxxx" }
}
```

**Zolang `url` leeg is, verschijnt er geen knop.** Dat is expres: een doodlopende
Discord-link kost een geïnteresseerde vrijwilliger een klik en vertrouwen. Vul je
uitnodigingslink in en de knop staat er.

## Een project aanpassen

Elk project is één bestand in `content/projecten/`. Bovenin staan de gegevens tussen
`---`-strepen, daaronder de tekst in Markdown:

```markdown
---
naam: Goud & Zilver
status: bezig
samenvatting: Eén zin die op de knop komt te staan.
teaser: teasers/goud-zilver.png
kleur: "#c9a227"
voortgang: pokegold-nl
schermafdrukken:
  - schermafdrukken/goud-zilver-1.png
  - schermafdrukken/goud-zilver-2.png
downloads:
  - label: Patches (Goud & Zilver)
    url: https://github.com/wfowler1/pokegold-nl/releases
    toelichting: Nieuwste patch op de releasepagina
---

## Over dit project

Gewone tekst met **nadruk**, [links](https://voorbeeld.nl) en lijstjes.
```

| Veld | Toelichting |
| --- | --- |
| `naam` | Wat er op de knop en boven de pagina staat |
| `slug` | Het adres op de site (`/rood-blauw/`). Leeg = de bestandsnaam; zie "Eigen adressen" |
| `status` | `voltooid` → "Voltooid", `bezig` → "Mee bezig", `gepland` → "Gepland" |
| `samenvatting` | Eén zin op de knop |
| `teaser` | Pad naar de plaat, bv. `teasers/geel.png`. Leeg = een egaal vlak in `kleur` |
| `teaser2` | Tweede plaat; bij muis-erover neemt die de eerste over (zie onder). Leeg = geen wissel |
| `kleur` | Kleurcode die de teaser vervangt zolang er geen plaat is |
| `voortgang` | Het project-id uit de vertaaleditor; hiermee vult de balk zich (zie onder) |
| `schermafdrukken` | Nul of meer paden; ze komen als raster in de zijkolom van de projectpagina, onder de voortgang en boven de downloads. De volgorde hier is de volgorde op de pagina, en elke afdruk linkt naar zichzelf op ware grootte |
| `downloads` | Nul of meer knoppen met `label`, `url` en optioneel `toelichting` |

Alle velden mogen weg als je ze niet gebruikt; alleen `naam` is echt nodig.

### Groepen op de homepagina

De projecten staan gebundeld per generatie:

```json
"groepen": [
  { "titel": "Generatie 1", "projecten": ["rood", "geel"] },
  { "titel": "Generatie 2", "projecten": ["goud-zilver", "kristal"] }
]
```

De titel is vrije tekst — "Spin-offs" of "Romhacks" mag net zo goed. Een project dat in geen
enkele groep staat, verschijnt niet op de homepagina; in het CMS zie je zulke projecten
apart staan onder "Nog niet ingedeeld".

### Speciale editie van een project

Optioneel. Zet een tweede bestand naast het project met `.editie.md` erachter — bijvoorbeeld
`content/projecten/kristal.editie.md` — en de projectpagina krijgt een knopje waarmee
bezoekers tussen beide uitvoeringen wisselen.

Dat bestand heeft dezelfde velden, maar **wat je weglaat erft het van het project zelf**.
Alleen `naam` is verplicht: die staat op het knopje.

```markdown
---
naam: Special Edition
voortgang: pokecrystal-nl-se
downloads:
  - label: Patch (Special Edition)
    url: https://github.com/…/releases
---

## Wat is er anders?

Eigen tekst voor deze uitvoering.
```

Met `?editie=1` achter de URL open je de pagina meteen op de speciale editie, zodat je er
rechtstreeks naartoe kunt linken.

### Nieuw project toevoegen

1. Maak `content/projecten/mijn-project.md` (kleine letters en streepjes in de naam — die
   naam komt in de URL terecht).
2. Zet `mijn-project` in de `projecten` van de gewenste groep in `content/site.json`. Staat
   het in geen enkele groep, dan komt het niet op de homepagina.

### Een project verwijderen of verbergen

Haal de naam uit zijn groep in `site.json`. Het bestand mag blijven staan; het is dan alleen
niet meer via de homepagina te vinden.

## De voortgangsbalk

Een project met `status: voltooid` staat **altijd op 100%**, wat de editor ook zegt: daar
blijft altijd wat ruis staan (regels die niet vertaald hoeven worden), en "Voltooid" naast een
balk op 97% spreekt zichzelf tegen. De status is de bron van waarheid.

Bij de overige projecten verschijnt een balk zodra er een `voortgang`-veld staat. Dat cijfer
komt live uit de vertaaleditor
(`vertalen.zakmonsters.nl/api/public/progress`) en is precies hetzelfde getal dat de
vertalers op hun projectkaart zien.

Geldige waarden voor `voortgang` zijn de project-id's uit de editor:
`pokegold-nl`, `pokecrystal-nl`, `pokeyellow-nl`, `pokered-nl`, `pokecrystal-nl-se`,
`pokemon_crystal_legacy-nl`. Staat er iets anders, of ligt de editor er even uit, dan
verdwijnt alleen de balk — de rest van de pagina blijft gewoon staan.

Het cijfer ververst maximaal één keer per tien minuten (dat scheelt de editor werk).

## Teaserplaten

Zet ze in `content/teasers/` en verwijs ernaar met `teaser: teasers/<bestand>.png`. Richtlijn:
minstens 1200 px breed. De plaat is de knop: er staat geen naam of samenvatting meer onder,
alleen de statusbadge linksonder. Zet de titel van het spel dus op de plaat zelf, en houd de
linkeronderhoek vrij.

**De verhouding kies je zelf.** De kaart neemt de vorm van de plaat over — een bijna vierkant
Game Boy-titelscherm wordt een bijna vierkante kaart, een brede schermafdruk een brede. Er wordt
niets bijgesneden en er blijven geen gekleurde randen over. Op de projectpagina staat dezelfde
plaat, ook op zijn eigen verhouding.

Zolang er geen plaat is, toont de site het gekleurde vlak uit `kleur` mét de projectnaam erin —
een nieuw project is dus nooit een leeg vlak.

### Twee platen: de wissel bij muis-erover

Sommige projecten zijn eigenlijk twee spellen (Rood/Blauw, Goud/Zilver). Vul je naast `teaser`
ook `teaser2` in, dan komt die tweede plaat tevoorschijn zodra de muis op de kaart staat — en
op de projectpagina op dezelfde manier over de grote plaat. Weg met de muis is terug naar de
eerste. In het CMS staat er een tweede keuzelijst voor, met een eigen uploadveld.

De tweede plaat wordt meteen ingeladen, niet pas bij de muis: anders zie je de eerste keer een
wit vlak in plaats van een wissel. Bij toetsenbordbediening werkt hij ook — de kaart is een
link, en focus telt daar mee als muis-erover.

`teaser2` zonder `teaser` doet niets: er valt dan niets te wisselen.

## Afbeeldingen in de projecttekst

Zet ze in `content/afbeeldingen/` en verwijs ernaar in de tekst:

```markdown
![Korte omschrijving](afbeeldingen/johto-kaart.png)
```

Die omschrijving is geen bijzaak: dat is wat iemand hoort die de afbeelding niet ziet. In het
CMS gaat dit vanzelf — daar upload je een afbeelding en zet hij de regel op de plek van je
cursor, met de cursor tussen de haakjes voor de omschrijving.

## Lokaal bekijken

```
node site/serve.js          # http://localhost:8080
PORT=3000 node site/serve.js
```

Openen met dubbelklik (`file://`) werkt níet: de browser mag dan de contentbestanden niet
inlezen. Gebruik de server hierboven.

## Publiceren (GitHub Pages)

De site staat op **GitHub Pages**, op het publieke repo `basvroegop/zakmonsters`. Déze
map is de bron; die repo is alleen de etalage. Publiceren doe je met:

```
./site/publiceer.sh "Kristal is af"
```

Dat kopieert de bestanden naar een verse kloon van dat repo en pusht één commit. Na ongeveer
een minuut staat het online. Bewust geen `git subtree push`: dan zou de geschiedenis van deze
privérepo publiek worden, en er hoeft niets meer naar buiten dan de bestanden zelf.

Twee bestanden horen bij Pages en mogen niet weg:

- `CNAME` — het domein (`zakmonsters.nl`). Weghalen betekent dat Pages terugvalt op
  `basvroegop.github.io`.
- `.nojekyll` — zonder dit bestand haalt Jekyll de `.md`-bestanden in `content/` door de
  molen en verdwijnen ze als bron. De site laadt ze dan niet meer.

Wil je vóór het publiceren zien wat je gedaan hebt, gebruik dan `node site/serve.js`
(zie hierboven).

## De Pokédex

`pokedex.html` toont de Pokémon uit onze **afgeronde** vertalingen: naam, typen, basiswaarden,
de evolutielijn, aanvallen per level en de Nederlandse dex-beschrijving **van elk spel**. Een
project komt er vanzelf bij zodra het op `voltooid` staat en een `voortgang`-veld heeft.

Eén project beslaat meerdere spellen: Gen 2 is Kristal, Goud én Zilver, en die drie tekenden elk
beestje apart én schreven er elk een eigen dex-tekst bij. Welke versies bij een project horen —
en uit welke repo hun sprites en teksten komen — staat in de tabel `VERSIES` bovenin
`cms/pokedex.js`. Staat een repo daar niet in, dan krijgt hij één versie: die van zichzelf.

De inhoud staat in `content/pokedex/` en wordt **gemaakt, niet geschreven**: bewerk die
bestanden dus niet met de hand, ze worden bij elke verversing overschreven. Verversen doe je
met de knop **Pokédex verversen** in het CMS, of met de hand:

```
node cms/pokedex.js                       # data/cache → site/content/
node cms/pokedex.js <cache> <site> <dexsprites>
```

De bron is de baseline die de editor toch al lokaal bijhoudt (`data/cache/<repo>.json`): de
inhoud van de hoofdrepo, dus precies wat er in de patch zit. Werk dat nog in de editor staat te
wachten telt bewust niet mee — de dex hoort te tonen wat je kunt downloaden.

Een afgerond project dat geen Pokémon-spel is (het ruilkaartspel) wordt overgeslagen met een
melding; de rest van de dexen gaat gewoon door.

### De evolutielijn

Onder "Evolutie" staat niet alleen de volgende stap maar de **hele reeks**, van basisvorm tot
eindvorm, met de soort waar je naar kijkt gemarkeerd. Bij elke stap staat de voorwaarde waarmee
je hem bereikt (level, steen, ruilen, vriendschap).

De dexdata kent alleen de stap vooruit; de stap terug leidt `pokedex.html` af door te zoeken wie
er naar deze soort evolueert. Een lijn die splitst (Eevee, Poliwhirl) zet zijn takken onder
elkaar in dezelfde kolom.

De reeks staat gecentreerd, óf helemaal naast elkaar óf (op een smal scherm) helemaal onder
elkaar. Niet halverwege omgeklapt: dan lees je één reeks als twee losse rijtjes.

Vanaf 1100 pixels breed staat de lijn naast de basiswaarden. Die twee delen de rij níét gelijk:
een drietrapsreeks is breder dan een halve pagina, dus de basiswaarden krijgen een vaste,
smallere kolom (hun balken hebben die ruimte niet nodig) en de lijn de rest. Daaronder gaat
alles onder elkaar.

Beide blokken zijn even hoog, en de lijn staat midden in de ruimte die overblijft — anders
hangt hij bovenin een half leeg vak naast een volle lijst.

Splitst een lijn (Gloom wordt Vleugelplant óf Bloemplant), dan staan die takken naast elkaar,
ook op een telefoon zolang de breedte het toelaat. Onder elkaar in dezelfde kolom leest zo'n
vertakking namelijk als één doorlopende reeks in plaats van als een keuze. Past het niet, dan
vallen ze alsnog onder elkaar.

### De typetags

Elk type heeft zijn eigen kleur (ijs lichtblauw, vuur rood). Die kleur hangt aan het type-id uit
het spel — `type--ice`, `type--fire` in `assets/site.css` — en niet aan de vertaalde naam, zodat
een herziene term (IJS, VORST) gewoon dezelfde kleur houdt. De naam op de tag komt wél uit de
vertaling. Een type zonder eigen kleur valt terug op grijs.

### De beschrijvingen

Onder "Pokédex" staat de tekst van elk spel apart, met de naam van dat spel erboven — Goud,
Zilver en Kristal vertellen over hetzelfde beestje elk een ander verhaal.

De soortnaam uit het spel (ZAAD, VLAM) staat bovenaan onder de naam, zolang de spellen het
daarover eens zijn; verschillen ze, dan komt hij per spel bij zijn eigen beschrijving te staan.

Heet een soort in de Speciale Editie anders, dan staat die naam er in lichtgrijze cursief
achter: **VENUSAUR** *(VENUSAURUS)*, en andersom zodra je op de Speciale Editie staat.

De teksten komen uit `data/pokemon/dex_entries/` van de bijbehorende repo — bij pokegold met een
submap per versie (`gold/`, `silver/`). Ontbreekt er één (nog niet vertaald), dan valt alleen
die weg en blijven de andere staan.

De namen van de basiswaarden komen uit `data/battle/stat_names.asm` van de vertaling zelf, zodat
de dex dezelfde termen gebruikt als het spel. Op één na: die tabel begint bij AANVAL, want de
levenspunten tekent het spel als plaatje op het statusscherm. De vertaling schrijft ze overal
als **LP** ("Herstelt LP", het voorwerp LP-PLUS); dat staat als enige met de hand in
`cms/pokedex.js`.

### De sprites

Elke soort staat er met zijn spelsprite bij: in de lijst en in de evolutielijn klein, op de
detailpagina groot rechtsboven. Daaronder staan knoppen om van spelversie te wisselen — Kristal,
Goud en Zilver zien er elk anders uit, en dat verschil is nu juist wat je in een dex wilt zien.
Die keuze wordt onthouden (`localStorage`, sleutel `dexsprite`): elke Pokémon is een eigen
pagina, en zonder geheugen sprong hij bij de eerste klik terug naar Kristal — precies wanneer je
aan het vergelijken bent. De kleine sprites in de lijst blijven altijd die van het spel zelf.

Die sprites komen uit één atlas per spel (`content/sprites/<repo>.png`): alle beestjes naast
elkaar, 16 per rij, 56 × 56 per vak. De pagina schuift die atlas met `background-position` naar
het juiste vak. Eén plaatje voor de hele dex, dus na het eerste sprite kost er geen enkele nog
verkeer.

De atlas bakt de editor zelf zodra iemand een Pokédex-bestand opent (`server/dexSprites.js`).
Is dat nog niet gebeurd, dan meldt de generator dat en blijft de dex tekst. Bakken kan ook
rechtstreeks, uit de assets die al op schijf staan:

```
node server/tools/bak-dexsprites.js pokecrystal-nl pokegold-nl
node server/tools/bak-dexsprites.js --alles
```

Welke uitvoeringen bij een project horen, staat in `SPRITEBRONNEN` bovenin `cms/pokedex.js`.
Staat een repo daar niet bij, dan krijgt hij één sprite: die van zichzelf.

De witte achtergrond waarmee de sprites in het spel staan, wordt in de kopie voor de site
doorzichtig gemaakt — maar alleen het wit dat vanaf de rand bereikbaar is. Wit dat bij de
tekening hoort (ogen, tanden, glans) blijft dus staan.

## De Aanvallen

`aanvallen.html` toont alle aanvallen uit dezelfde vertaling, met per aanval een eigen pagina:
kracht, precisie, PP, de beschrijving uit het spel, wie hem leert door te levelen, wie hem kan
leren met een TM of HM, en om welke TM het dan gaat.

De cijfers komen uit `data/moves/moves.asm`, de tekst uit `data/moves/descriptions.asm` en de
naam uit `data/moves/names.asm`. Wie een aanval leert staat níét bij de aanval maar bij elke
Pokémon (de levellijst en de `tmhm`-regel in `base_stats`); de generator draait dat om, zodat je
het per aanval kunt opzoeken. Wat in de constantenlijst geen regel in `moves.asm` heeft, is geen
aanval maar een gevechtsanimatie (ANIM_WOBBLE) en valt weg.

### Eigen adressen

Elk project, en elke Pokémon, aanval en voorwerp heeft een eigen adres:

```
zakmonsters.nl/geel/
zakmonsters.nl/dex/pikachu/
zakmonsters.nl/aanvallen/donderschok/
zakmonsters.nl/voorwerpen/hyperbal/
```

Projecten staan in de wortel, want dat is het adres dat je deelt. Standaard is dat de
bestandsnaam (`geel.md` → `/geel/`); met het veld `slug` kies je een ander (`rood.md` met
`slug: rood-blauw` → `/rood-blauw/`) zonder dat het bestand hoeft te verhuizen. Alleen kleine
letters, cijfers en streepjes, en niet een adres dat de site zelf al gebruikt (`dex`,
`aanvallen`, `voorwerpen`, `content`, `assets`) — dat laatste slaat `bouw.js` met een melding
over in plaats van de map te overschrijven.

Die mappen maakt `site/bouw.js` bij het publiceren: één klein bestand per ding, met een `<base>`
(het staat twee mappen diep), de juiste titel en welk ding het is. Zodra ze bestaan, linken de
pagina's ernaartoe in plaats van naar een vraagteken-URL — en omdat elke map echt bestaat, kun
je zo'n adres delen, herladen en indexeren.

Het adres zelf staat in de gegevens (`pad`), berekend door `cms/pokedex.js`. Daar wordt ook
opgelost wat er moet gebeuren als twee dingen hetzelfde heten: Nidoran♀ en Nidoran♂ worden
`nidoran-v` en `nidoran-m`, en een tweede "Zijden Sjaal" krijgt `-2`.

Lokaal en in de voorvertoning van het CMS bestaan die mappen niet — daar staan de bronbestanden.
De pagina's blijven daar gewoon `?nr=`, `?a=` en `?v=` gebruiken.

### Alles wijst naar elkaar

De drie lijsten hangen aan elkaar, zodat je kunt doorklikken in plaats van terugzoeken:

- in de **Pokédex** is elke aanval in de levellijst een link naar die aanval;
- op een **aanvalspagina** staan de soorten die hem leren in dezelfde vorm als in de Pokédex —
  met sprite, nummer en typen, en bij een levelaanval het level erbij — en linkt de TM of HM
  naar dat voorwerp;
- op een **voorwerppagina** linkt de aanval van een TM terug naar de aanvalspagina. Verder staat
  daar niets over die aanval: kracht en uitleg horen op de aanvalspagina, één klik verderop;
- op een **dexpagina** staat naast de levellijst wat een soort met een TM of HM leert en wat een
  leraar hem kan bijbrengen — twee aparte blokken, want voor een TM loop je naar een winkel en
  voor een leraar naar één persoon — met dezelfde twee verwijzingen en de uitleg van de aanval.

**De Speciale Editie geldt voor de hele site.** Klik je vanaf de dexpagina van KNOPSAURUS door
naar een aanval, dan staan de namen daar ook in die editie. De keuze wordt onthouden
(`localStorage`, sleutel `editie`) en `?se=1` in een adres wint: zo opent een gedeelde link waar
hij op wijst, en blijf je daarna in die editie doorklikken.

Daarvoor heeft elk voorwerp nu ook een eigen pagina (`voorwerpen.html?v=TM_THUNDERPUNCH`): een
verwijzing moet ergens uitkomen.

## De Voorwerpdex

`voorwerpen.html` toont alle voorwerpen uit dezelfde afgeronde vertaling: wat ze doen, wat ze
kosten en in welke winkel ze liggen. Eén kaart per voorwerp, met een zoekveld en een filter op
de zakken uit het spel: Algemeen, Belangrijk, Ballen en TM's en HM's. Ook dit wordt gemaakt door
`cms/pokedex.js`, dus de knop **Pokédex verversen** in het CMS bouwt beide.

Die filternamen staan in `voorwerpen.html` zelf. In het spel heten de zakken VOORWERPZAK,
BEL.ZAK, BALLENZAK en TM-ZAK — afkortingen die in een menu van twaalf tekens moesten passen;
boven een filter op een website is er ruimte voor gewone woorden.

Waar alles vandaan komt, allemaal uit de vertaalde repo:

| Op de pagina | Uit |
| --- | --- |
| Naam | `data/items/names.asm` |
| Beschrijving | `data/items/descriptions.asm` |
| Prijs | `data/items/attributes.asm` (`$9999` is de markering "niet te koop", geen bedrag) |
| Zak | idem, het `pocket`-veld; de zaknamen komen uit `data/items/pocket_names.asm` |
| Winkels | `data/items/marts.asm`, plus de koopjeshoek en de dakverkoop uit hun eigen tabellen |
| Vindplaatsen | de kaartbestanden: `itemball` (een balletje dat je ziet liggen), `hiddenitem` (zoeken) en `verbosegiveitem`/`giveitem` (van iemand krijgen) |
| TM's en HM's | de aanval staat in de constante zelf (`TM_THUNDERPUNCH`); naam, kracht en uitleg komen uit de aanvalsgegevens |

Op de eigen pagina van een voorwerp staan drie lijstjes onder elkaar — **Te koop**, **Te vinden**
en **Te krijgen** — met bij elke winkel de prijs die daar geldt. Dat verschil tussen vinden en
krijgen is er niet voor de sier: dat verschil bepaalt of je moet zoeken of moet praten. De plaatsnaam komt van
het landmark dat die kaart in `data/maps/maps.asm` aanwijst, dus staat er IJSPAD en niet
IcePathB1F.

De winkelnamen komen uit `data/maps/landmarks.asm`: het blokje `MartGoldenrod2F1` wordt
"GOLDENROD CITY (2F)". Zo heet een plek op de site precies zoals in het spel — en in een
vertaling die plaatsnamen omzet, dus vanzelf mee. De verdieping blijft staan (een warenhuis
verkoopt per etage iets anders), het volgnummer erachter niet: dat is de tweede toonbank op
dezelfde etage. De koopjeshoek en de dakverkoop hebben hun eigen prijs, en die staat bij dat
ene etiket in plaats van bij het voorwerp.

**Sprites zijn er niet.** Gen 2 tekent voorwerpen niet: het spel toont ze als tekstlijst, en er
staat dan ook geen `gfx/items/` in de repo. Wat er wél is, is de zak waarin iets thuishoort, en
die staat als filter boven de lijst.

## Nog te doen

- **Pokémon Pinball** heeft geen voortgangsbalk. Dat project bestaat wel in de
  staging-configuratie van de editor (`pokepinball`) maar niet in productie; het `voortgang`-veld
  is daarom leeggelaten. Zodra het in productie staat, vul je het in het CMS in.
- **Het ruilkaartspel** wijst nu naar `poketcg_v2_nl` (dat klopt met de editor), maar krijgt
  geen Pokédex: een kaartspel heeft geen `base_stats`. Een kaartenoverzicht zou een eigen
  generator vragen.

## Controleren of alles nog werkt

```
npm run test:ui-site     # de site in een echte browser
npm run test:ui-cms      # het CMS in een echte browser
```

De eerste rendert alle drie de pagina's en controleert de kaarten, de statuslabels, de
voortgangsbalk, de downloadknoppen, de kopbalk, de nachtknop (inclusief of die keuze de volgende
pagina haalt), de wissel naar de tweede plaat, de evolutielijn en de sprites in de dex —
inclusief dát de vakken van Goud en Zilver verschillen, want een verkeerd berekend vak levert
wél een plaatje op, alleen het verkeerde. Met `SHOT=/work/test/site.png` schrijft hij er
screenshots bij.

De tweede doet hetzelfde voor het CMS, op een kopie van `site/`: opslaan en "Pokédex
verversen" schrijven écht, en dat mag nooit de echte inhoud raken.
