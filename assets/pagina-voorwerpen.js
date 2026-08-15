// De voorwerpen-pagina. Staat als los bestand zodat elke Pokémon,
// aanval en voorwerp een eigen adres kan krijgen zonder dit script te herhalen.

import { esc, markdown, laadSite } from './content.js';
import { kopbalk, merknaam } from './kop.js';
import { seActief, zetSe, aanvalUrl, voorwerpUrl, gevraagd, laadLijst } from './dex.js';

kopbalk();

const $ = (id) => document.getElementById(id);
const zoekparam = () => new URLSearchParams(location.search);

// Net als de Pokédex is dit één opgehaald bestand; zoeken en filteren gebeurt daarna in de
// pagina zelf, zonder dat er nog iets over de lijn hoeft.
let dex = null;
let zak = '';   // lege waarde = alle zakken
// De Speciale Editie vertaalt ook de plaatsnamen (GOLDENROD CITY wordt GULDEN ROEDESTAD). De
// keuze is dezelfde als op de andere pagina's: kom je hier vanuit de editie, dan staat hij aan.
let seAan = seActief();

// Wat er van dit voorwerp getoond wordt: de gewone uitvoering, of die van de editie waar hij
// eigen namen heeft.
const uitvoering = (v) => (seAan && v.se ? { ...v, ...v.se } : v);

// Bedragen zoals het spel ze schrijft: het yen-teken uit de ROM, met puntjes per duizendtal.
const geld = (n) => `¥${Number(n).toLocaleString('nl-NL')}`;

// De zakken heten in het spel VOORWERPZAK, BEL.ZAK, BALLENZAK en TM-ZAK — afkortingen die in
// een menu van twaalf tekens moesten passen. Boven een filter op een website is er ruimte voor
// gewone woorden. Een zak die hier niet staat, houdt gewoon zijn naam uit het spel.
const ZAKLABELS = {
  ITEM: 'Algemeen',
  KEY_ITEM: 'Belangrijk',
  BALL: 'Ballen',
  TM_HM: "TM's en HM's",
};
const zakLabel = (sleutel) => ZAKLABELS[sleutel] || (dex.zakken || {})[sleutel] || sleutel;

function knoppenbalk(zoek) {
  // De zakken uit het spel zijn meteen het filter: BALLENZAK, TM-ZAK, … Alleen zakken die in
  // deze vertaling ook echt voorwerpen hebben, krijgen een knop.
  const aanwezig = Object.entries(dex.zakken || {})
    .filter(([sleutel]) => dex.voorwerpen.some((v) => v.zak === sleutel));
  return `<div class="dexbalk">
      <input id="zoek" type="search" placeholder="Zoek op naam of beschrijving" value="${esc(zoek || '')}"
             aria-label="Zoek een voorwerp">
      ${aanwezig.length > 1 ? `<div class="wissel wissel--klein" role="tablist" aria-label="Zak">
        <button class="wisselknop${zak ? '' : ' is-actief'}" data-zak="" role="tab"
          aria-selected="${!zak}">Alles</button>
        ${aanwezig.map(([sleutel]) => `<button class="wisselknop${zak === sleutel ? ' is-actief' : ''}"
            data-zak="${esc(sleutel)}" role="tab" aria-selected="${zak === sleutel}">${esc(zakLabel(sleutel))}</button>`).join('')}
      </div>` : ''}
    </div>`;
}

const winkelsHtml = (v) => (v.winkels || []).map((w) => `<span class="winkel">${esc(w.locatie)}${w.prijs
  ? ` <span class="winkelprijs">${geld(w.prijs)}</span>` : ''}</span>`).join('');

// Op de eigen pagina van een voorwerp zijn het lijstjes in plaats van etiketten: je leest ze
// daar één voor één ("waar kan ik dit halen?") in plaats van dat je ze in een lijst afscant.
// De prijs staat achter de winkel waar hij geldt — de koopjeshoek vraagt iets anders dan de
// gewone winkel.
const winkellijst = (v) => `<ul class="plaatsen">${(v.winkels || []).map((w) => `<li>${esc(w.locatie)}
    <span class="plaatsprijs">${geld(w.prijs || v.prijs)}</span></li>`).join('')}</ul>`;

