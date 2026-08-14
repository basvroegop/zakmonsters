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

// Eén regel in een soortenlijst: sprite, nummer, naam en de typen. `bij` is wat er nog achter
// mag (het level waarop een aanval geleerd wordt, bijvoorbeeld).
export function dexRegelHtml(dex, soort, { naam, href, bij = '' } = {}) {
  return `<a class="dexknop" href="${esc(href || `pokedex.html?nr=${soort.nr}`)}">
      ${kleinSprite(dex, soort)}
      <span class="dexregel">
        <span class="dexnr">${nummer(soort.nr)}${bij ? ` <span class="dexbij">${esc(bij)}</span>` : ''}</span>
        <span class="dexnaam">${esc(naam || soort.naam)}</span>
        <span class="dextypen">${typenHtml(soort)}</span>
      </span>
    </a>`;
}

// De dexgegevens van het eerste (en enige) afgeronde project. Beide pagina's hebben ze nodig:
// de dex om alles te tonen, de aanvallenpagina om te weten hoe een soort eruitziet.
export async function laadDex() {
  const index = await (await fetch('content/pokedex/index.json', { cache: 'no-cache' })).json();
  const eerste = (index.dexen || [])[0];
  if (!eerste) throw new Error('geen dex');
  return (await fetch(`content/pokedex/${eerste.project}.json`, { cache: 'no-cache' })).json();
}
