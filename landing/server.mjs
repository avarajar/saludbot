// Local static server for the landing, same files GitHub Pages serves.
// Applications and slots go straight to Supabase from the browser (assets/app.js).
//
//   npm run landing            → http://localhost:4321
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LANDING_DIR = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4321;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

async function serveStatic(req, res) {
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/\/$/, '/index.html');
  } catch {
    res.writeHead(400).end('Solicitud inválida');
    return;
  }
  const file = path.normalize(path.join(LANDING_DIR, rel));
  const inside = file.startsWith(LANDING_DIR + path.sep);
  const hidden = path.relative(LANDING_DIR, file).split(path.sep).some((part) => part.startsWith('.') || part.startsWith('_'));
  const blocked = path.relative(LANDING_DIR, file) === 'server.mjs';
  if (!inside || hidden || blocked) {
    res.writeHead(404).end('No encontrado');
    return;
  }
  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end('No encontrado');
  }
}

createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.writeHead(405).end();
  return serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`Landing en http://localhost:${PORT}`);
});
