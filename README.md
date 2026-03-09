<div align="center">

# SaludBot

### Automatiza tu clinica con WhatsApp e IA

Un chatbot inteligente que agenda citas, envia recordatorios y reduce inasistencias hasta en un 85%. Todo desde WhatsApp.

---

**Next.js 15** &bull; **Supabase** &bull; **Claude AI** &bull; **Twilio** &bull; **Google Calendar**

[Demo](#demo) &bull; [Instalacion](#instalacion) &bull; [Arquitectura](#arquitectura) &bull; [API](#api) &bull; [Tests](#tests)

</div>

---

## Por que SaludBot?

Las clinicas en LATAM pierden hasta el **35% de sus citas** por inasistencias. Los pacientes olvidan sus citas, no contestan llamadas y no revisan emails.

Pero si revisan WhatsApp. **94% de penetracion** en Colombia, **98% de tasa de apertura**.

SaludBot convierte WhatsApp en el canal de comunicacion principal entre tu clinica y tus pacientes:

```
Paciente: "Hola, quiero agendar una cita"

SaludBot: "Buen dia! Estos son nuestros servicios disponibles:
           1. Limpieza dental (30 min) - $80.000
           2. Blanqueamiento (60 min) - $250.000
           Cual le interesa?"

Paciente: "Limpieza, para el viernes"

SaludBot: "Tenemos disponibilidad el viernes 13 de marzo:
           - 9:00 AM
           - 11:30 AM
           - 3:00 PM
           Cual prefiere?"

Paciente: "A las 9"

SaludBot: "Perfecto! Su cita queda agendada para el viernes
           13 de marzo a las 9:00 AM. Le enviaremos un
           recordatorio. Gracias!"
```

Los recordatorios se envian automaticamente a las **48h**, **24h** y **2h** antes de cada cita.

---

## Funcionalidades

### Para el paciente (WhatsApp)

- **Agendar citas** con lenguaje natural
- **Confirmar, cancelar o reagendar** con un mensaje
- **Consultar servicios**, horarios y ubicacion
- **Recibir recordatorios** automaticos
- **Escalamiento** a un humano cuando sea necesario

### Para la clinica (Dashboard)

- **Panel de control** con metricas en tiempo real
- **Gestion de citas** con filtros y acciones rapidas
- **Directorio de pacientes** con busqueda
- **Catalogo de servicios** (CRUD completo)
- **Historial de conversaciones** de WhatsApp
- **Configuracion** de clinica, horarios y propietario
- **Autenticacion** con email y contrasena

### Backend

- **IA conversacional** con Claude (no menus 1-2-3)
- **Clasificacion de intenciones** (10 intents)
- **Google Calendar** integrado para disponibilidad real
- **Multi-pais** (Colombia, Mexico, Peru, Ecuador, Chile, Argentina)
- **Horarios dinamicos** por dia de la semana
- **100 tests** automatizados

---

## Demo

<table>
<tr>
<td width="50%">

**Landing Page**
<br><br>
Pagina de marketing con funcionalidades, como funciona, planes y precios en COP.

</td>
<td width="50%">

**Login**
<br><br>
Autenticacion con Supabase Auth. Email + contrasena con proteccion de rutas via middleware.

</td>
</tr>
<tr>
<td>

**Dashboard**
<br><br>
Metricas en tiempo real: citas del dia, total de pacientes, tasa de confirmacion, inasistencias.

</td>
<td>

**Configuracion**
<br><br>
Edicion de datos de la clinica, zona horaria, WhatsApp y propietario.

</td>
</tr>
</table>

---

## Arquitectura

```
Paciente (WhatsApp)
       |
       v
    Twilio  ──────────────>  /api/webhooks/whatsapp
                                     |
                                     v
                             Claude: Clasificar Intent
                             (schedule, cancel, confirm,
                              reschedule, info_*, greeting,
                              escalate, other)
                                     |
                                     v
                             Handler correspondiente
                             - Consulta Supabase (citas, pacientes, servicios)
                             - Consulta Google Calendar (disponibilidad)
                                     |
                                     v
                             Claude: Generar respuesta
                             (espanol colombiano, formal, ~300 chars)
                                     |
                                     v
                             Twilio: Enviar por WhatsApp
                                     |
                                     v
                             Supabase: Log conversacion
```

### Recordatorios

```
Cron (cada hora) ──> GET /api/cron/reminders
                          |
                          v
                     Buscar citas a 48h, 24h, 2h
                          |
                          v
                     Enviar recordatorio por WhatsApp
                          |
                          v
                     Marcar como enviado + log
```

---

## Tech Stack

| Capa | Tecnologia |
|------|------------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) + RLS |
| Auth | Supabase Auth (email/password) |
| AI | Claude API via `@anthropic-ai/sdk` |
| WhatsApp | Twilio WhatsApp Business API |
| Calendar | Google Calendar API (`googleapis`) |
| Validation | Zod |
| Testing | Vitest + Testing Library |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── webhooks/whatsapp/route.ts    # Webhook Twilio (mensajes entrantes)
│   │   ├── appointments/route.ts         # CRUD citas
│   │   ├── patients/route.ts             # CRUD pacientes
│   │   ├── clinics/route.ts              # CRUD clinicas
│   │   ├── services/route.ts             # CRUD servicios
│   │   ├── conversations/route.ts        # Historial conversaciones
│   │   └── cron/reminders/route.ts       # Endpoint cron recordatorios
│   ├── dashboard/
│   │   ├── page.tsx                      # Panel de control
│   │   ├── appointments/page.tsx         # Lista de citas
│   │   ├── patients/page.tsx             # Lista de pacientes
│   │   ├── services/page.tsx             # Gestion de servicios
│   │   ├── conversations/page.tsx        # Historial WhatsApp
│   │   ├── settings/page.tsx             # Configuracion clinica
│   │   ├── layout.tsx                    # Layout con auth check
│   │   └── dashboard-shell.tsx           # Shell con sidebar + topbar
│   ├── login/page.tsx                    # Iniciar sesion
│   ├── register/page.tsx                 # Crear cuenta
│   └── page.tsx                          # Landing page
├── components/ui/                        # Button, Card, StatusBadge
├── lib/
│   ├── ai/
│   │   ├── classifier.ts                # Clasificacion de intenciones (Claude)
│   │   └── responder.ts                 # Generacion de respuestas (Claude)
│   ├── auth/
│   │   ├── clinic-context.tsx            # ClinicProvider + useClinic()
│   │   ├── supabase-server.ts            # Cliente server-side
│   │   └── supabase-browser.ts           # Cliente browser-side
│   ├── whatsapp/
│   │   ├── client.ts                     # Cliente Twilio
│   │   └── handlers.ts                  # Handlers por intencion
│   ├── calendar/google.ts               # Google Calendar
│   ├── db/
│   │   ├── supabase.ts                  # Clientes Supabase
│   │   └── queries.ts                   # Funciones de consulta
│   └── reminders/engine.ts             # Motor de recordatorios
├── middleware.ts                         # Proteccion de rutas
└── types/index.ts                        # Tipos TypeScript
```

---

## Base de datos

6 tablas con Row-Level Security habilitado:

```sql
clinics            -- Clinicas (multi-tenant, multi-pais)
patients           -- Pacientes por clinica
appointments       -- Citas con estado y recordatorios
conversations      -- Log de mensajes WhatsApp
clinic_services    -- Servicios con precio y duracion
reminder_logs      -- Registro de recordatorios enviados
```

### Migraciones

| # | Archivo | Descripcion |
|---|---------|-------------|
| 001 | `initial_schema.sql` | Schema completo: 6 tablas, enums, indices, RLS, triggers |
| 002 | `multi_country.sql` | Campos country, currency, locale en clinics |
| 003 | `clinic_hours.sql` | Horarios dinamicos (JSONB) por dia de la semana |

---

## Instalacion

### Prerrequisitos

- Node.js 18+
- Cuenta de [Supabase](https://supabase.com)
- Cuenta de [Twilio](https://twilio.com) con WhatsApp Business
- API key de [Anthropic](https://console.anthropic.com)
- Service account de [Google Cloud](https://console.cloud.google.com) con Calendar API

### Setup

```bash
# Clonar
git clone git@github.com:avarajar/saludbot.git
cd saludbot

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Aplicar migraciones en Supabase
# (desde el dashboard o con supabase CLI)

