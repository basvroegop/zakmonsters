// Weergave die de home- en projectpagina delen: statuslabels, teaserkaarten en de
// voortgangsbalk. De pagina's zelf halen alleen de inhoud op en roepen dit aan.

import { esc, veiligeUrl, markdown } from './content.js';

export const STATUS = {
  voltooid: { label: 'Voltooid', klasse: 'is-voltooid' },
  bezig: { label: 'Mee bezig', klasse: 'is-bezig' },
  gepland: { label: 'Gepland', klasse: 'is-gepland' },
};

export function statusVan(project) {
  return STATUS[String(project.status || '').toLowerCase()] || STATUS.bezig;
}

export function statusHtml(project) {
  const s = statusVan(project);
  return `<span class="status ${s.klasse}">${esc(s.label)}</span>`;
}

// De balk hoort bij lopend werk. Bij een voltooid project zegt "Voltooid" alles, en een balk
// op 97% zou dat juist tegenspreken (er blijft in de editor altijd wat ruis staan).
export function voortgangHtml(project, voortgang) {
  if (statusVan(project) !== STATUS.bezig) return '';
  const cijfers = voortgang && voortgang[project.voortgang];
  if (!cijfers || !cijfers.totaal) return '';
  const pct = Math.max(0, Math.min(100, Math.round(cijfers.procent)));
  return `<div class="voortgang">
      <div class="voortgang-kop"><span>Vertaald</span><span class="voortgang-pct">${pct}%</span></div>
      <div class="balk" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"
           aria-label="Voortgang vertaling ${esc(project.naam || project.id)}"><i style="width:${pct}%"></i></div>
    </div>`;
}

// Een teaserpad in een projectbestand is relatief aan content/ — daar staan de platen ook, naast
// de projectbestanden die ernaar verwijzen. De pagina's staan een map hoger, dus zonder dit
// voorvoegsel zoekt de browser de plaat naast index.html en krijg je een 404 in plaats van
// een plaat.
export function teaserUrl(pad) {
  const url = veiligeUrl(pad || '');
  if (!url) return '';
  if (/^https?:/i.test(url) || url.startsWith('/') || url.startsWith('content/')) return url;
  return `content/${url}`;
}

// Teaserplaat als achtergrond; ontbreekt hij, dan blijft de kleur uit het projectbestand over.
// Zo ziet een pas toegevoegd project er meteen af, ook voordat je een plaatje hebt gemaakt.
function teaserStijl(project) {
  const kleur = /^#[0-9a-f]{3,8}$/i.test(String(project.kleur || '')) ? project.kleur : '#3b4a63';
  const url = teaserUrl(project.teaser);
  const plaat = url ? `background-image:url('${esc(url)}');` : '';
  return `--kaartkleur:${esc(kleur)};${plaat}`;
}

export function kaartHtml(project, voortgang) {
  const naam = esc(project.naam || project.id);
  const teaser = teaserUrl(project.teaser);
  return `<a class="kaart${teaser ? '' : ' kaart--zonderplaat'}" href="project.html?p=${encodeURIComponent(project.id)}">
      <span class="kaart-plaat" style="${teaserStijl(project)}" aria-hidden="true"></span>
      <span class="kaart-inhoud">
        <span class="kaart-kop"><span class="kaart-naam">${naam}</span>${statusHtml(project)}</span>
        ${project.samenvatting ? `<span class="kaart-tekst">${esc(project.samenvatting)}</span>` : ''}
        ${voortgangHtml(project, voortgang)}
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
