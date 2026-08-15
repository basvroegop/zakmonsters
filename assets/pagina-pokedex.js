// De pokedex-pagina. Staat als los bestand zodat elke Pokémon,
// aanval en voorwerp een eigen adres kan krijgen zonder dit script te herhalen.

import { esc, markdown, laadSite } from './content.js';
import { kopbalk, merknaam } from './kop.js';
import { bronnenVan, spriteHtml, kleinSprite, typenHtml, nummer, dexRegelHtml, laadDex,
  seActief, zetSe, dexUrl, aanvalUrl, voorwerpUrl, gevraagd, laadLijst } from './dex.js';

kopbalk();

const $ = (id) => document.getElementById(id);
const zoekparam = () => new URLSearchParams(location.search);

// De dex is één bestand met alle soorten. Dat haalt de browser één keer op; daarna klikt alles
// zonder verder verkeer — vandaar dat sorteren en zoeken hier gebeurt en niet op een server.
let dex = null;
let seAan = false;
// Welke versie van de sprite je op de detailpagina ziet. Elke Pokémon is een eigen pagina, dus
// zonder geheugen zou de keuze bij de eerste klik weer op Kristal springen — precies wanneer je
// aan het vergelijken bent. Vandaar dat hij bewaard blijft, net als het thema.
const SPRITEKEUZE = 'dexsprite';
let spriteBron = (() => { try { return localStorage.getItem(SPRITEKEUZE); } catch { return null; } })();

const naamVan = (s) => (seAan && s.naamSe ? s.naamSe : s.naam);

// De adressen van aanvallen en voorwerpen staan in hún lijsten, niet in de dexdata. Die halen we
// er los bij; lukt dat niet, dan blijft het een vraagteken-URL en werkt de link nog steeds.
let aanvallijst = null;
let voorwerplijst = null;
const aanvalVan = (constante, naam) =>
  (aanvallijst && aanvallijst.find((a) => a.const === constante)) || { const: constante, naam };
const voorwerpVan = (constante, naam) =>
  (voorwerplijst && voorwerplijst.find((v) => v.const === constante)) || { const: constante, naam };

// De sprites, de typetags en de regels van de lijst deelt deze pagina met de aanvallenpagina;
// ze staan in assets/dex.js. Hier alleen nog wat deze pagina er zelf omheen doet.
const bronnen = () => bronnenVan(dex);

// De versie die rechtsboven staat, of de eerste als er nog niets gekozen is.
function gekozenBron() {
  const lijst = bronnen();
  return lijst.find((b) => b.sleutel === spriteBron) || lijst[0] || null;
}

// Alleen nog voor de pagina die niets te tonen heeft: daar hoort een uitweg in beeld te staan.
const TERUG = '<a class="terug" href="index.html">← Terug naar de projecten</a>';

function knoppenbalk(zoek) {
  return `<div class="dexbalk">
      <input id="zoek" type="search" placeholder="Zoek op naam of nummer" value="${esc(zoek || '')}"
             aria-label="Zoek een Pokémon">
      ${dex.seNamen ? `<div class="wissel">
        <button class="wisselknop${seAan ? '' : ' is-actief'}" data-se="0">${esc(dex.spel)}</button>
        <button class="wisselknop${seAan ? ' is-actief' : ''}" data-se="1">Speciale Editie</button>
      </div>` : ''}
    </div>`;
}

function lijstHtml(zoek) {
  const term = String(zoek || '').trim().toLowerCase();
  const treffers = dex.soorten.filter((s) => !term
    || naamVan(s).toLowerCase().includes(term)
    || s.naam.toLowerCase().includes(term)
    || String(s.nr) === term.replace(/^0+/, ''));
  if (!treffers.length) return '<p class="leeg">Geen Pokémon gevonden.</p>';
  return `<div class="dexlijst">${treffers.map((s) => dexRegelHtml(dex, s, {
    naam: naamVan(s),
    href: dexUrl(s, seAan),
  })).join('')}</div>`;
}

// De namen van de basiswaarden komen mee uit de vertaling zelf (AANVAL, AFWEER, …), zodat de
// dex dezelfde termen gebruikt als het spel in plaats van een eigen lijstje.
const statNaam = (sleutel) => (dex.statLabels || {})[sleutel] || sleutel;

