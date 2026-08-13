// De kopbalk: het menu, de merknaam en de nachtknop.
//
// De opmaak van de balk staat in elke pagina zelf (drie keer dezelfde tien regels HTML). Dat is
// bewust: zo staat het menu er meteen, ook als het ophalen van de inhoud misgaat of traag is.
// Wat hier gebeurt, is het beetje leven dat die balk nodig heeft.

const $ = (id) => document.getElementById(id);

// ---- Thema ----
// Het lichte thema is de standaard; het donkere staat achter deze knop en wordt onthouden.
// Het zetten van `data-thema` gebeurt níét hier maar in een scriptje in de <head> van elke
// pagina: dit bestand is een module en die draait pas na het tekenen, dus wie nacht heeft
// gekozen zou hier eerst een lichte flits zien.
const BEWAARD = 'thema';

export function themaknop() {
  const knop = $('themaknop');
  if (!knop) return;
  const bijwerken = () => {
    const donker = document.documentElement.dataset.thema === 'donker';
    knop.setAttribute('aria-pressed', String(donker));
    knop.setAttribute('title', donker ? 'Naar het lichte thema' : 'Naar het donkere thema');
    knop.setAttribute('aria-label', knop.getAttribute('title'));
  };
  knop.onclick = () => {
    const donker = document.documentElement.dataset.thema === 'donker';
    if (donker) delete document.documentElement.dataset.thema;
    else document.documentElement.dataset.thema = 'donker';
    try { localStorage.setItem(BEWAARD, donker ? 'licht' : 'donker'); } catch { /* privémodus */ }
    bijwerken();
  };
  bijwerken();
}

// ---- Menu ----
// De Pokédex bestaat alleen zolang er een afgerond project is. De ingang begint daarom
// verborgen en verschijnt pas als die gegevens er echt zijn; zo wijst het menu nooit naar een
// lege pagina. Op de dexpagina zelf staat hij al open — daar ben je immers.
export function dexMenu() {
  const item = $('menuDex');
  if (!item || !item.hidden) return;
  fetch('content/pokedex/index.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => { if (d && (d.dexen || []).length) item.hidden = false; })
    .catch(() => { /* geen dex, geen ingang */ });
}

// De naam in de balk volgt de titel uit site.json, zodat een naamswijziging in het CMS ook
// bovenaan doorkomt. Tot die binnen is, staat er wat er in de pagina staat.
export function merknaam(titel) {
  const merk = $('merknaam');
  if (merk && titel) merk.textContent = titel;
}

export function kopbalk() {
  themaknop();
  dexMenu();
}
