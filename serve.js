// Piepkleine statische server voor de projectensite. Bewust zonder afhankelijkheden: de site
// is gewone HTML/CSS/JS plus contentbestanden, dus er valt niets te bouwen. Aanpassingen aan
// content/ zijn na een verversing zichtbaar — geen docker build, geen deploy.
//
//   node site/serve.js            → http://localhost:8080
//   PORT=3000 node site/serve.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

// Alles wat de browser vraagt moet binnen site/ blijven. Los van het pad zelf ontleden we hier
// ook %2e%2e-achtige trucs weg door eerst te decoderen en daarna pas te normaliseren.
function bestandVoor(url) {
  let pad;
  try {
    pad = decodeURIComponent(new URL(url, 'http://x').pathname);
  } catch {
    return null;
  }
  if (pad.endsWith('/')) pad += 'index.html';
  const doel = path.join(ROOT, path.normalize(pad));
  if (doel !== ROOT && !doel.startsWith(ROOT + path.sep)) return null;
  return doel;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end('Alleen GET');
    return;
  }
  const doel = bestandVoor(req.url);
  if (!doel) { res.writeHead(400).end('Ongeldig pad'); return; }

  fs.stat(doel, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] })
        .end('<!doctype html><meta charset="utf-8"><title>Niet gevonden</title>' +
             '<p>Pagina niet gevonden. <a href="/">Terug naar de startpagina</a>.</p>');
      return;
    }
    const ext = path.extname(doel).toLowerCase();
    // HTML en content nooit lang cachen: anders ziet een bezoeker na een tekstwijziging nog
    // dagen de oude versie. Afbeeldingen en stijlen mogen wel even blijven staan.
    const kort = ext === '.html' || ext === '.json' || ext === '.md';
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': kort ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(doel).pipe(res);
  });
});

server.listen(PORT, () => console.log(`Projectensite luistert op :${PORT}`));
