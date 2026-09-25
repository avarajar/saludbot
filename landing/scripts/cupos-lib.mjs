// Shared storage for pilot applications.
//
// _privado/postulaciones.json  full applications incl. contact data — gitignored, never published
// _privado/logos/              logos as uploaded (already downscaled by the browser) — gitignored
// data/cupos.json              what the public page loads: slot states + consented display fields only
// logos/                       logos of approved clinics that allowed showing them — published
import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LANDING_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRIVATE_DIR = path.join(LANDING_DIR, '_privado');
const PRIVATE_LOGOS = path.join(PRIVATE_DIR, 'logos');
const APPLICATIONS_FILE = path.join(PRIVATE_DIR, 'postulaciones.json');
const PUBLIC_FILE = path.join(LANDING_DIR, 'data', 'cupos.json');
const PUBLIC_LOGOS = path.join(LANDING_DIR, 'logos');

export const TOTAL_SLOTS = 10;
export const STATES = ['pendiente', 'aprobada', 'rechazada'];
const LOGO_TYPES = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' };
const MAX_LOGO_BYTES = 300 * 1024;

async function writeJsonAtomic(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`);
  await rename(tmp, file);
}

export async function readApplications() {
  try {
    return JSON.parse(await readFile(APPLICATIONS_FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export const activeApplications = (apps) =>
  apps.filter((a) => a.estado !== 'rechazada').sort((a, b) => a.creada.localeCompare(b.creada));

/** Validates a public submission. Returns { data } or { error } with a message fit for the applicant. */
export function validateSubmission(body) {
  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const data = {
    clinica: str(body.clinica, 80),
    especialidad: str(body.especialidad, 40),
    pais: str(body.pais, 40),
    ciudad: str(body.ciudad, 60),
    contacto: str(body.contacto, 80),
    whatsapp: str(body.whatsapp, 20),
    correo: str(body.correo, 120),
    mostrar: body.mostrar === true,
  };
  if (!data.clinica || !data.especialidad || !data.pais || !data.ciudad || !data.contacto || !data.whatsapp) {
    return { error: 'Faltan datos obligatorios.' };
  }
  const digits = data.whatsapp.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return { error: 'Revisa el número de WhatsApp.' };
  if (data.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) return { error: 'Revisa el correo.' };
  if (body.acepta !== true) return { error: 'Para postularte necesitas aceptar la Política de Privacidad y los Términos.' };
  return { data };
}

/** Decodes a data: URL logo. Returns { buffer, ext } or { error }; null when there is no logo. */
export function decodeLogo(dataUrl) {
  if (dataUrl == null || dataUrl === '') return null;
  const match = typeof dataUrl === 'string' && /^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return { error: 'El logo debe ser PNG, JPG o WebP.' };
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > MAX_LOGO_BYTES) return { error: 'El logo es demasiado pesado.' };
  return { buffer, ext: LOGO_TYPES[match[1]] };
}

export async function addApplication(data, logo) {
  const apps = await readApplications();
  if (activeApplications(apps).length >= TOTAL_SLOTS) return { error: 'Los 10 cupos ya están tomados.', full: true };

  const id = randomUUID().slice(0, 8);
  let logoFile = null;
  if (logo) {
    logoFile = `${id}.${logo.ext}`;
    await mkdir(PRIVATE_LOGOS, { recursive: true });
    await writeFile(path.join(PRIVATE_LOGOS, logoFile), logo.buffer);
  }
  const application = { id, creada: new Date().toISOString(), estado: 'pendiente', ...data, logo: logoFile };
  apps.push(application);
  await writeJsonAtomic(APPLICATIONS_FILE, apps);
  const cupos = await publish(apps);
  return { application, cupos };
}

export async function setState(id, estado) {
  if (!STATES.includes(estado)) throw new Error(`Estado inválido: ${estado}`);
  const apps = await readApplications();
  const app = apps.find((a) => a.id === id);
  if (!app) throw new Error(`No existe la postulación ${id}`);
  app.estado = estado;
  await writeJsonAtomic(APPLICATIONS_FILE, apps);
  await publish(apps);
  return app;
}

/** Regenerates data/cupos.json and logos/ from the private applications. */
export async function publish(apps) {
  apps ??= await readApplications();
  const active = activeApplications(apps).slice(0, TOTAL_SLOTS);
  await mkdir(PUBLIC_LOGOS, { recursive: true });

  const publishedLogos = new Set();
  const cupos = [];
  for (const app of active) {
    if (app.estado !== 'aprobada') {
      cupos.push({ estado: 'pendiente' });
      continue;
    }
    const cupo = { estado: 'aprobada', especialidad: app.especialidad, ciudad: app.ciudad };
    if (app.mostrar) {
      cupo.nombre = app.clinica;
      if (app.logo) {
        await copyFile(path.join(PRIVATE_LOGOS, app.logo), path.join(PUBLIC_LOGOS, app.logo));
        publishedLogos.add(app.logo);
        cupo.logo = `logos/${app.logo}`;
      }
    }
    cupos.push(cupo);
  }

  // Drop logos that are no longer allowed to be public (rejected, unapproved, or consent withdrawn)
  for (const file of await readdir(PUBLIC_LOGOS)) {
    if (!file.startsWith('.') && !publishedLogos.has(file)) await rm(path.join(PUBLIC_LOGOS, file));
  }

  const state = { total: TOTAL_SLOTS, cupos };
  await writeJsonAtomic(PUBLIC_FILE, state);
  return state;
}