// ---- Evolutielijn ----
// Niet alleen de volgende stap, maar de hele reeks: waar dit beestje vandaan komt en waar het
// heen gaat. De dexdata kent alleen de stap vooruit (`evoluties`), dus de stap terug leiden we
// af door te zoeken wie er naar deze soort evolueert.
//
// Het resultaat is een rijtje stadia; een stadium kan meerdere soorten bevatten, want een lijn
// splitst soms (Eevee, Poliwhirl). Elke soort draagt de voorwaarde waarmee je hém bereikt.
function evolutielijn(soort) {
  const perNr = new Map(dex.soorten.map((s) => [s.nr, s]));
  const ouderVan = (nr) => dex.soorten.find((s) => (s.evoluties || []).some((e) => e.naar === nr));

  // Naar de basisvorm klimmen. De teller is een noodrem: raakt er ooit een kringetje in de
  // tabel, dan hoort deze pagina niet te blijven hangen maar gewoon iets te tonen.
  let wortel = soort;
  for (let stap = 0; stap < 5; stap++) {
    const ouder = ouderVan(wortel.nr);
    if (!ouder || ouder.nr === wortel.nr) break;
    wortel = ouder;
  }

  const stadia = [[{ soort: wortel, hoe: '' }]];
  const gezien = new Set([wortel.nr]);
  for (let stap = 0; stap < 4; stap++) {
    const volgend = [];
    for (const { soort: s } of stadia[stadia.length - 1]) {
      for (const e of s.evoluties || []) {
        if (!e.naar || !perNr.has(e.naar) || gezien.has(e.naar)) continue;
        gezien.add(e.naar);
        volgend.push({ soort: perNr.get(e.naar), hoe: e.hoe });
      }
    }
    if (!volgend.length) break;
    stadia.push(volgend);
  }
  return stadia;
}

function evolutieHtml(soort) {
  const stadia = evolutielijn(soort);
  // Eén stadium betekent: geen voorganger en geen opvolger. Dan is een lijn met één vakje
  // alleen maar omslachtig.
  if (stadia.length < 2) return '<p class="uitleg">Evolueert niet.</p>';

  const kaart = ({ soort: m, hoe }) => {
    const huidig = m.nr === soort.nr;
    const inhoud = `${kleinSprite(dex, m)}<span class="evotekst">
        <span class="evonaam">${esc(naamVan(m))}</span>
        ${hoe ? `<span class="evohoe">${esc(hoe)}</span>` : ''}
      </span>`;
    // De soort waar je al naar kijkt is geen link maar een markering: die brengt je nergens.
    return huidig
      ? `<span class="evomon is-huidig" aria-current="true">${inhoud}</span>`
      : `<a class="evomon" href="${dexUrl(m, seAan)}">${inhoud}</a>`;
  };

  // De pijl hoort bij het stadium dat erop volgt, niet los ertussen: valt de lijn over twee
  // regels, dan gaat hij mee naar beneden in plaats van als losse punt achter te blijven.
  return `<div class="evolijn">${stadia.map((stadium, i) => `
      <div class="evostap">
        ${i ? '<span class="evopijl" aria-hidden="true">→</span>' : ''}
        <div class="evostadium">${stadium.map(kaart).join('')}</div>
      </div>`).join('')}</div>`;
}

