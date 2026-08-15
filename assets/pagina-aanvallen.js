// De aanvallen-pagina. Staat als los bestand zodat elke Pokémon,
// aanval en voorwerp een eigen adres kan krijgen zonder dit script te herhalen.

import { esc, markdown, laadSite } from './content.js';
import { kopbalk, merknaam } from './kop.js';
import { dexRegelHtml, laadDex, laadLijst, seActief, zetSe, naamVoor, dexUrl, aanvalUrl,
  voorwerpUrl, gevraagd } from './dex.js';

kopbalk();

const $ = (id) => document.getElementById(id);
const zoekparam = () => new URLSearchParams(location.search);

// Eén bestand met alle aanvallen; zoeken en de detailpagina komen daarna uit de pagina zelf.
// De dexgegevens komen erbij voor de soorten die een aanval leren: die staan hier in dezelfde
// vorm als op de Pokédex — met sprite, nummer en typen — zodat het één lijst blijft.
let lijst = null;
let dex = null;
// De uitvoering geldt voor de hele site: kom je hier vanaf een pagina van de Speciale Editie,
// dan staan de namen hier ook in die editie.
let seAan = seActief();

const typeHtml = (a) => (a.type
  ? `<span class="type type--${esc(a.type.soort)}">${esc(a.type.naam.toLowerCase())}</span>` : '');
// Een aanval zonder kracht doet geen schade (statusaanval); een streepje zegt dat duidelijker
// dan een 0.
const kracht = (a) => (a.kracht ? String(a.kracht) : '—');

function lijstHtml(zoek) {
  const term = String(zoek || '').trim().toLowerCase();
  const treffers = lijst.aanvallen.filter((a) => !term
    || a.naam.toLowerCase().includes(term)
    || String(a.beschrijving || '').toLowerCase().includes(term)
    || (a.type && a.type.naam.toLowerCase().includes(term))
    || (a.tmhm || []).some((t) => t.naam.toLowerCase().includes(term)));
  if (!treffers.length) return '<p class="leeg">Geen aanvallen gevonden.</p>';
  return `<div class="dexlijst">${treffers.map((a) => `
      <a class="dexknop" href="${aanvalUrl(a, seAan)}">
        <span class="dexregel">
          <span class="dexnaam">${esc(a.naam)}</span>
          <span class="dextypen">${typeHtml(a)}
            <span class="aanvalkracht">${kracht(a)}</span></span>
        </span>
      </a>`).join('')}</div>`;
}

// De soorten die een aanval leren, in dezelfde vorm als op de Pokédex zelf — maar zonder het
// dexnummer: hier zegt het level meer. Ontbreken de dexgegevens, dan blijft het bij een naam met
// een link, beter dan niets.
function monsterlijst(wie, metLevel) {
  if (!wie || !wie.length) return '';
  return `<div class="dexlijst">${wie.map((m) => {
    const soort = dex && dex.soorten.find((s) => s.nr === m.nr);
    if (!soort) return `<a class="dexknop" href="pokedex.html?nr=${m.nr}"><span class="dexregel">
        <span class="dexnaam">${esc(m.naam)}</span></span></a>`;
    return dexRegelHtml(dex, soort, {
      naam: naamVoor(soort, seAan),
      href: dexUrl(soort, seAan),
      metNummer: false,
      bij: metLevel && m.level ? (m.level === 1 ? 'start' : `lv. ${m.level}`) : '',
    });
  }).join('')}</div>`;
}

