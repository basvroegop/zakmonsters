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

// De drie stappen die een regel doorloopt: eerst vertaald, dan door een tweede persoon
// geredigeerd, en uiteindelijk opgenomen in het spel zelf.
const BALKEN = [
  { sleutel: 'vertaald', label: 'Vertaald' },
  { sleutel: 'geredigeerd', label: 'Geredigeerd' },
  { sleutel: 'inSpel', label: 'In game' },
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

// Teaserplaat als achtergrond; ontbreekt hij, dan blijft de kleur uit het projectbestand over.
// Zo ziet een pas toegevoegd project er meteen af, ook voordat je een plaatje hebt gemaakt.
function teaserStijl(project) {
  const kleur = /^#[0-9a-f]{3,8}$/i.test(String(project.kleur || '')) ? project.kleur : '#3b4a63';
  const url = contentUrl(project.teaser);
  const plaat = url ? `background-image:url('${esc(url)}');` : '';
  return `--kaartkleur:${esc(kleur)};${plaat}`;
}

// De kaart is de plaat: die bevat de titel van het spel al, dus eronder staat geen naam meer.
// Twee dingen houden hem toch bruikbaar:
//   - de naam blijft in de aria-label staan, anders is de link voor een schermlezer naamloos
//     en voor een zoekmachine betekenisloos;
//   - is er géén plaat, dan verschijnt de naam wél in beeld. Anders zou een pas toegevoegd
//     project een leeg gekleurd vlak zijn waar niemand iets aan heeft.
export function kaartHtml(project, voortgang) {
  const naam = project.naam || project.id;
  const teaser = contentUrl(project.teaser);
  const pct = procentVan(project, voortgang);
  const omschrijving = [naam, statusVan(project).label, pct === null ? '' : `${pct}% vertaald`,
    project.samenvatting].filter(Boolean).join(' — ');
  // Het percentage staat rechtsonder tegenover de badge, met een dunne balk langs de onderrand.
  // Zo blijft de kaart één plaat, en zie je toch in één oogopslag hoe ver een project is.
  const balk = pct === null ? '' : `<span class="kaart-pct">${pct}%</span>
      <span class="kaart-balk${afKlasse(project)}" aria-hidden="true"><i style="width:${pct}%"></i></span>`;
  return `<a class="kaart${teaser ? '' : ' kaart--zonderplaat'}" href="project.html?p=${encodeURIComponent(project.id)}"
       aria-label="${esc(omschrijving)}">
      <span class="kaart-plaat" style="${teaserStijl(project)}">
        ${teaser ? '' : `<span class="kaart-naam">${esc(naam)}</span>`}
        ${statusHtml(project)}
        ${balk}
      </span>
    </a>`;
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
