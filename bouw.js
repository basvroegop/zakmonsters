// Bakt de inhoud in de pagina's, zodat een bezoeker niet eerst "Projecten laden…" ziet.
//
// Zonder deze stap haalt de browser eerst index.html op, dan site.json, dan elk projectbestand
// apart — pas daarna verschijnen de kaarten. Dat is drie rondjes wachten voor inhoud die bij
// het publiceren al vaststaat. Hier zetten we die inhoud in de HTML zelf: één bestand ophalen
// en de pagina staat er.
//
// Twee dingen worden ingevoegd:
//   1. de projectkaarten van de homepagina, kant-en-klaar als HTML;
//   2. alle inhoud als JSON, zodat ook de projectpagina meteen kan tekenen.
//
// De bron in site/ blijft ongewijzigd: dit draait op de kopie die gepubliceerd wordt. Zonder
// deze stap werkt de site nog steeds — de pagina's vallen dan terug op ophalen, en dat is
// precies wat de voorvertoning in het CMS doet.
//
//   node site/bouw.js <map>      (standaard: de map van dit bestand)

const fs = require('fs');
const path = require('path');

const DOEL = process.argv[2] || __dirname;
const CONTENT = path.join(DOEL, 'content');
const PROJECTEN = path.join(CONTENT, 'projecten');

async function modules() {
  const url = (b) => new URL('file://' + path.join(DOEL, 'assets', b)).href;
  return {
    inhoud: await import(url('content.js')),
    weergave: await import(url('site.js')),
  };
}

// ---- Eigen adressen ----
// Elke Pokémon, aanval en voorwerp krijgt een eigen map met een eigen index.html:
//   /dex/knopsaurus/  /aanvallen/tackle/  /voorwerpen/hyperbal/
// Zo'n pagina is dezelfde pagina als altijd, met drie dingen erin gezet: een <base> (hij staat
// twee mappen diep, de rest van de site niet), de titel van waar hij over gaat, en welke soort
// hij moet openen. De pagina's zelf schakelen daarop over: zodra `mooieUrls` aanstaat, linken ze
// naar deze adressen in plaats van naar een vraagteken-URL.
//
// Deze mappen bestaan alléén in de gepubliceerde kopie. Lokaal en in de voorvertoning van het
// CMS staan de bronbestanden, en daar blijven de vraagteken-URL's werken.
// `entiteit` is wat de pagina moet openen; `slug` is waar hij komt te staan. Bij een soort of
// een aanval zijn die gelijk, bij een project niet per se: het adres mag /rood-blauw zijn
// terwijl het bestand `rood.md` heet. De pagina krijgt dan het bestands-id, zodat hij niets
// hoeft terug te zoeken.
function schrijfAdressen(doelmap, paginaBestand, entiteiten, titelStaart) {
  const bron = fs.readFileSync(path.join(DOEL, paginaBestand), 'utf8');
  let aantal = 0;
  for (const { slug, titel, entiteit } of entiteiten) {
    if (!slug) continue;
    const html = bron
      .replace('<head>', `<head>\n<base href="/">`)
      .replace(/<title>[^<]*<\/title>/, `<title>${titel} — ${titelStaart}</title>`)
      .replace('</head>', `<script>window.__entiteit = ${JSON.stringify(entiteit || slug)};</script>\n</head>`);
    const map = doelmap ? path.join(DOEL, doelmap, slug) : path.join(DOEL, slug);
    fs.mkdirSync(map, { recursive: true });
    fs.writeFileSync(path.join(map, 'index.html'), html);
    aantal += 1;
  }
  return aantal;
}

// De inhoud van een lijst, als die er is. Zonder afgerond project bestaat er geen dex, en dan
// hoeven er ook geen adressen te zijn.
function lijstVan(map) {
  try {
    const index = JSON.parse(fs.readFileSync(path.join(CONTENT, map, 'index.json'), 'utf8'));
    const eerste = (index.dexen || [])[0];
    if (!eerste) return null;
    return JSON.parse(fs.readFileSync(path.join(CONTENT, map, `${eerste.project}.json`), 'utf8'));
  } catch {
    return null;
  }
}

// JSON in een <script>-blok mag geen "</script>" bevatten; die zou de browser als het einde van
// het blok lezen. Elke < wordt daarom een escape — JSON.parse leest hem daarna gewoon terug.
const veiligJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

function vervang(bestand, merk, inhoud) {
  const pad = path.join(DOEL, bestand);
  const html = fs.readFileSync(pad, 'utf8');
  if (!html.includes(merk)) throw new Error(`${bestand}: merkteken ${merk} niet gevonden`);
  fs.writeFileSync(pad, html.replace(merk, inhoud));
}

