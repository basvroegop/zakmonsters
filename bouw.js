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
    .map((groep) => `${groep.titel ? `<h2>${inhoud.esc(groep.titel)}</h2>` : ''}
        <div class="kaarten">${groep.leden.map((p) => weergave.kaartHtml(p, {})).join('')}</div>`)
    .join('\n');

  const json = `<script type="application/json" id="ingebakken">${veiligJson({ site, projecten, edities })}</script>`;

  vervang('index.html', '<!--INHOUD-->', json);
  vervang('index.html', '<p class="laden">Projecten laden…</p>', kaarten);
  vervang('project.html', '<!--INHOUD-->', json);

  const aantal = Object.keys(projecten).length;
  console.log(`Ingebakken: ${aantal} project${aantal === 1 ? '' : 'en'}, ` +
    `${Object.keys(edities).length} speciale editie(s), ${groepen.length} groep(en).`);
})().catch((err) => { console.error(err.message); process.exit(1); });
