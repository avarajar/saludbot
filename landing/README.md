# Landing de SaludBot

Sitio estático (HTML, CSS y JS, sin build) que se publica en GitHub Pages con
`.github/workflows/landing.yml` en cada push a `main` que toque `landing/`.

## Probar en local

```bash
npm run landing          # http://localhost:4321
```

En local también se escribe en el Supabase real: una postulación de prueba es
una postulación de verdad (bórrala después).

## Postulaciones y cupos

El formulario de "Clínicas fundadoras" escribe directo en Supabase (proyecto
`saludbot`) con la llave publicable que está en `assets/app.js`. Esa llave solo
puede crear postulaciones, subir logos y leer los cupos aprobados; no puede
leer, editar ni borrar postulaciones. Las reglas están en
`supabase/migrations/008_pilot_applications.sql` y `010_pilot_review.sql`.

| Dónde | Qué hay | ¿Público? |
|---|---|---|
| Tabla `pilot_applications` | Todo lo que llenó la clínica, incluido su contacto | **No** |
| Bucket `pilot-logos` (privado) | Logos subidos (el navegador los reduce a 256 px) | Solo los de clínicas aprobadas que dieron permiso |
| Función `pilot_slots()` | Lo que carga la página: aprobadas con especialidad y ciudad; nombre y logo solo con permiso | Sí |

### Revisar una postulación

Todas entran como `pending` y **no se ven en la página** hasta que las apruebes.

1. Abre la tabla `pilot_applications` en el Table Editor de Supabase.
2. Verifica que la clínica sea real: escríbele al WhatsApp y revisa el logo
   en el bucket `pilot-logos`.
3. Cambia `status` a `approved` o `rejected`. `reviewed_at` se llena solo.

Al aprobarla, la clínica ocupa un cupo en la página al instante; no hay que
hacer deploy. Una rechazada libera su WhatsApp para postularse de nuevo.

### Filtros anti-spam

- Campo trampa (honeypot): si lo llena un bot, el formulario finge éxito y no envía nada.
- Un WhatsApp solo puede tener una postulación pendiente o aprobada.
- Máximo 30 pendientes a la vez y 20 postulaciones por hora en total.
- Máximo 10 aprobadas (los cupos del piloto).
- Logos: solo PNG, JPG o WebP de hasta 300 KB, con nombre aleatorio.

Las especialidades y países del formulario (`assets/app.js`) se mantienen a mano
en sincronía con `src/lib/clinics/`.