(async () => {
  const { inhoud, weergave } = await modules();
  const site = JSON.parse(fs.readFileSync(path.join(CONTENT, 'site.json'), 'utf8'));

  const projecten = {};
  const edities = {};
  for (const naam of fs.readdirSync(PROJECTEN).filter((n) => n.endsWith('.md'))) {
    const { data, body } = inhoud.parseFrontmatter(fs.readFileSync(path.join(PROJECTEN, naam), 'utf8'));
    if (naam.endsWith('.editie.md')) {
      edities[naam.replace(/\.editie\.md$/, '')] = { id: naam.replace(/\.editie\.md$/, ''), ...data, body };
    } else {
      projecten[naam.replace(/\.md$/, '')] = { id: naam.replace(/\.md$/, ''), ...data, body };
    }
  }

  // De kaarten alvast tekenen. De voortgang van lopende projecten staat er nog niet in — die
  // komt van de editor en is per bezoek anders; de pagina vult hem aan zodra hij binnen is.
  // Voltooide projecten staan sowieso op 100% en hebben die aanvulling niet nodig.
  const groepen = Array.isArray(site.groepen) && site.groepen.length
    ? site.groepen
    : [{ titel: '', projecten: site.projecten || [] }];
  const kaarten = groepen
    .map((groep) => ({
      titel: groep.titel || '',
      // Zelfde sortering als de pagina zelf gebruikt, anders zou de ingebakken versie even
      // een andere volgorde tonen dan wat de browser er daarna van maakt.
      leden: weergave.sorteerProjecten((groep.projecten || []).map((id) => projecten[id]).filter(Boolean)),
    }))
    .filter((groep) => groep.leden.length)
    // `mooieUrls` staat hier aan: de gepubliceerde kopie krijgt hieronder een eigen adres per
    // project, en de ingebakken kaarten moeten daar meteen naartoe linken. Zouden ze de
    // vraagteken-URL houden, dan wees de eerste tekening ergens anders heen dan de tweede.
    .map((groep) => `${groep.titel ? `<h2>${inhoud.esc(groep.titel)}</h2>` : ''}
        <div class="kaarten">${groep.leden.map((p) => weergave.kaartHtml(p, {}, { mooieUrls: true })).join('')}</div>`)
    .join('\n');

  const json = `<script type="application/json" id="ingebakken">${veiligJson({ site, projecten, edities })}</script>`;

  vervang('index.html', '<!--INHOUD-->', json);
  vervang('index.html', '<p class="laden">Projecten laden…</p>', kaarten);
  vervang('project.html', '<!--INHOUD-->', json);

  const aantal = Object.keys(projecten).length;
  console.log(`Ingebakken: ${aantal} project${aantal === 1 ? '' : 'en'}, ` +
    `${Object.keys(edities).length} speciale editie(s), ${groepen.length} groep(en).`);

  // Elk project, elke soort, aanval en voorwerp een eigen adres. Eerst de vlag in de pagina's
  // zetten en dan pas de kopieën maken: de kopie moet die vlag ook hebben, anders linkt hij nog
  // naar de vraagteken-URL's.
  const pokedex = lijstVan('pokedex');
  const aanvallen = lijstVan('aanvallen');
  const voorwerpen = lijstVan('voorwerpen');

  {
    for (const bestand of ['index.html', 'project.html', 'pokedex.html', 'aanvallen.html', 'voorwerpen.html']) {
      const pad = path.join(DOEL, bestand);
      if (!fs.existsSync(pad)) continue;
      const html = fs.readFileSync(pad, 'utf8');
      fs.writeFileSync(pad, html.replace('</head>', '<script>window.__mooieUrls = true;</script>\n</head>'));
    }

    // De projecten staan in de wortel: /geel/, /goud-zilver/. Zo kort mogelijk, want dit is het
    // adres dat je deelt. Het `slug`-veld wint van de bestandsnaam, zodat `rood.md` op
    // /rood-blauw/ mag staan zonder dat het bestand hoeft te verhuizen.
    //
    // Botsingen kunnen echt gebeuren — /dex/ of /aanvallen/ als projectslug zou de dexpagina's
    // overschrijven — dus die weigeren we hier met een duidelijke melding in plaats van stil
    // een map te vervangen.
    const bezet = new Set(['dex', 'aanvallen', 'voorwerpen', 'content', 'assets']);
    const projectAdressen = Object.values(projecten)
      .map((p) => ({ slug: String(p.slug || p.id).trim(), entiteit: p.id, titel: p.naam || p.id }))
      .filter((p) => {
        if (!/^[a-z0-9][a-z0-9-]*$/.test(p.slug)) {
          console.warn(`project "${p.entiteit}": "${p.slug}" is geen bruikbaar adres; overgeslagen`);
          return false;
        }
        if (bezet.has(p.slug)) {
          console.warn(`project "${p.entiteit}": /${p.slug}/ is al van de site zelf; overgeslagen`);
          return false;
        }
        return true;
      });
    const projectMappen = schrijfAdressen('', 'project.html', projectAdressen, site.titel || 'Zakmonsters');
    console.log(`Eigen adressen: ${projectMappen} project(en).`);
  }

  if (pokedex || aanvallen || voorwerpen) {

    // Het adres van elk ding staat in de gegevens zelf (`pad`); cms/pokedex.js heeft daar al
    // uitgezocht wat er moet gebeuren als twee dingen hetzelfde heten.
    const adressen = (lijst, wat) => lijst.map((x) => ({ slug: x.pad, titel: x.naam }))
      .filter((x) => x.slug || console.warn(`${wat}: "${x.titel}" heeft geen pad; overgeslagen`));
    const gemaakt = [];
    if (pokedex) {
      gemaakt.push(['dex', schrijfAdressen('dex', 'pokedex.html',
        adressen(pokedex.soorten, 'dex'), 'Pokédex')]);
    }
    if (aanvallen) {
      gemaakt.push(['aanvallen', schrijfAdressen('aanvallen', 'aanvallen.html',
        adressen(aanvallen.aanvallen, 'aanvallen'), 'Aanvallen')]);
    }
    if (voorwerpen) {
      gemaakt.push(['voorwerpen', schrijfAdressen('voorwerpen', 'voorwerpen.html',
        adressen(voorwerpen.voorwerpen, 'voorwerpen'), 'Voorwerpen')]);
    }
    console.log('Eigen adressen: ' + gemaakt.map(([wat, n]) => `${n} ${wat}`).join(', ') + '.');
  }
})().catch((err) => { console.error(err.message); process.exit(1); });