# Iniciar servidor de desarrollo
npm run dev
```

### Variables de entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Twilio
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+57XXXXXXXXXX

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-tu-key

# Google Calendar
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-sa@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Cron
CRON_SECRET=tu-secret-aleatorio
```

---

## Comandos

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de produccion
npm run lint         # ESLint
npm test             # Ejecutar tests (100 tests)
npm run test:watch   # Tests en modo watch
npx tsc --noEmit     # Verificar tipos
```

---

## Tests

100 tests cubriendo los modulos principales:

```
 src/lib/ai/classifier.test.ts         14 tests
 src/lib/ai/responder.test.ts          15 tests
 src/lib/whatsapp/handlers.test.ts     23 tests
 src/lib/whatsapp/client.test.ts        9 tests
 src/lib/reminders/engine.test.ts      12 tests
 src/app/api/appointments/route.test   13 tests
 src/app/api/patients/route.test       14 tests
 ─────────────────────────────────────────
 Total                                100 tests
```

---

## API

### Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/api/webhooks/whatsapp` | Webhook de Twilio (mensajes entrantes) |
| `GET` | `/api/appointments` | Listar citas (filtros: clinic_id, date, status) |
| `POST` | `/api/appointments` | Crear cita |
| `PATCH` | `/api/appointments` | Actualizar estado de cita |
| `GET` | `/api/patients` | Listar pacientes (filtro: search) |
| `POST` | `/api/patients` | Crear paciente |
| `GET` | `/api/clinics` | Obtener clinica (por id o slug) |
| `POST` | `/api/clinics` | Crear clinica |
| `PATCH` | `/api/clinics` | Actualizar clinica |
| `GET` | `/api/services` | Listar servicios |
| `POST` | `/api/services` | Crear servicio |
| `PATCH` | `/api/services` | Actualizar servicio |
| `DELETE` | `/api/services` | Eliminar servicio |
| `GET` | `/api/conversations` | Historial de conversaciones |
| `GET` | `/api/cron/reminders` | Ejecutar motor de recordatorios |

