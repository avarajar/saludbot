# Product Marketing Context

**Document version:** v3
**Last updated:** 2026-09-24

> Borrador generado a partir del repo (landing `src/app/page.tsx`, README, `src/lib/clinics/*`, specs en `docs/superpowers/`).
> Lo marcado **[POR CONFIRMAR]** es inferencia o falta de dato: hay que validarlo antes de usarlo en copy público.

## Product Overview
**One-liner:** Un asistente de IA en WhatsApp que agenda citas, envía recordatorios y reduce las inasistencias en clínicas de LATAM.
**What it does:** Los pacientes escriben al WhatsApp de la clínica y SaludBot, con IA conversacional (sin menús 1-2-3), agenda, confirma, cancela o reagenda citas según la disponibilidad real (horario de atención, duración del servicio, Google Calendar). Manda recordatorios automáticos 48h, 24h y 2h antes, y el paciente confirma respondiendo "1" o reagenda con "2". Después de la cita envía un seguimiento post-consulta y un recordatorio para volver ("recall") según el servicio. La clínica lo gestiona todo desde un panel web.
**Product category:** Chatbot de WhatsApp para agendamiento de citas médicas / software de agenda y recordatorios para clínicas.
**Product type:** SaaS B2B (multi-tenant) con setup asistido.
**Business model:** Setup único + suscripción mensual en COP, en tres planes (según la landing):
| Plan | Setup | Mensual | Incluye |
|------|-------|---------|---------|
| Básico | $800K – 2M | $300 – 500K | Agendamiento por WhatsApp, recordatorios, panel, hasta 200 citas/mes |
| Autopilot (popular) | $3 – 5M | $500K – 1M | Básico + IA avanzada, confirmaciones y reagendamiento, lista de espera, citas ilimitadas |
| Marketing | $2 – 4M | $800K – 1.5M | Campañas masivas, seguimiento post-consulta, encuestas, reportes |

Todos los planes dicen incluir soporte, capacitación y configuración inicial.

**Los precios son inventados**: son hipótesis sin validar con clínicas. Solo están en COP aunque el producto apunta a 10 países. No usarlos como dato firme en copy nuevo; validarlos en las primeras conversaciones de venta.

## Target Audience
**Target companies:** Consultorios y clínicas privadas pequeñas y medianas en toda LATAM hispanohablante (no solo Colombia; la empresa está en Bogotá). Especialidades soportadas: odontología, veterinaria, estética, psicología, dermatología y fisioterapia. Países configurados: CO, MX, PE, EC, CL, AR, VE, PA, CR, DO.
**Decision-makers:** El dueño o director de la clínica (a menudo el mismo profesional de salud). **[POR CONFIRMAR]** el papel del administrador o de la recepcionista en la compra.
**Primary use case:** Automatizar el agendamiento y los recordatorios por WhatsApp para dejar de perder citas por inasistencias y de depender de una persona que conteste mensajes.
**Jobs to be done:**
- "Que mis pacientes puedan agendar a cualquier hora sin que yo o mi secretaria tengamos que contestar."
- "Que la gente no me deje plantado: recordarles y que confirmen."
- "Que los pacientes vuelvan (control, limpieza, vacuna) sin tener que perseguirlos."
**Use cases:**
- Un paciente escribe un domingo en la noche para pedir cita y queda agendado.
- Recordatorio 24h antes → el paciente responde "2" → reagenda en el mismo chat.
- Una clínica dental recuerda al paciente su limpieza semestral (recall).
- Una veterinaria confirma la vacunación y envía seguimiento post-consulta.
- Varias clínicas comparten un número de WhatsApp y el bot enruta a la clínica correcta.

## Personas
| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| Dueño / profesional (decisor y pagador) | Agenda llena, ingresos, no perder tiempo en administración | Inasistencias, citas perdidas fuera de horario, costo de una secretaria | Menos inasistencias y agenda 24/7 por menos de lo que cuesta una secretaria |
| Recepcionista / auxiliar (usuaria del panel) | No estar pegada al WhatsApp, tener la agenda en orden | Volumen de mensajes repetitivos, confirmaciones manuales | El bot contesta lo repetitivo; ella ve y gestiona todo en el panel |
| Paciente (usuario final, no compra) | Rapidez, poder escribir a cualquier hora, trato respetuoso | Llamar en horario de oficina, esperar respuesta | Agenda en minutos por WhatsApp, en lenguaje natural |