function detailHtml(s) {
  const stats = Object.entries(s.stats || {})
    .map(([sleutel, waarde]) => `<div class="statrij">
        <span>${esc(statNaam(sleutel))}</span>
        <span class="statwaarde">${waarde}</span>
        <span class="balk" aria-hidden="true"><i style="width:${Math.min(100, Math.round(waarde / 255 * 100))}%"></i></span>
      </div>`).join('');

  const evoluties = evolutieHtml(s);

  // Het sprite rechtsboven: één groot beeld van de gekozen versie, met knoppen eronder om
  // tussen Kristal, Goud en Zilver te wisselen. Naast elkaar zetten kon ook, maar dan vergelijk
  // je drie kleine plaatjes; zo zie je er één groot en wissel je ertussen.
  const plaat = (() => {
    const bron = gekozenBron();
    if (!bron) return '';
    const beeld = spriteHtml(dex, s, bron, 3, 'sprite--groot');
    if (!beeld) return '';
    const knoppen = bronnen().length > 1
      ? `<div class="wissel wissel--klein" role="tablist" aria-label="Spelversie">
          ${bronnen().map((b) => `<button class="wisselknop${b.sleutel === bron.sleutel ? ' is-actief' : ''}"
              data-sprite="${esc(b.sleutel)}" role="tab"
              aria-selected="${b.sleutel === bron.sleutel}">${esc(b.label)}</button>`).join('')}
        </div>`
      : '';
    return `<figure class="dexplaat">${beeld}${knoppen}</figure>`;
  })();

  // De beschrijving uit elk spel, met erbij uit welk spel hij komt: Goud, Zilver en Kristal
  // vertellen over hetzelfde beestje elk een ander verhaal, en dat is precies wat een dex leuk
  // maakt.
  const dexen = s.dexen || [];
  // De soortnaam (ZAAD, VLAM) staat onder de naam bovenaan zolang de spellen het erover eens
  // zijn. Zijn ze het oneens, dan hoort hij per spel bij zijn eigen beschrijving.
  const categorieën = [...new Set(dexen.map((d) => d.categorie).filter(Boolean))];
  const soortnaam = categorieën.length === 1 ? categorieën[0] : '';
  const beschrijving = dexen.length
    ? `<dl class="beschrijvingen">${dexen.map((d) => `
          <div class="beschrijving">
            <dt>${esc(d.label)}${categorieën.length > 1 && d.categorie ? ` <span class="dexmeta">${esc(d.categorie)}</span>` : ''}</dt>
            <dd>${esc(d.tekst)}</dd>
          </div>`).join('')}
       </dl>`
    : '';

  // Heet dit beestje in de andere uitvoering anders, dan staat die naam er grijs achter:
  // VENUSAUR (VENUSAURUS). Welke van de twee vooraan staat, hangt af van de uitvoering die je
  // hebt openstaan — zo lees je in één regel hoe hij in het andere spel heet.
  const anderenaam = s.naamSe && s.naamSe !== s.naam ? (seAan ? s.naam : s.naamSe) : '';

  // Wat deze soort met een TM of HM leert, en wat een leraar hem kan bijbrengen. Dat zijn twee
  // verschillende dingen — voor een TM loop je naar een winkel, voor een leraar naar één persoon
  // — dus staan ze in een eigen blok. De aanval linkt naar zijn eigen pagina, de TM naar het
  // voorwerp; de beschrijving staat erbij, net als in de levellijst.
  const aanvalstabel = (rijen, bronkop) => `<table class="aanvallen">
      <thead><tr><th>${bronkop}</th><th>Aanval</th><th>Kracht</th></tr></thead><tbody>
        ${rijen.map((t) => `<tr>
          <td>${t.voorwerp
            ? `<a href="${voorwerpUrl(voorwerpVan(t.voorwerp, t.bron), seAan)}">${esc(t.bron)}</a>`
            : esc(t.bron)}</td>
          <td><a href="${aanvalUrl(aanvalVan(t.aanval, t.naam), seAan)}">${esc(t.naam)}</a>${t.uitleg
            ? `<span class="aanvaluitleg">${esc(t.uitleg)}</span>` : ''}</td>
          <td class="kracht">${t.kracht || '—'}</td>
        </tr>`).join('')}
      </tbody></table>`;
  const viaTm = (s.tmhm || []).filter((t) => t.bron !== 'leraar');
  const viaLeraar = (s.tmhm || []).filter((t) => t.bron === 'leraar');

  const aanvallen = (s.aanvallen || []).length
    ? `<table class="aanvallen"><thead><tr><th>Level</th><th>Aanval</th><th>Kracht</th></tr></thead><tbody>
        ${s.aanvallen.map((a) => `<tr>
          <td>${a.level === 1 ? '—' : a.level}</td>
          <td>${a.aanval
            ? `<a href="${aanvalUrl(aanvalVan(a.aanval, a.naam), seAan)}">${esc(a.naam)}</a>`
            : esc(a.naam)}${a.uitleg ? `<span class="aanvaluitleg">${esc(a.uitleg)}</span>` : ''}</td>
          <td class="kracht">${a.kracht || '—'}</td>
        </tr>`).join('')}
      </tbody></table>`
    : '<p class="uitleg">Geen aanvallen door levelen.</p>';

  return `<a class="terug" href="pokedex.html${seAan ? '?se=1' : ''}">← Alle Pokémon</a>
    <div class="dexboven">
      <div class="dexkop">
        <span class="dexnr dexnr--groot">${nummer(s.nr)}</span>
        <h1>${esc(naamVan(s))}${anderenaam ? ` <span class="naam-anders">(${esc(anderenaam)})</span>` : ''}</h1>
        ${soortnaam ? `<p class="dexsoort">${esc(soortnaam)}</p>` : ''}
        <p class="dextypen">${typenHtml(s)}</p>
      </div>
      ${plaat}
    </div>

    <div class="dexdetail">
      ${beschrijving ? `<section class="blok blok--breed"><h2>Pokédex</h2>${beschrijving}</section>` : ''}
      <section class="blok"><h2>Basiswaarden</h2><div class="stats">${stats}</div></section>
      <section class="blok blok--evolutie"><h2>Evolutie</h2>${evoluties}</section>
      <section class="blok blok--breed"><h2>Aanvallen per level</h2>${aanvallen}</section>
      <section class="blok blok--breed"><h2>Met TM of HM</h2>${viaTm.length
        ? aanvalstabel(viaTm, 'TM of HM')
        : '<p class="uitleg">Leert niets met een TM of HM.</p>'}</section>
      ${viaLeraar.length ? `<section class="blok blok--breed"><h2>Van een leraar</h2>
        ${aanvalstabel(viaLeraar, 'Leraar')}</section>` : ''}
    </div>`;
}

