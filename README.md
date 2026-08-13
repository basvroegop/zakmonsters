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
  index.html · project.html      ← de twee pagina's (raamwerk)
  pokedex.html                   ← de Pokédex
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

De site heeft bewust **geen menubalk**: de projectknoppen zijn de navigatie. Op een
projectpagina staat linksboven alleen een discrete "← Alle projecten".

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
| `status` | `voltooid` → "Voltooid", `bezig` → "Mee bezig", `gepland` → "Gepland" |
| `samenvatting` | Eén zin op de knop |
| `teaser` | Pad naar de plaat, bv. `teasers/geel.png`. Leeg = een egaal vlak in `kleur` |
| `teaser2` | Tweede plaat; bij muis-erover neemt die de eerste over (zie onder). Leeg = geen wissel |
| `kleur` | Kleurcode die de teaser vervangt zolang er geen plaat is |
| `voortgang` | Het project-id uit de vertaaleditor; hiermee vult de balk zich (zie onder) |
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

Zet ze in `content/teasers/` en verwijs ernaar met `teaser: teasers/<bestand>.png`.
Richtlijn: **4:3**, minstens 1200 × 900 px. De plaat is de knop: er staat geen naam of
samenvatting meer onder, alleen de statusbadge linksonder. Zet de titel van het spel dus op de
plaat zelf, en houd de linkeronderhoek vrij.

Op de projectpagina wordt dezelfde plaat tot **16:9** gecropt (midden vasthoudend), zodat hij
bovenaan niet het halve scherm inneemt. Wat er aan de boven- en onderkant staat, kan daar dus
wegvallen.

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
evoluties, aanvallen per level en de Nederlandse dex-beschrijving. Een project komt er vanzelf
bij zodra het op `voltooid` staat en een `voortgang`-veld heeft.

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

### De sprites

Elke soort staat er met zijn spelsprite bij: in de lijst en bij de evoluties klein, op de
detailpagina groot. Bij een Gen 2-project staan **Kristal, Goud en Zilver naast elkaar** — die
drie zien er elk anders uit, en dat verschil is nu juist wat je in een dex wilt zien.

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
voortgangsbalk, de downloadknoppen, de wissel naar de tweede plaat en de sprites in de dex —
inclusief dát de vakken van Goud en Zilver verschillen, want een verkeerd berekend vak levert
wél een plaatje op, alleen het verkeerde. Met `SHOT=/work/test/site.png` schrijft hij er
screenshots bij.

De tweede doet hetzelfde voor het CMS, op een kopie van `site/`: opslaan en "Pokédex
verversen" schrijven écht, en dat mag nooit de echte inhoud raken.
