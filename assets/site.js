// Weergave die de home- en projectpagina delen: statuslabels, teaserkaarten en de
// voortgangsbalk. De pagina's zelf halen alleen de inhoud op en roepen dit aan.

import { esc, veiligeUrl, contentUrl, markdown } from './content.js';

export const STATUS = {
  voltooid: { label: 'Voltooid', klasse: 'is-voltooid', rang: 0 },
  bezig: { label: 'Mee bezig', klasse: 'is-bezig', rang: 1 },
  gepland: { label: 'Gepland', klasse: 'is-gepland', rang: 2 },
};

export function statusVan(project) {
  return STATUS[String(project.status || '').toLowerCase()] || STATUS.bezig;
}

// De volgorde binnen een generatie ligt niet in het contentbestand maar hier: afgeronde
// projecten eerst, dan lopend werk, dan wat nog moet beginnen; binnen dezelfde status op naam.
// Zo hoeft niemand een lijst bij te houden en klopt de volgorde vanzelf zodra een status wijzigt.
export function sorteerProjecten(projecten) {
  return [...projecten].sort((a, b) =>
    statusVan(a).rang - statusVan(b).rang ||
    String(a.naam || a.id).localeCompare(String(b.naam || b.id), 'nl'));
}

export function statusHtml(project) {
  const s = statusVan(project);
  return `<span class="status ${s.klasse}">${esc(s.label)}</span>`;
}

// Het percentage van een project, of null als er niets te tonen valt.
//
// Een voltooid project staat altijd op 100%, ongeacht wat de editor zegt. Daar blijft namelijk
// altijd wat ruis in staan (regels die niet vertaald hoeven worden), en "Voltooid" naast een
// balk op 97% spreekt zichzelf tegen. De status is de bron van waarheid, het cijfer is de
// toelichting.
export function procentVan(project, voortgang) {
  if (statusVan(project) === STATUS.voltooid) return 100;
  const cijfers = voortgang && voortgang[project.voortgang];
  if (!cijfers || !cijfers.totaal) return null;
  return Math.max(0, Math.min(100, Math.round(cijfers.procent)));
}

// Een afgerond project krijgt een groene balk: dezelfde kleur als de badge "Voltooid", zodat
// kleur en label hetzelfde zeggen in plaats van elk iets anders.
const afKlasse = (project) => (statusVan(project) === STATUS.voltooid ? ' is-af' : '');

// De twee stappen die we tonen: eerst vertaald, dan door een tweede persoon geredigeerd. De
// laatste stap ("In game") laten we bewust weg — die maakte het voortgangsblok hoger dan nodig
// en zei voor de bezoeker weinig extra's boven op vertaald/geredigeerd.
const BALKEN = [
  { sleutel: 'vertaald', label: 'Vertaald' },
  { sleutel: 'geredigeerd', label: 'Geredigeerd' },
];

export function voortgangHtml(project, voortgang) {
  const af = statusVan(project) === STATUS.voltooid;
  const cijfers = voortgang && voortgang[project.voortgang];
  if (!af && (!cijfers || !cijfers.totaal)) return '';

  const rijen = BALKEN.map(({ sleutel, label }) => {
    const waarde = cijfers ? cijfers[sleutel] : null;
    // Een stap waarover de editor niets zegt, laten we weg. Anders zou een ontbrekend cijfer
    // als "0%" op de site verschijnen, en dat is een bewering die we niet kunnen waarmaken.
    if (!af && (waarde === null || waarde === undefined)) return '';
    const pct = af ? 100 : Math.max(0, Math.min(100, Math.round((Number(waarde) || 0) / cijfers.totaal * 100)));
    return `<div class="voortgang-rij">
        <div class="voortgang-kop"><span>${label}</span><span class="voortgang-pct">${pct}%</span></div>
        <div class="balk${afKlasse(project)}" role="progressbar" aria-valuenow="${pct}"
             aria-valuemin="0" aria-valuemax="100"
             aria-label="${label} — ${esc(project.naam || project.id)}"><i style="width:${pct}%"></i></div>
      </div>`;
  }).filter(Boolean).join('');

  return rijen ? `<div class="voortgang">${rijen}</div>` : '';
}

