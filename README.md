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
  index.html · project.html      ← de twee pagina's (raamwerk)
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
| `projecten` | **De volgorde van de knoppen** — bestandsnamen uit `content/projecten/` zonder `.md` |
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
bron: https://github.com/wfowler1/pokegold-nl
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
| `kleur` | Kleurcode die de teaser vervangt zolang er geen plaat is |
| `voortgang` | Het project-id uit de vertaaleditor; hiermee vult de balk zich (zie onder) |
| `bron` | Link naar de GitHub-repo (optioneel) |
| `downloads` | Nul of meer knoppen met `label`, `url` en optioneel `toelichting` |

Alle velden mogen weg als je ze niet gebruikt; alleen `naam` is echt nodig.

### Nieuw project toevoegen

1. Maak `content/projecten/mijn-project.md` (kleine letters en streepjes in de naam — die
   naam komt in de URL terecht).
2. Zet `mijn-project` in de lijst `projecten` in `content/site.json`, op de plek waar je
   de knop wilt hebben.

### Een project verwijderen of verbergen

Haal de naam uit de lijst `projecten` in `site.json`. Het bestand mag blijven staan; het is
dan alleen niet meer via de homepagina te vinden.

## De voortgangsbalk

Bij projecten met `status: bezig` én een `voortgang`-veld verschijnt een balk met het
percentage vertaalde regels. Dat cijfer komt live uit de vertaaleditor
(`vertalen.zakmonsters.nl/api/public/progress`) en is precies hetzelfde getal dat de
vertalers op hun projectkaart zien.

Geldige waarden voor `voortgang` zijn de project-id's uit de editor:
`pokegold-nl`, `pokecrystal-nl`, `pokeyellow-nl`, `pokered-nl`, `pokecrystal-nl-se`,
`pokemon_crystal_legacy-nl`. Staat er iets anders, of ligt de editor er even uit, dan
verdwijnt alleen de balk — de rest van de pagina blijft gewoon staan.

Het cijfer ververst maximaal één keer per tien minuten (dat scheelt de editor werk).

## Teaserplaten

Zet ze in `content/teasers/` en verwijs ernaar met `teaser: teasers/<bestand>.png`.
Richtlijn: **16:9**, minstens 1200 × 675 px, en houd er rekening mee dat op de projectpagina
onderaan een donkere balk over de plaat valt waar de titel in staat. Zolang er geen plaat is,
toont de site het gekleurde vlak uit `kleur` — de site blijft dus heel.

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

## Controleren of alles nog werkt

```
npm run test:ui-site
```

Rendert beide pagina's in een echte browser en controleert de kaarten, de statuslabels, de
voortgangsbalk en de downloadknoppen. Met `SHOT=/work/test/site.png` schrijft hij er
screenshots bij.