// Waar het in de wereld ligt. Een balletje zie je liggen, een verborgen voorwerp moet je zoeken
// en de rest krijg je van iemand — dat verschil is voor een speler het halve verhaal, dus staat
// het erbij in plaats van dat alles op één hoop gaat.
const PLEKSOORT = { verborgen: 'verborgen', gekregen: 'van iemand' };
const plekkenlijst = (plekken) => `<ul class="plaatsen">${plekken.map((p) => `<li>${esc(p.locatie)}
    ${p.aantal > 1 ? `<span class="plaatsaantal">${p.aantal}×</span>` : ''}
    ${PLEKSOORT[p.soort] ? `<span class="pleksoort">${PLEKSOORT[p.soort]}</span>` : ''}</li>`).join('')}</ul>`;

// De aanval die een TM leert, linkt door naar de aanvalspagina; daar staat wie hem nog meer kan.
// Bij een TM of HM is de aanval het hele verhaal; kracht en uitleg staan op de aanvalspagina,
// één klik verderop. Twee keer hetzelfde vertellen maakt geen van beide duidelijker.
const leertHtml = (v) => (v.leert ? `<p class="voorwerpleert">Leert <strong>${v.aanval
  ? `<a href="${aanvalUrl({ naam: v.leert, const: v.aanval }, seAan)}">${esc(v.leert)}</a>`
  : esc(v.leert)}</strong></p>` : '');

// In de lijst is de hele kaart een link naar zijn eigen pagina. Daar staat hetzelfde, maar dan
// als bestemming: een aanval of een Pokémon kan ernaartoe wijzen.
// In het overzicht alleen wat een voorwerp ís; de prijs en de plaatsen staan op zijn eigen
// pagina. Zo blijft de lijst een lijst die je afscant in plaats van een muur.
function kaartHtml(v) {
  return `<a class="voorwerp" href="${voorwerpUrl(v, seAan)}">
      <span class="voorwerpnaam">${esc(v.naam)}</span>
      ${v.leert ? `<span class="voorwerpleert">Leert <strong>${esc(v.leert)}</strong></span>` : ''}
      ${v.beschrijving ? `<span class="voorwerptekst">${esc(v.beschrijving)}</span>` : ''}
    </a>`;
}

function detailHtml(voorwerp) {
  const v = uitvoering(voorwerp);
  const winkels = winkelsHtml(v);
  const plekken = v.vindplaatsen || [];
  const teVinden = plekken.filter((p) => p.soort !== 'gekregen');
  const teKrijgen = plekken.filter((p) => p.soort === 'gekregen');
  // Alleen een knopje als deze editie voor dít voorwerp ook echt iets anders schrijft.
  const wissel = dex.seNamen && voorwerp.se ? `<div class="wissel wissel--klein" role="tablist"
      aria-label="Uitvoering">
      <button class="wisselknop${seAan ? '' : ' is-actief'}" data-se="0" role="tab"
        aria-selected="${!seAan}">${esc(dex.spel)}</button>
      <button class="wisselknop${seAan ? ' is-actief' : ''}" data-se="1" role="tab"
        aria-selected="${seAan}">Speciale Editie</button>
    </div>` : '';

  return `<a class="terug" href="voorwerpen.html">← Alle voorwerpen</a>
    <div class="dexkop">
      <h1>${esc(seAan && voorwerp.naamSe ? voorwerp.naamSe : voorwerp.naam)}</h1>
      <p class="dextypen">
        ${v.zak ? `<span class="type">${esc(zakLabel(v.zak))}</span>` : ''}
        ${v.prijs ? `<span class="voorwerpprijs">${geld(v.prijs)}</span>` : ''}
      </p>
      ${wissel}
    </div>
    <div class="dexdetail">
      <section class="blok blok--breed">
        ${v.leert
          ? leertHtml(v)
          : (v.beschrijving ? `<p class="aanvaltekst">${esc(v.beschrijving)}</p>` : '')}
      </section>
      ${winkels ? `<section class="blok blok--breed">
        <h2>Te koop</h2>
        ${winkellijst(v)}
      </section>` : ''}
      ${teVinden.length ? `<section class="blok blok--breed">
        <h2>Te vinden</h2>
        ${plekkenlijst(teVinden)}
      </section>` : ''}
      ${teKrijgen.length ? `<section class="blok blok--breed">
        <h2>Te krijgen</h2>
        ${plekkenlijst(teKrijgen)}
      </section>` : ''}
      ${!winkels && !teVinden.length && !teKrijgen.length ? `<section class="blok blok--breed">
        <p class="uitleg">Dit voorwerp is niet te koop en ligt nergens in de wereld — het hoort
          bij een gebeurtenis in het verhaal.</p>
      </section>` : ''}
    </div>`;
}