function detailHtml(a) {
  const cijfers = [
    ['Kracht', kracht(a)],
    ['Precisie', a.precisie ? `${a.precisie}%` : '—'],
    ['PP', a.pp || '—'],
  ].map(([label, waarde]) => `<div class="aanvalcijfer">
      <span class="aanvalcijferlabel">${label}</span><span class="aanvalcijferwaarde">${esc(String(waarde))}</span>
    </div>`).join('');

  // De TM of HM waar deze aanval in zit, linkt door naar het voorwerp — daar staat wat hij kost
  // en waar hij te koop is.
  const tmhm = (a.tmhm || []).map((t) => `<a class="tmknop"
      href="${voorwerpUrl(t, seAan)}">${esc(t.naam)}</a>`).join('');

  // Wisselen van uitvoering: de aanval heet in beide hetzelfde, de soorten eronder niet.
  const wissel = dex && dex.seNamen ? `<div class="wissel wissel--klein" role="tablist"
      aria-label="Uitvoering">
      <button class="wisselknop${seAan ? '' : ' is-actief'}" data-se="0" role="tab"
        aria-selected="${!seAan}">${esc(dex.spel)}</button>
      <button class="wisselknop${seAan ? ' is-actief' : ''}" data-se="1" role="tab"
        aria-selected="${seAan}">Speciale Editie</button>
    </div>` : '';

  return `<a class="terug" href="aanvallen.html">← Alle aanvallen</a>
    <div class="dexkop">
      <h1>${esc(a.naam)}</h1>
      <p class="dextypen">${typeHtml(a)}${tmhm ? `<span class="tmhm">${tmhm}</span>` : ''}</p>
      ${wissel}
    </div>

    <div class="dexdetail">
      <section class="blok blok--breed">
        ${a.beschrijving ? `<p class="aanvaltekst">${esc(a.beschrijving)}</p>` : ''}
        <div class="aanvalcijfers">${cijfers}</div>
      </section>

      ${(a.leren || []).length ? `<section class="blok blok--breed">
        <h2>Leert het zelf</h2>
        ${monsterlijst(a.leren, true)}
      </section>` : ''}

      ${(a.viaTmhm || []).length ? `<section class="blok blok--breed">
        <h2>Via ${tmhm ? 'TM of HM' : 'een leraar'}</h2>
        ${monsterlijst(a.viaTmhm, false)}
      </section>` : ''}

      ${!(a.leren || []).length && !(a.viaTmhm || []).length ? `<section class="blok blok--breed">
        <p class="uitleg">Geen enkele soort leert deze aanval — hij bestaat wel in het spel,
          maar niemand krijgt hem.</p>
      </section>` : ''}
    </div>`;
}

function teken() {
  const gekozen = gevraagd('a');
  if (gekozen) {
    const aanval = lijst.aanvallen.find((a) => a.const === gekozen || a.pad === gekozen);
    $('pagina').innerHTML = aanval ? detailHtml(aanval)
      : `<a class="terug" href="aanvallen.html">← Alle aanvallen</a>
         <div class="fout-blok"><h1>Niet gevonden</h1><p>Deze aanval staat niet in de lijst.</p></div>`;
    document.title = aanval ? `${aanval.naam} — Aanvallen` : 'Aanvallen';
    for (const knop of document.querySelectorAll('[data-se]')) {
      knop.onclick = () => { seAan = zetSe(knop.dataset.se === '1'); teken(); };
    }
    return;
  }

  const zoek = zoekparam().get('q') || '';
  $('pagina').innerHTML = `
    <h1>Aanvallen</h1>
    <div class="dexbalk">
      <input id="zoek" type="search" placeholder="Zoek op naam, type of beschrijving" value="${esc(zoek)}"
             aria-label="Zoek een aanval">
    </div>
    <div id="lijst">${lijstHtml(zoek)}</div>`;
  const veld = $('zoek');
  if (veld) {
    veld.oninput = () => { $('lijst').innerHTML = lijstHtml(veld.value); };
    if (zoek) { veld.focus(); veld.setSelectionRange(zoek.length, zoek.length); }
  }
}

(async () => {
  const site = await laadSite().catch(() => ({}));
  merknaam(site.titel);
  $('voet').innerHTML = markdown(site.footer || '');

  try {
    lijst = await laadLijst('aanvallen');
    // De dex mag ontbreken; dan staan de soorten er zonder sprite.
    dex = await laadDex().catch(() => null);
  } catch (err) {
    console.error(err);
    $('pagina').innerHTML = `<a class="terug" href="index.html">← Terug naar de projecten</a>
      <div class="fout-blok"><h1>Aanvallen nog niet beschikbaar</h1>
      <p>Zodra een vertaling is afgerond, verschijnen ze hier.</p></div>`;
    return;
  }

  teken();
})();