### Intenciones del chatbot

| Intent | Descripcion | Ejemplo |
|--------|-------------|---------|
| `schedule` | Agendar cita | "Quiero una cita para el viernes" |
| `reschedule` | Reagendar cita | "Puedo cambiar mi cita al lunes?" |
| `cancel` | Cancelar cita | "Necesito cancelar mi cita" |
| `confirm` | Confirmar cita | "Si, confirmo mi asistencia" |
| `info_services` | Consultar servicios | "Que servicios ofrecen?" |
| `info_hours` | Consultar horarios | "A que hora abren?" |
| `info_location` | Consultar ubicacion | "Donde queda la clinica?" |
| `greeting` | Saludo | "Hola, buenas tardes" |
| `escalate` | Hablar con humano | "Necesito hablar con alguien" |
| `other` | No clasificado | Cualquier otro mensaje |

---

## Multi-pais

SaludBot esta disenado para toda LATAM. Cada clinica tiene su propia configuracion:

| Campo | Descripcion | Default |
|-------|-------------|---------|
| `country` | Codigo ISO del pais | `CO` |
| `currency` | Moneda | `COP` |
| `locale` | Locale BCP 47 | `es-CO` |
| `timezone` | Zona horaria | `America/Bogota` |
| `business_hours` | Horarios por dia (JSONB) | Lun-Vie 8-18, Sab 8-13 |

Paises soportados: Colombia, Mexico, Peru, Ecuador, Chile, Argentina.

---

## Roadmap

- [ ] Deploy a Vercel
- [ ] Configurar Twilio WhatsApp Business
- [ ] Vincular Google Calendar
- [ ] Template messages de WhatsApp (aprobados por Meta)
- [ ] Rate limiting en API routes
- [ ] Soporte para multiples sedes por clinica
- [ ] Reportes y analytics avanzados
- [ ] Integracion con pasarelas de pago (Wompi, MercadoPago)
- [ ] App movil para el dueño de la clinica
- [ ] Soporte portugues (Brasil)

---

<div align="center">

Hecho con cafe colombiano por [avarajar](https://github.com/avarajar)

</div>
