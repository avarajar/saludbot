// Manage pilot applications from the terminal.
//
//   npm run landing:cupos -- lista
//   npm run landing:cupos -- aprobar <id>
//   npm run landing:cupos -- rechazar <id>
//   npm run landing:cupos -- pendiente <id>
//   npm run landing:cupos -- publicar        (regenerate data/cupos.json + logos/)
import { activeApplications, publish, readApplications, setState, TOTAL_SLOTS } from './cupos-lib.mjs';

const [command, id] = process.argv.slice(2);
const COMMANDS = { aprobar: 'aprobada', rechazar: 'rechazada', pendiente: 'pendiente' };

async function main() {
  if (!command || command === 'lista') {
    const apps = await readApplications();
    if (!apps.length) return console.log('Todavía no hay postulaciones.');
    console.log(`${activeApplications(apps).length} de ${TOTAL_SLOTS} cupos ocupados\n`);
    for (const a of apps) {
      console.log(`${a.id}  [${a.estado}]  ${a.clinica} · ${a.especialidad} · ${a.ciudad}, ${a.pais}`);
      console.log(`          ${a.contacto} · WhatsApp ${a.whatsapp}${a.correo ? ` · ${a.correo}` : ''} · mostrar: ${a.mostrar ? 'sí' : 'no'} · logo: ${a.logo ? 'sí' : 'no'} · ${a.creada.slice(0, 10)}`);
    }
    return;
  }
  if (command === 'publicar') {
    const state = await publish();
    return console.log(`data/cupos.json actualizado: ${state.cupos.length} de ${state.total} cupos ocupados.`);
  }
  if (!COMMANDS[command] || !id) {
    console.error('Uso: lista | aprobar <id> | rechazar <id> | pendiente <id> | publicar');
    process.exitCode = 1;
    return;
  }
  const app = await setState(id, COMMANDS[command]);
  console.log(`${app.clinica} → ${app.estado}. data/cupos.json actualizado.`);
  console.log('Para que se vea en GitHub Pages: commit de landing/data y landing/logos, y push.');
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