// De kleur van een project; die vult het vlak zolang er geen plaat is.
const kleurVan = (project) =>
  (/^#[0-9a-f]{3,8}$/i.test(String(project.kleur || '')) ? project.kleur : '#3b4a63');

// De plaat staat als afbeelding in de kaart, niet als achtergrond. Zo bepaalt de plaat zélf hoe
// hoog het vlak wordt: niets wordt bijgesneden en er blijven geen gekleurde randen over. De
// platen komen in allerlei verhoudingen binnen (een Game Boy-titelscherm is bijna vierkant, een
// schermafdruk breed) en elke kaart neemt gewoon de zijne over.
function plaatHtml(project) {
  const url = contentUrl(project.teaser);
  if (!url) return '';
  return `<img class="plaat" src="${esc(url)}" alt="" loading="lazy">`;
}

// Een tweede plaat, die bij muis-erover over de eerste heen komt. Bedoeld voor projecten die
// eigenlijk twee spellen zijn (Rood/Blauw, Goud/Zilver): dan draagt de kaart ze allebei zonder
// dat er een tweede kaart bij hoeft.
//
// Het is een eigen laag in plaats van een omgewisselde achtergrond, want zo staat de tweede
// plaat al ingeladen vóór de muis er is — anders zie je bij de eerste keer een wit vlak.
// Zonder tweede plaat komt er niets bij; de kaart blijft dan precies wat hij was.
export { plaatHtml };

export function tweedePlaatHtml(project) {
  const url = contentUrl(project.teaser2);
  if (!url || !contentUrl(project.teaser)) return '';
  return `<img class="plaat plaat-twee" src="${esc(url)}" alt="" aria-hidden="true" loading="lazy">`;
}

// De kaart is de plaat: die bevat de titel van het spel al, dus eronder staat geen naam meer.
// Twee dingen houden hem toch bruikbaar:
//   - de naam blijft in de aria-label staan, anders is de link voor een schermlezer naamloos
//     en voor een zoekmachine betekenisloos;
//   - is er géén plaat, dan verschijnt de naam wél in beeld. Anders zou een pas toegevoegd
//     project een leeg gekleurd vlak zijn waar niemand iets aan heeft.
// Het adres van een project. Bij het publiceren krijgt elk project een eigen map in de wortel
// (/geel/, /goud-zilver/) — zie site/bouw.js; die zet ook de vlag waaraan we dat hier zien.
// Lokaal en in de voorvertoning van het CMS bestaan die mappen niet, en blijft het de
// vraagteken-URL. `slug` wint van het bestands-id, zodat `rood.md` op /rood-blauw/ mag staan.
const mooieUrls = () => typeof window !== 'undefined' && !!window.__mooieUrls;

export function projectUrl(project, opties = {}) {
  const mooi = opties.mooieUrls != null ? opties.mooieUrls : mooieUrls();
  const slug = String((project && project.slug) || (project && project.id) || '').trim();
  return mooi && /^[a-z0-9][a-z0-9-]*$/.test(slug)
    ? `/${slug}/` : `project.html?p=${encodeURIComponent((project || {}).id || '')}`;
}

export function kaartHtml(project, voortgang, opties = {}) {
  const naam = project.naam || project.id;
  const teaser = contentUrl(project.teaser);
  const pct = procentVan(project, voortgang);
  const omschrijving = [naam, statusVan(project).label, pct === null ? '' : `${pct}% vertaald`,
    project.samenvatting].filter(Boolean).join(' — ');
  // Het percentage staat rechtsonder tegenover de badge, met een dunne balk langs de onderrand.
  // Zo blijft de kaart één plaat, en zie je toch in één oogopslag hoe ver een project is.
  const balk = pct === null ? '' : `<span class="kaart-pct">${pct}%</span>
      <span class="kaart-balk${afKlasse(project)}" aria-hidden="true"><i style="width:${pct}%"></i></span>`;
  return `<a class="kaart${teaser ? '' : ' kaart--zonderplaat'}" href="${esc(projectUrl(project, opties))}"
       aria-label="${esc(omschrijving)}">
      <span class="kaart-plaat" style="--kaartkleur:${esc(kleurVan(project))}">
        ${plaatHtml(project)}
        ${tweedePlaatHtml(project)}
        ${teaser ? '' : `<span class="kaart-naam">${esc(naam)}</span>`}
        ${statusHtml(project)}
        ${balk}
      </span>
    </a>`;
}

// Het raster met schermafdrukken op de projectpagina. Elke afdruk is een link naar zichzelf:
// in de zijkolom passen er maar kleine plaatjes, en wie wil zien wat er in beeld staat, klikt
// hem op ware grootte open. Geen lichtbak met eigen sluitknop en toetsafhandeling — de browser
// kan dit al, en op een telefoon werkt zoomen daar beter dan in een overlay.
//
// Zonder afdrukken komt er niets: dan hoort er ook geen leeg kader met een belofte te staan.
// Hoeveel afdrukken meteen zichtbaar zijn: twee rijen van twee. Zo blijft het blok ongeveer even
// hoog als de plaat ernaast, ongeacht hoeveel schermafdrukken een project heeft. De rest komt
// achter een "(XX meer…)"-uitklap, die de bezoeker alleen opent als hij ze echt wil zien.
const SCHERMEN_ZICHTBAAR = 4;

export function schermafdrukkenHtml(project) {
  const lijst = (Array.isArray(project.schermafdrukken) ? project.schermafdrukken : [])
    .map((s) => (typeof s === 'string' ? { pad: s } : s))
    .map((s) => ({ url: contentUrl(s && s.pad), bijschrift: (s && s.bijschrift) || '' }))
    .filter((s) => s.url);
  if (!lijst.length) return '';
  const naam = project.naam || project.id;
  const vak = (s, i) => `
      <a class="schermvak" href="${esc(s.url)}" target="_blank" rel="noopener"
         aria-label="${esc(s.bijschrift || `Schermafdruk ${i + 1} van ${naam}`)} — open op ware grootte">
        <img src="${esc(s.url)}" alt="${esc(s.bijschrift)}" loading="lazy">
      </a>`;
  const raster = (rijen) => `<div class="schermraster">${rijen.join('')}</div>`;
  if (lijst.length <= SCHERMEN_ZICHTBAAR) {
    return raster(lijst.map(vak));
  }
  const zichtbaar = lijst.slice(0, SCHERMEN_ZICHTBAAR);
  const rest = lijst.slice(SCHERMEN_ZICHTBAAR);
  return `${raster(zichtbaar.map(vak))}
    <details class="schermmeer">
      <summary>(${rest.length} meer…)</summary>
      ${raster(rest.map((s, i) => vak(s, i + SCHERMEN_ZICHTBAAR)))}
    </details>`;
}

export function downloadsHtml(project) {
  const lijst = Array.isArray(project.downloads) ? project.downloads : [];
  const knoppen = lijst
    .map((d) => (typeof d === 'string' ? { label: d, url: d } : d))
    .filter((d) => d && veiligeUrl(d.url))
    .map((d) => `<a class="knop knop--download" href="${esc(veiligeUrl(d.url))}" target="_blank" rel="noopener">
        <span class="knop-label">${esc(d.label || 'Download')}</span>
        ${d.toelichting ? `<span class="knop-sub">${esc(d.toelichting)}</span>` : ''}
      </a>`);
  if (!knoppen.length) {
    return `<p class="leeg">Er staat nog geen patch klaar voor dit project. Zodra er iets
      speelbaars is, verschijnt de download hier.</p>`;
  }
  return `<div class="downloads">${knoppen.join('')}</div>`;
}

export function tekstHtml(bron) {
  return markdown(bron);
}
