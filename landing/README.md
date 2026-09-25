# Landing de SaludBot

Sitio estático (HTML, CSS y JS, sin build) que se publica en GitHub Pages con
`.github/workflows/landing.yml` en cada push a `main` que toque `landing/`.

## Probar en local

```bash
npm run landing          # http://localhost:4321
```

El servidor local sirve la página y recibe las postulaciones del formulario de
"Clínicas fundadoras". En GitHub Pages no hay servidor: el formulario muestra un
mensaje para escribir a info@saludbot.co.

## Postulaciones y cupos

| Archivo | Qué tiene | ¿Se publica? |
|---|---|---|
| `_privado/postulaciones.json` | Todo lo que llenó la clínica, incluido su contacto | **No** (gitignored) |
| `_privado/logos/` | Logos subidos (el navegador los reduce a 256 px) | **No** (gitignored) |
| `data/cupos.json` | Lo que carga la página: cupos ocupados y, de las clínicas aprobadas que dieron permiso, nombre, ciudad y logo | Sí |
| `logos/` | Logos de clínicas aprobadas que dieron permiso | Sí |

Cada postulación ocupa un cupo como "En revisión". Después de hablar con la clínica:

```bash
npm run landing:cupos -- lista             # ver postulaciones con su contacto
npm run landing:cupos -- aprobar <id>      # el cupo muestra nombre y logo (si dio permiso)
npm run landing:cupos -- rechazar <id>     # libera el cupo
npm run landing:cupos -- publicar          # regenerar data/cupos.json y logos/
```

Para que un cambio se vea en GitHub Pages: commit de `landing/data` y `landing/logos`, y push a `main`.

Las especialidades y países del formulario (`assets/app.js`) se mantienen a mano
en sincronía con `src/lib/clinics/`.