function lijstHtml(zoek) {
  const term = String(zoek || '').trim().toLowerCase();
  const treffers = dex.voorwerpen.filter((v) => (!zak || v.zak === zak) && (!term
    || v.naam.toLowerCase().includes(term)
    || String(v.beschrijving || '').toLowerCase().includes(term)
    || String(v.leert || '').toLowerCase().includes(term)
    || (v.winkels || []).some((w) => w.locatie.toLowerCase().includes(term))));
  if (!treffers.length) return '<p class="leeg">Geen voorwerpen gevonden.</p>';
  return `<div class="voorwerplijst">${treffers.map(kaartHtml).join('')}</div>`;
}

// Wisselen tussen de gewone uitvoering en de Speciale Editie. Staat op beide weergaven, dus
// apart van de rest van de knoppen.
function knoppenAan() {
  for (const knop of document.querySelectorAll('[data-se]')) {
    knop.onclick = () => {
      seAan = zetSe(knop.dataset.se === '1');
      teken();
    };
  }
}

function teken() {
  const gekozen = gevraagd('v');
  if (gekozen) {
    const voorwerp = dex.voorwerpen.find((v) => v.const === gekozen || v.pad === gekozen);
    $('pagina').innerHTML = voorwerp ? detailHtml(voorwerp)
      : `<a class="terug" href="voorwerpen.html">← Alle voorwerpen</a>
         <div class="fout-blok"><h1>Niet gevonden</h1><p>Dit voorwerp staat niet in de lijst.</p></div>`;
    document.title = voorwerp ? `${voorwerp.naam} — Voorwerpen` : 'Voorwerpen';
    // Ook op deze pagina staat een knopje voor de editie; de rest van de knoppen hoort bij de
    // lijst en komt hieronder.
    knoppenAan();
    return;
  }

  const zoek = zoekparam().get('q') || '';
  $('pagina').innerHTML = `
    <h1>Voorwerpen</h1>
    ${knoppenbalk(zoek)}
    <div id="lijst">${lijstHtml(zoek)}</div>`;

  const veld = $('zoek');
  if (veld) {
    veld.oninput = () => { $('lijst').innerHTML = lijstHtml(veld.value); };
    if (zoek) { veld.focus(); veld.setSelectionRange(zoek.length, zoek.length); }
  }
  knoppenAan();
  for (const knop of document.querySelectorAll('[data-zak]')) {
    knop.onclick = () => {
      zak = knop.dataset.zak;
      const term = $('zoek') ? $('zoek').value : '';
      teken();
      if (term && $('zoek')) { $('zoek').value = term; $('lijst').innerHTML = lijstHtml(term); }
    };
  }
}

(async () => {
  const site = await laadSite().catch(() => ({}));
  merknaam(site.titel);
  $('voet').innerHTML = markdown(site.footer || '');

  try {
    dex = await laadLijst('voorwerpen');
  } catch (err) {
    console.error(err);
    $('pagina').innerHTML = `<a class="terug" href="index.html">← Terug naar de projecten</a>
      <div class="fout-blok"><h1>Voorwerpen nog niet beschikbaar</h1>
      <p>Zodra een vertaling is afgerond, verschijnen ze hier.</p></div>`;
    return;
  }

  teken();
})();