function teken() {
  // Op een eigen adres (/dex/knopsaurus/) staat de naam in de pagina; anders komt het nummer
  // uit de zoekbalk.
  const gekozen = gevraagd('nr');
  if (gekozen) {
    const soort = /^\d+$/.test(String(gekozen))
      ? dex.soorten.find((s) => s.nr === Number(gekozen))
      : dex.soorten.find((s) => s.pad === gekozen);
    $('pagina').innerHTML = soort ? detailHtml(soort)
      : `<a class="terug" href="pokedex.html">← Alle Pokémon</a>
         <div class="fout-blok"><h1>Niet gevonden</h1><p>Deze Pokémon staat niet in de dex.</p></div>`;
    document.title = soort ? `${naamVan(soort)} — Pokédex` : 'Pokédex';
  } else {
    const zoek = zoekparam().get('q') || '';
    // Geen "terug naar de site" boven de lijst: dat is precies wat de kopbalk doet.
    $('pagina').innerHTML = `
      <h1>Pokédex</h1>
      ${knoppenbalk(zoek)}
      <div id="lijst">${lijstHtml(zoek)}</div>`;
    const veld = $('zoek');
    if (veld) {
      veld.oninput = () => { $('lijst').innerHTML = lijstHtml(veld.value); };
      if (zoek) { veld.focus(); veld.setSelectionRange(zoek.length, zoek.length); }
    }
  }

  for (const knop of document.querySelectorAll('[data-se]')) {
    knop.onclick = () => {
      seAan = zetSe(knop.dataset.se === '1');
      const p = zoekparam();
      if (seAan) p.set('se', '1'); else p.delete('se');
      history.replaceState(null, '', `?${p}`);
      teken();
    };
  }

  // Wisselen van spelversie voor het sprite rechtsboven.
  for (const knop of document.querySelectorAll('[data-sprite]')) {
    knop.onclick = () => {
      spriteBron = knop.dataset.sprite;
      try { localStorage.setItem(SPRITEKEUZE, spriteBron); } catch { /* privémodus */ }
      teken();
    };
  }
}

(async () => {
  const site = await laadSite().catch(() => ({}));
  merknaam(site.titel);
  $('voet').innerHTML = markdown(site.footer || '');

  try {
    dex = await laadDex();
    // Op een detailpagina staan verwijzingen naar aanvallen en voorwerpen, en daarvoor moeten we
    // hun adressen kennen. Alleen dán halen we die twee lijsten op: de overzichtspagina heeft ze
    // niet nodig en hoeft er dus ook niet op te wachten.
    if (gevraagd('nr')) {
      const [a, v] = await Promise.all([
        laadLijst('aanvallen').catch(() => null),
        laadLijst('voorwerpen').catch(() => null),
      ]);
      aanvallijst = a && a.aanvallen;
      voorwerplijst = v && v.voorwerpen;
    }
  } catch (err) {
    console.error(err);
    $('pagina').innerHTML = `${TERUG}<div class="fout-blok"><h1>Pokédex nog niet beschikbaar</h1>
      <p>Zodra een vertaling is afgerond, verschijnt hij hier.</p></div>`;
    return;
  }

  // De uitvoering geldt voor de hele site; `?se=1` in de URL wint, zodat een gedeelde link
  // opent waar hij op wijst.
  seAan = seActief();
  teken();
})();
