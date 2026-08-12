// Inhoud inlezen: het contentbestand blijft daardoor gewone tekst die je met elke editor
// aanpast, zonder bouwstap. Twee kleine parsers, allebei bewust een deelverzameling:
//   - frontmatter: de blokjes tussen --- boven een projectbestand (sleutel/waarde + lijsten);
//   - markdown:    koppen, alinea's, lijsten, links, nadruk.
// Meer dan dat heeft deze site niet nodig, en een deelverzameling die je in één zitting
// helemaal kunt lezen is hier meer waard dan een volledige parser uit een pakket.

// ---- Ontsnappen ----
// Alles wat uit een contentbestand komt, gaat hier eerst doorheen. De inhoud is van onszelf,
// maar HTML in een tekstbestand hoort tekst te blijven — anders breekt één losse < de pagina.
export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Alleen adressen waarvan we weten dat ze veilig navigeren. `javascript:` in een contentbestand
// is nooit de bedoeling, dus die valt hier stil weg in plaats van dat hij ergens actief wordt.
export function veiligeUrl(url) {
  const v = String(url == null ? '' : url).trim();
  if (/^(https?:|mailto:)/i.test(v)) return v;
  if (/^[a-zA-Z0-9._~\-/#?]/.test(v) && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(v)) return v; // relatief pad
  return '';
}

// Paden naar platen en in-line afbeeldingen staan in een contentbestand relatief aan content/ —
// daar liggen ze ook, naast de bestanden die ernaar verwijzen. De pagina's staan een map hoger,
// dus zonder dit voorvoegsel zoekt de browser ze naast index.html en krijg je een 404.
export function contentUrl(pad) {
  const url = veiligeUrl(pad || '');
  if (!url) return '';
  if (/^https?:/i.test(url) || url.startsWith('/') || url.startsWith('content/')) return url;
  return `content/${url}`;
}

// ---- Frontmatter ----
// Ondersteund:
//   sleutel: waarde
//   sleutel:
//     - waarde
//   sleutel:
//     - subsleutel: waarde
//       subsleutel: waarde
function parseWaarde(ruw) {
  const v = String(ruw).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

export function parseFrontmatter(tekst) {
  const bron = String(tekst).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = bron.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: bron };
  const data = {};
  let sleutel = null;   // sleutel waar losse lijstregels bij horen
  let item = null;      // laatst begonnen lijst-item (object), voor vervolgregels

  for (const regel of m[1].split('\n')) {
    if (!regel.trim() || regel.trim().startsWith('#')) continue;
    const lijst = regel.match(/^\s*-\s+(.*)$/);
    if (lijst && sleutel) {
      const paar = lijst[1].match(/^([A-Za-z0-9_]+):\s*(.*)$/);
      if (paar) {
        item = { [paar[1]]: parseWaarde(paar[2]) };
        data[sleutel].push(item);
      } else {
        item = null;
        data[sleutel].push(parseWaarde(lijst[1]));
      }
      continue;
    }
    // Vervolgregel binnen een lijst-item: dieper ingesprongen dan de streep.
    const vervolg = regel.match(/^\s{4,}([A-Za-z0-9_]+):\s*(.*)$/);
    if (vervolg && item) { item[vervolg[1]] = parseWaarde(vervolg[2]); continue; }

    const paar = regel.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!paar) continue;
    item = null;
    if (paar[2].trim() === '') { sleutel = paar[1]; data[sleutel] = []; }
    else { sleutel = null; data[paar[1]] = parseWaarde(paar[2]); }
  }
  // Een sleutel die wel een dubbele punt had maar geen lijstregels kreeg, is leeg bedoeld.
  for (const [k, v] of Object.entries(data)) if (Array.isArray(v) && !v.length) delete data[k];
  return { data, body: bron.slice(m[0].length) };
}

// ---- Markdown ----
function inline(tekst) {
  let uit = esc(tekst);
  // Afbeelding vóór link, anders eet de linkregel de ! op.
  // In-line afbeelding: `![omschrijving](afbeeldingen/kaart.png)`. Het pad loopt via contentUrl,
  // net als een teaser, zodat je in de tekst gewoon naar content/ kunt verwijzen. loading=lazy
  // omdat een projectpagina er een handvol kan bevatten.
  uit = uit.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => {
    const url = contentUrl(src);
    return url ? `<img src="${esc(url)}" alt="${alt}" loading="lazy">` : '';
  });
  uit = uit.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (heel, tekst_, href) => {
    const url = veiligeUrl(href);
    if (!url) return tekst_;
    const extern = /^https?:/i.test(url);
    return `<a href="${esc(url)}"${extern ? ' target="_blank" rel="noopener"' : ''}>${tekst_}</a>`;
  });
  uit = uit.replace(/`([^`]+)`/g, '<code>$1</code>');
  uit = uit.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  uit = uit.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  return uit;
}

export function markdown(tekst) {
  const regels = String(tekst == null ? '' : tekst).replace(/\r\n?/g, '\n').split('\n');
  const uit = [];
  let alinea = [];
  let lijst = null; // 'ul' | 'ol'

  const sluitAlinea = () => { if (alinea.length) { uit.push(`<p>${inline(alinea.join(' '))}</p>`); alinea = []; } };
  const sluitLijst = () => { if (lijst) { uit.push(`</${lijst}>`); lijst = null; } };
  const sluitAlles = () => { sluitAlinea(); sluitLijst(); };

  for (const regel of regels) {
    const t = regel.trim();
    if (!t) { sluitAlles(); continue; }

    // De <h1> van elke pagina is de titel uit het raamwerk, niet uit de tekst. Koppen in de
    // content beginnen daarom bij h2; één # in een contentbestand bedoelt "kopje", geen
    // tweede paginatitel.
    const kop = t.match(/^(#{1,4})\s+(.*)$/);
    if (kop) { sluitAlles(); const n = Math.min(Math.max(kop[1].length, 2), 4); uit.push(`<h${n}>${inline(kop[2])}</h${n}>`); continue; }

    if (/^(-{3,}|\*{3,})$/.test(t)) { sluitAlles(); uit.push('<hr>'); continue; }

    const punt = t.match(/^[-*]\s+(.*)$/);
    const nummer = t.match(/^\d+[.)]\s+(.*)$/);
    if (punt || nummer) {
      const soort = punt ? 'ul' : 'ol';
      sluitAlinea();
      if (lijst !== soort) { sluitLijst(); uit.push(`<${soort}>`); lijst = soort; }
      uit.push(`<li>${inline((punt || nummer)[1])}</li>`);
      continue;
    }
    // Vervolgregel van het vorige lijst-item: in een contentbestand breek je een lange
    // opsomming gewoon af op regelbreedte. Zonder deze regel sloot de lijst daar, en begon
    // het volgende item weer bij 1.
    if (lijst && (uit[uit.length - 1] || '').startsWith('<li>')) {
      uit[uit.length - 1] = uit[uit.length - 1].replace(/<\/li>$/, ` ${inline(t)}</li>`);
      continue;
    }
    sluitLijst();

    const citaat = t.match(/^>\s?(.*)$/);
    if (citaat) { sluitAlinea(); uit.push(`<blockquote>${inline(citaat[1])}</blockquote>`); continue; }

    alinea.push(t);
  }
  sluitAlles();
  return uit.join('\n');
}

// ---- Laden ----
async function haal(pad) {
  const res = await fetch(pad, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${pad}: ${res.status}`);
  return res.text();
}

