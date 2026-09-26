# Landing de SaludBot

Sitio estático (HTML, CSS y JS, sin build) que se publica en GitHub Pages con
`.github/workflows/landing.yml` en cada push a `main` que toque `landing/`.

## Páginas

- `index.html`: home general de SaludBot, con la sección "Por especialidad".
- `odontologia/index.html`: página enfocada en consultorios odontológicos. Usa los mismos
  `assets/`; el chat del hero se define en su `<script type="application/json" data-chat-script>`
  y el formulario viene con la especialidad marcada (`data-specialty` en el `<form>`).

Una página nueva por especialidad se hace copiando `odontologia/` y agregando su carpeta
al paso "Collect public files" de `.github/workflows/landing.yml`.

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

### De dónde llega cada postulación

Cada postulación guarda `utm_source`, `utm_medium` y `utm_campaign` (si el link los trae) y la
página donde se envió el formulario (`landing_page`). Los UTM se conservan durante la visita:
si alguien entra a la home con UTM y postula desde `/odontologia`, igual quedan.

Usa un link distinto por canal para saber cuál funciona:

| Canal | Link |
|---|---|
| WhatsApp directo | `https://saludbot.co/odontologia/?utm_source=whatsapp&utm_medium=directo&utm_campaign=piloto-odonto` |
| Email en frío | `https://saludbot.co/odontologia/?utm_source=email&utm_medium=cold&utm_campaign=piloto-odonto` |
| Visita / QR en consultorio | `https://saludbot.co/odontologia/?utm_source=qr&utm_medium=visita&utm_campaign=piloto-odonto` |
| Depósito dental | `https://saludbot.co/odontologia/?utm_source=deposito&utm_medium=qr&utm_campaign=piloto-odonto` |
| Referido de un consultorio | `https://saludbot.co/odontologia/?utm_source=referido&utm_medium=directo&utm_campaign=piloto-odonto` |

Para ver los resultados, en el SQL Editor de Supabase:

```sql
select coalesce(utm_source, '(sin utm)') as canal, count(*) as postulaciones,
       count(*) filter (where status = 'approved') as aprobadas
from pilot_applications group by 1 order by 2 desc;
```

### Filtros anti-spam

- Campo trampa (honeypot): si lo llena un bot, el formulario finge éxito y no envía nada.
- Un WhatsApp solo puede tener una postulación pendiente o aprobada.
- Máximo 30 pendientes a la vez y 20 postulaciones por hora en total.
- Máximo 10 aprobadas (los cupos del piloto).
- Logos: solo PNG, JPG o WebP de hasta 300 KB, con nombre aleatorio.

Las especialidades y países del formulario (`assets/app.js`) se mantienen a mano
en sincronía con `src/lib/clinics/`.
