// Local server for the landing: serves the static site and receives pilot applications.
// GitHub Pages only serves the static files; this API exists only when running locally.
//
//   npm run landing            → http://localhost:4321
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { addApplication, decodeLogo, LANDING_DIR, validateSubmission } from './scripts/cupos-lib.mjs';

const PORT = Number(process.env.PORT) || 4321;
const MAX_BODY_BYTES = 1024 * 1024;
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

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('too_large'), { status: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handleApplication(req, res) {
  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    return sendJson(res, err.status || 400, { error: err.status === 413 ? 'El envío es demasiado pesado.' : 'Solicitud inválida.' });
  }
  // Honeypot filled → a bot. Answer like a success so it doesn't retry, but store nothing.
  if (body.sitio) return sendJson(res, 200, { ok: true });

  const { data, error } = validateSubmission(body);
  if (error) return sendJson(res, 400, { error });
  const logo = decodeLogo(body.logo);
  if (logo?.error) return sendJson(res, 400, { error: logo.error });

  const result = await addApplication(data, logo);
  if (result.error) return sendJson(res, result.full ? 409 : 400, { error: result.error });

  const a = result.application;
  console.log(`\n🔔 Nueva postulación ${a.id}: ${a.clinica} (${a.especialidad}, ${a.ciudad}, ${a.pais})`);
  console.log(`   Contacto: ${a.contacto} · WhatsApp ${a.whatsapp}${a.correo ? ` · ${a.correo}` : ''}${a.logo ? ' · con logo' : ''}`);
  console.log(`   Aprobar: npm run landing:cupos -- aprobar ${a.id}\n`);
  return sendJson(res, 201, { ok: true, cupos: result.cupos });
}

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
  const blocked = /^(server\.mjs|scripts\/)/.test(path.relative(LANDING_DIR, file).split(path.sep).join('/'));
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
  try {
    if (req.url.split('?')[0] === '/api/postulaciones') {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'Método no permitido.' });
      return await handleApplication(req, res);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.writeHead(405).end();
    return await serveStatic(req, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) sendJson(res, 500, { error: 'Algo falló de nuestro lado. Inténtalo de nuevo.' });
  }
}).listen(PORT, () => {
  console.log(`Landing en http://localhost:${PORT}`);
});