export async function laadSite() {
  return JSON.parse(await haal('content/site.json'));
}

// Eén projectbestand → { id, …frontmatter, body }. De id is de bestandsnaam zonder .md; die
// staat ook in de URL van de projectpagina, zodat een link naar een project leesbaar blijft.
export async function laadProject(id) {
  const veilig = String(id).replace(/[^a-z0-9-]/gi, '');
  if (!veilig) throw new Error('Onbekend project');
  const { data, body } = parseFrontmatter(await haal(`content/projecten/${veilig}.md`));
  return { id: veilig, ...data, body };
}

export async function laadProjecten(ids) {
  const uit = [];
  for (const id of ids || []) {
    try {
      uit.push(await laadProject(id));
    } catch (err) {
      // Eén kapot of ontbrekend projectbestand mag de hele homepagina niet leegmaken.
      console.warn('project overgeslagen:', id, err.message);
    }
  }
  return uit;
}

// Een project kan een tweede uitvoering hebben (bijvoorbeeld een Special Edition) met een eigen
// tekst en eigen downloads. Die staat in `<id>.editie.md` naast het projectbestand zelf, zodat
// het gewone bestand leesbaar blijft en beide versies dezelfde velden gebruiken.
//
// Bestaat dat bestand niet, dan is het antwoord null en toont de projectpagina geen wisselknop.
export async function laadEditie(id) {
  const veilig = String(id).replace(/[^a-z0-9-]/gi, '');
  if (!veilig) return null;
  try {
    const { data, body } = parseFrontmatter(await haal(`content/projecten/${veilig}.editie.md`));
    return { id: veilig, ...data, body };
  } catch {
    return null;
  }
}

// Voortgang uit de vertaaleditor. Mislukt dit (server plat, project nog niet berekend), dan
// tonen we gewoon geen balk — de status "Mee bezig" staat er los van en blijft kloppen.
export async function laadVoortgang(bron) {
  if (!bron) return {};
  try {
    const res = await fetch(bron, { cache: 'no-cache' });
    if (!res.ok) return {};
    const data = await res.json();
    return (data && data.projecten) || {};
  } catch {
    return {};
  }
}