## Problems & Pain Points
**Core problem:** Las clínicas pierden citas (y plata) porque los pacientes no llegan, y porque los mensajes de WhatsApp se contestan tarde o fuera de horario.
**Why alternatives fall short:**
- La secretaria contestando WhatsApp a mano no escala, no trabaja de noche y cuesta un salario.
- Los bots de menús (1-2-3) frustran al paciente y no entienden "¿tienen algo el viernes en la tarde?".
- Los softwares de agenda tradicionales mandan recordatorios por email o SMS, que el paciente no lee.
**What it costs them:** Según el README, hasta 35% de citas perdidas por inasistencia en LATAM **[POR CONFIRMAR fuente]**, más horas de personal dedicadas a agendar y confirmar.
**Emotional tension:** Frustración con los "plantones", sentirse esclavo del WhatsApp, miedo a perder pacientes que escriben y nadie les contesta.

## Competitive Landscape
*Escaneo rápido del 2026-09-24; detalle en `competitor-profiles/_summary.md`. El mercado está lleno: WhatsApp + IA + agenda ya no diferencia.*

**Direct:** Botiffy y SyncManager (Colombia), Kura, Clienteli, Neural IA, Luna Salud y otras agencias o chatbots — hacen lo mismo con implementación remota; no publican precios y cotizan por WhatsApp.
**Direct (vertical dental):** Dentiqa ($89–249 USD/mes, usa Claude y la API oficial) y NacarOS ($14.99 USD/mes, gratis hasta 20 pacientes) — software completo con IA en WhatsApp; exigen migrar todo el consultorio.
**Secondary:** Doctoralia (Noa), AgendaPro (Sofía y Julia) y Huli (desde $240 MXN/mes) — suites de agenda que ya agregaron IA conversacional en WhatsApp, con marca y base instalada.
**Emerging:** Leona Health ($14M de a16z, diciembre 2025) — copiloto de IA para el WhatsApp del médico.
**Indirect:** Secretaria o recepcionista contestando WhatsApp — cara, limitada por horario.

## Differentiation
**Key differentiators:**
- IA conversacional real en español (sin menús) que entiende lenguaje natural.
- Todo pasa en WhatsApp, el canal que el paciente ya usa.
- Disponibilidad real: respeta el horario, la duración del servicio y Google Calendar.
- Ciclo completo: agenda → recordatorios 48/24/2h → confirmar o reagendar en el chat → seguimiento post-consulta → recall.
- Hecho para LATAM: multi-país con moneda, zona horaria y trato de "usted" automáticos.
**How we do it differently:** Un asistente que conversa como una recepcionista, conectado a la agenda de verdad, en lugar de un formulario o un menú.
**Why that's better:** El paciente agenda en minutos a cualquier hora y la clínica no pierde ni pacientes ni tiempo.
**Why customers choose us:** [POR CONFIRMAR — no hay clientes reales todavía]

**Ojo:** frente a los competidores, los diferenciadores de arriba no son únicos. Posibles huecos a validar: una capa que no obliga a cambiar de software, especialidades menos atendidas (veterinaria, psicología) y varias clínicas en un solo número.

## Objections
| Objection | Response |
|-----------|----------|
| "Mis pacientes prefieren hablar con una persona" | El bot escala a un humano cuando hace falta y trata al paciente de "usted"; lo repetitivo lo resuelve al instante. |
| "¿Y si el bot se equivoca y agenda mal?" | Solo ofrece horarios realmente disponibles según la agenda y el horario de la clínica. [POR CONFIRMAR mensaje] |
| "Es caro / ya tengo secretaria" | "Invierte en tu clínica, no en secretarias": cuesta menos que un salario y trabaja 24/7; la secretaria se libera para atender. |
| "¿Qué pasa con los datos de salud de mis pacientes?" | Tratamos los datos de salud como datos sensibles, según la ley de protección de datos de cada país (ver *Privacidad y cumplimiento*). No afirmar "cumplimos la ley X" hasta que un abogado lo revise. |

**Anti-persona:** Hospitales y redes grandes con sistemas propios e integraciones complejas; clínicas cuyo canal principal no es WhatsApp. [POR CONFIRMAR]

## Switching Dynamics
**Push:** Plantones, WhatsApp desbordado, mensajes sin contestar de noche o el fin de semana.
**Pull:** Agenda 24/7, recordatorios automáticos, "menos inasistencias", setup en menos de un día.
**Habit:** "Siempre lo hemos hecho con la secretaria", una agenda en papel o Excel, el WhatsApp personal del doctor.
**Anxiety:** Que el bot suene robótico o trate mal al paciente, perder control de la agenda, el costo del setup, la privacidad de los datos.

## Customer Language
**How they describe the problem:**
- Sin datos: todavía no se ha hablado con clínicas. Prioridad: entrevistas de descubrimiento con las primeras 5–10 clínicas y anotar sus frases textuales aquí.
**How they describe us:**
- Sin datos (no hay clientes).
**Words to use:** agendar, cita, recordatorio, inasistencias, WhatsApp, pacientes, 24/7, "tu clínica", "sin menús", "lenguaje natural".
**Words to avoid:** jerga técnica (webhook, LLM, intent, API) en copy para clínicas; "chatbot" a secas (suena a menú robótico, mejor "asistente"). [POR CONFIRMAR]
**Glossary:**
| Term | Meaning |
|------|---------|
| Recordatorio | Mensaje automático 48h, 24h o 2h antes de la cita |
| Recall | Mensaje para que el paciente vuelva a un servicio periódico (limpieza, control, vacuna) |
| Seguimiento post-consulta | Mensaje después de la cita para saber cómo le fue al paciente |
| Inasistencia / no-show | Paciente que no llega a la cita |
| Escalamiento | El bot pasa la conversación a una persona |

