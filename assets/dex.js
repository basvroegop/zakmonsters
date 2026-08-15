// Wat de Pokédex en de aanvallenpagina delen: de sprites uit de atlas en de regel waarmee een
// soort in een lijst staat. Beide pagina's tonen dezelfde lijst — op de dex alle 251, op een
// aanvalspagina wie hem leert — en dan hoort dat er ook hetzelfde uit te zien.

import { esc } from './content.js';

// De spelsprites zitten in één atlas per repo (content/sprites/<repo>.png): alle beestjes naast
// elkaar, 16 per rij. cms/pokedex.js zet per soort het vaknummer in de dexdata; hier schuiven we
// de atlas met background-position naar het juiste vak. Eén plaatje voor de hele dex, dus na het
// eerste sprite kost er geen enkele nog verkeer.
export const bronnenVan = (dex) => (dex && dex.sprites) || [];

export function spriteHtml(dex, soort, bron, schaal, klasse = '') {
  const vak = (soort.vakken || {})[bron.sleutel];
  if (vak === undefined) return '';
  const zijde = bron.grootte * schaal;
  const x = (vak % bron.kolommen) * zijde;
  const y = Math.floor(vak / bron.kolommen) * zijde;
  return `<span class="sprite${klasse ? ` ${klasse}` : ''}" aria-hidden="true" style="
      width:${zijde}px;height:${zijde}px;
      background-image:url('content/sprites/${esc(bron.bestand)}');
      background-position:-${x}px -${y}px;background-size:${bron.kolommen * zijde}px auto;"></span>`;
}

// Het kleine sprite naast een naam: altijd de eerste versie, want dat is het spel van deze dex
// zelf. Een keuze voor Goud of Zilver elders op de pagina verandert daar niets aan — anders
// zouden 251 lijstregels van uitvoering wisselen omdat je één sprite wilde vergelijken.
export function kleinSprite(dex, soort) {
  const bron = bronnenVan(dex)[0];
  return bron ? spriteHtml(dex, soort, bron, 1, 'sprite--klein') : '';
}

// De typetags. De naam komt uit de vertaling (IJS, VUUR), de kleur uit het type-id van het spel
// zelf — zo houdt een herziene term dezelfde kleur. Een onbekend type valt terug op grijs.
export function typenHtml(soort) {
  return (soort.typen || []).map((t) => {
    const naam = typeof t === 'string' ? t : t.naam;
    const sleutel = typeof t === 'string' ? '' : t.soort;
    return `<span class="type${sleutel ? ` type--${esc(sleutel)}` : ''}">${esc(String(naam).toLowerCase())}</span>`;
  }).join('');
}

export const nummer = (n) => String(n).padStart(3, '0');

// ---- Speciale Editie ----
// De keuze geldt voor de hele site: klik je vanaf de dexpagina van KNOPSAURUS door naar een
// aanval, dan hoort die pagina ook de namen van de Speciale Editie te tonen. Vandaar één plek
// waar het antwoord vandaan komt: `?se=1` in de URL als die er staat (zo kun je een link delen),
// anders wat de bezoeker eerder koos.
const SE_SLEUTEL = 'editie';

export function zetSe(aan) {
  try { localStorage.setItem(SE_SLEUTEL, aan ? '1' : '0'); } catch { /* privémodus */ }
  return aan;
}

export function seActief() {
  const p = new URLSearchParams(location.search);
  // Staat het in de URL, dan onthouden we dat meteen: wie op een gedeelde link naar de Speciale
  // Editie binnenkomt, blijft daarin doorklikken zonder het opnieuw aan te zetten.
  if (p.has('se')) return zetSe(p.get('se') === '1');
  try { return localStorage.getItem(SE_SLEUTEL) === '1'; } catch { return false; }
}

// De naam die bij de gekozen uitvoering hoort. Heeft een soort in de editie geen eigen naam,
// dan blijft het de gewone.
export const naamVoor = (iets, se) => (se && iets && iets.naamSe ? iets.naamSe : (iets || {}).naam);

// Eén regel in een soortenlijst: sprite, nummer, naam en de typen. `bij` is wat er nog achter
// mag (het level waarop een aanval geleerd wordt); met `metNummer: false` blijft het dexnummer
// weg — op een aanvalspagina zegt het level meer dan het nummer.
export function dexRegelHtml(dex, soort, { naam, href, bij = '', metNummer = true } = {}) {
  const voor = metNummer ? nummer(soort.nr) : '';
  return `<a class="dexknop" href="${esc(href || `pokedex.html?nr=${soort.nr}`)}">
      ${kleinSprite(dex, soort)}
      <span class="dexregel">
        ${voor || bij ? `<span class="dexnr">${voor}${bij
          ? `${voor ? ' ' : ''}<span class="dexbij">${esc(bij)}</span>` : ''}</span>` : ''}
        <span class="dexnaam">${esc(naam || soort.naam)}</span>
        <span class="dextypen">${typenHtml(soort)}</span>
      </span>
    </a>`;
}

// ---- Adressen ----
// Elke Pokémon, aanval en voorwerp heeft een eigen adres: /dex/knopsaurus/, /aanvallen/tackle/,
// /voorwerpen/hyperbal/. Die mappen maakt site/bouw.js bij het publiceren; daar zet hij ook
// `mooieUrls` aan. Zolang dat niet zo is (lokaal bekijken, de voorvertoning in het CMS) blijven
// het gewone vraagtekens — dan bestaan die mappen namelijk niet.
export const mooieUrls = () => typeof window !== 'undefined' && !!window.__mooieUrls;

// Het pad van een soort, aanval of voorwerp staat in de gegevens zelf (cms/pokedex.js rekent het
// uit, en lost daar meteen op dat twee dingen hetzelfde kunnen heten). Hier alleen nog de vraag:
// het mooie adres of de vraagteken-URL?
const metSe = (url, se) => (se ? `${url}${url.includes('?') ? '&' : '?'}se=1` : url);

export const dexUrl = (soort, se) => metSe(mooieUrls() && soort.pad
  ? `/dex/${soort.pad}/` : `pokedex.html?nr=${soort.nr}`, se);
export const aanvalUrl = (aanval, se) => metSe(mooieUrls() && aanval.pad
  ? `/aanvallen/${aanval.pad}/` : `aanvallen.html?a=${encodeURIComponent(aanval.const)}`, se);
export const voorwerpUrl = (voorwerp, se) => metSe(mooieUrls() && voorwerp.pad
  ? `/voorwerpen/${voorwerp.pad}/` : `voorwerpen.html?v=${encodeURIComponent(voorwerp.const)}`, se);

// Waar de pagina zelf over gaat. Op een eigen adres zet bouw.js dat in de pagina; anders staat
// het in de zoekbalk (?nr=, ?a=, ?v=).
export const gevraagd = (param) => (typeof window !== 'undefined' && window.__entiteit)
  || new URLSearchParams(location.search).get(param) || '';

// De gegevens van het eerste (en enige) afgeronde project: de dex, de aanvallen of de
// voorwerpen. Elke pagina heeft er minstens één nodig, en soms een tweede om ergens naartoe te
// kunnen linken.
export async function laadLijst(map) {
  const index = await (await fetch(`content/${map}/index.json`, { cache: 'no-cache' })).json();
  const eerste = (index.dexen || [])[0];
  if (!eerste) throw new Error(`geen ${map}`);
  return (await fetch(`content/${map}/${eerste.project}.json`, { cache: 'no-cache' })).json();
}

export const laadDex = () => laadLijst('pokedex');