## Brand Voice
**Tone:** Cálido, profesional, confiable. Cercano sin ser informal.
**Style:** Directo y concreto. Con la clínica (marketing) se tutea ("tu clínica", "tus pacientes"); con el paciente (bot) siempre se usa "usted", en español colombiano.
**Personality:** Confiable, cercano, eficiente, resolutivo.

## Proof Points
**Metrics:** La landing afirma "hasta 85% menos inasistencias", "94% de tasa de apertura de WhatsApp" (el README dice 94% de penetración y 98% de apertura), "24/7" y "< 3s de respuesta". **[POR CONFIRMAR]** ninguna tiene fuente ni datos propios; el 85% no debería publicarse sin respaldo.
**Customers:** La landing muestra "Clínica Dental Sonrisa, Veterinaria PetVida, Centro Estético Bella, Psicología Bienestar, Consultorio Dra. Martínez", pero son **placeholders, no clientes reales**. No hay clientes en producción todavía.
**Testimonials:**
> [POR CONFIRMAR — no hay testimonios reales]
**Value themes:**
| Theme | Proof |
|-------|-------|
| Menos inasistencias | Recordatorios 48/24/2h con confirmación en un toque (dato de impacto por conseguir) |
| Agenda 24/7 | El bot responde a cualquier hora (demo del chat) |
| Menos carga administrativa | [POR CONFIRMAR — horas ahorradas por clínica] |

## Goals
**Business goal:** Conseguir los primeros clientes que paguen. Hoy hay cero clientes y cero conversaciones con clínicas; el foco es descubrimiento y ventas tempranas, no escalar.
**Conversion action:** "Solicitar demo gratis" → registro (`/register`) → onboarding self-service de 4 pasos.
**Current metrics:** Ninguna: el producto no está desplegado en producción (servidor dado de baja el 2026-09-23).

## Privacidad y cumplimiento
El producto procesa datos de salud (citas, servicios, conversaciones), que la mayoría de leyes de la región tratan como **datos sensibles**. Como apunta a varios países, el mensaje no puede ser solo colombiano.

| País | Ley de protección de datos (referencia, a verificar) |
|------|------|
| Colombia | Ley 1581 de 2012 |
| México | Ley Federal de Protección de Datos Personales en Posesión de los Particulares (nueva versión de 2025) |
| Perú | Ley 29733 |
| Ecuador | Ley Orgánica de Protección de Datos Personales (2021) |
| Chile | Ley 19.628, reformada por la Ley 21.719 (2024) |
| Argentina | Ley 25.326 |
| Panamá | Ley 81 de 2019 |
| Costa Rica | Ley 8968 |
| Rep. Dominicana | Ley 172-13 |
| Venezuela | Sin ley general de datos personales |

**Mensaje recomendado mientras no haya revisión legal:** "Tus datos y los de tus pacientes se tratan como información sensible, con acceso restringido por clínica." No prometer cumplimiento ni certificaciones (HIPAA, ISO, etc.) que no existan.
**Pendiente:** revisión legal por país, política de privacidad y términos reales (la landing enlaza a unos que no existen), y definir dónde se alojan los datos (Supabase).

## Known gaps between marketing and product
- **Lista de espera automática** (plan Autopilot) y **campañas masivas** y **encuestas de satisfacción** (plan Marketing) no existen en el código.
- La landing dice "Configuramos tu bot… en menos de un día" (setup asistido), pero el producto ya tiene onboarding self-service.
- La tarjeta "Multi-país" menciona 6 países; el producto soporta 10.
- Especialidades como dermatología y fisioterapia ya están soportadas pero no se mencionan en la landing.
- Los logos de clientes y los precios de la landing son inventados; las cifras (85%, 94%/98%) no tienen fuente.

## Changelog
*Newest first. One line per revision: what changed and why.*
- v3 (2026-09-24) — Competencia real mapeada (escaneo rápido LATAM): el mercado está lleno y los precios de la landing están muy por encima del mercado.
- v2 (2026-09-23) — Precios marcados como inventados; alcance LATAM, no solo Colombia; meta = primeros clientes pagos; competencia y lenguaje de clientes sin datos; nueva sección de privacidad multi-país.
- v1 (2026-09-23) — Initial context, auto-drafted from the repo (landing, README, clinic data, specs).
