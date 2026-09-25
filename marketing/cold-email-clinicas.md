# Cold email a clínicas — SaludBot

**Creado:** 2026-09-24
**Objetivo:** conseguir las primeras clínicas fundadoras (piloto gratis a cambio de feedback).
**Contexto:** `.agents/product-marketing.md` · competencia: `competitor-profiles/_summary.md`

## Antes de enviar

1. **Dominio aparte para enviar** (p. ej. `saludbotmail.co`) con SPF, DKIM y DMARC; calentarlo 2–3 semanas.
2. **Poco volumen:** máximo 30–50 correos al día por buzón, texto plano, sin imágenes y como mucho un link.
3. **Herramienta:** las primeras 50 clínicas a mano desde Gmail; si funciona, pasar a Instantly, Smartlead o lemlist.
4. **Legal:** solo correos publicados por la propia clínica; el remitente se identifica y hay una forma clara de darse de baja (el P.D. del correo 1). En Colombia aplica la Ley 1581 (SIC); ver *Privacidad y cumplimiento* en el contexto de marketing.
5. **Número de demo funcionando:** lo usa el correo 3. Sin demo, no mandar el correo 3.

## Reglas de la secuencia

- **4 correos en 14 días:** días 1, 4, 8 y 14.
- **"Usted" siempre.** Es un primer contacto con profesionales de salud; la landing tutea, el cold email no.
- **La prueba del mensaje:** antes del correo 1, escribirle al WhatsApp de la clínica fuera de horario (8–10 p.m.) como paciente y anotar cuánto tardan en responder. Solo preguntar; **nunca agendar citas falsas**.
  - Si respondieron rápido (menos de 1 hora) → no usar ese gancho; abrir con el correo 1B.
- **Combinar canales:** 2–3 días después del correo 1, escribir por WhatsApp o Instagram: "Le escribí al correo sobre su WhatsApp de citas".
- **No prometer lo que no existe:** nada de lista de espera, campañas ni cifras de impacto sin fuente.
- **Qué registrar:** fecha, clínica, resultado de la prueba (hora del mensaje → hora de la respuesta), respuestas, "no" y bajas.

## Variables

| Variable | Ejemplo |
|---|---|
| `{Saludo}` | Dra. Gómez · Dr. Ruiz · Ps. Laura (según como se presente en su web o Instagram) |
| `{Clínica}` | Consultorio Odontológico Sonríe |
| `{Día}` / `{Hora}` | martes / 9:14 p.m. |
| `{Respuesta}` | al día siguiente a las 11 a.m. · no me respondieron |
| `{Tu nombre}` | quien firma |
| `{Demo}` | número de WhatsApp de la demo |

---

## Versión A — Odontología

**Correo 1 · día 1** — Asunto: `su whatsapp de citas`

> {Saludo}:
>
> El {Día} a las {Hora} le escribí al WhatsApp de {Clínica} preguntando por una cita de limpieza. Me respondieron {Respuesta}.
>
> No es un reclamo, casi todos los consultorios que probé tardan parecido. Pero a esa hora el paciente suele escribirle a dos o tres consultorios, y agenda con el primero que conteste.
>
> Estoy construyendo un asistente que responde ese WhatsApp a cualquier hora, agenda según su horario y le recuerda la cita al paciente. Busco 10 consultorios que lo prueben gratis mientras lo afinamos.
>
> ¿Le interesaría verlo funcionar?
>
> {Tu nombre}
> SaludBot · Bogotá
>
> P.D. Si no le interesa, respóndame "no" y no le vuelvo a escribir.

**Correo 1B** (si no hubo prueba o respondieron rápido) — Asunto: `limpiezas pendientes`

> {Saludo}:
>
> ¿Cuántos de sus pacientes deberían haber vuelto a su limpieza de control este semestre y no lo hicieron?
>
> Estoy construyendo un asistente para el WhatsApp del consultorio: agenda a cualquier hora, recuerda la cita y, cuando pasan los meses, le escribe al paciente para que vuelva a su control. Busco 10 consultorios que lo prueben gratis mientras lo afinamos.
>
> ¿Le interesaría verlo?
>
> {Tu nombre}
> SaludBot · Bogotá
>
> P.D. Si no le interesa, respóndame "no" y no le vuelvo a escribir.

**Correo 2 · día 4** — Asunto: `pacientes que no llegan`

> {Saludo}, otra pregunta corta:
>
> ¿Cuántos pacientes le quedaron mal la semana pasada?
>
> Lo que estamos probando: el asistente le escribe al paciente 48h, 24h y 2h antes. Si responde "1", confirma; si responde "2", le ofrece otro horario en el mismo chat, y ese espacio queda libre para otro paciente.
>
> Si le sirve, se lo configuro sin costo en su consultorio.
>
> {Tu nombre}

**Correo 3 · día 8** — Asunto: `pruébelo usted`

> {Saludo}:
>
> En vez de explicarle, mejor pruébelo: escríbale a este WhatsApp como si fuera un paciente de {Clínica} y pida una cita: {Demo}.
>
> Toma dos minutos. Si le gusta cómo responde, lo dejamos funcionando con sus servicios y horarios.
>
> {Tu nombre}

**Correo 4 · día 14** — Asunto: `cierro por aquí`

> {Saludo}, no le escribo más sobre esto.
>
> Si en algún momento el WhatsApp de citas se vuelve un problema, o los pacientes siguen sin llegar, respóndame este correo y lo retomamos.
>
> Que le vaya muy bien con {Clínica}.
>
> {Tu nombre}

---

## Versión B — Veterinarias

Diferencias: quien escribe es el dueño de la mascota; el gancho fuerte es la **vacuna o desparasitación que se vence** (el recall), y los fines de semana y las noches pesan más.

**Correo 1 · día 1** — Asunto: `whatsapp de la veterinaria`

> {Saludo}:
>
> El {Día} a las {Hora} le escribí al WhatsApp de {Clínica} preguntando por una cita de vacunación para mi perro. Me respondieron {Respuesta}.
>
> Entiendo que a esa hora el equipo está descansando o atendiendo. Pero quien escribe de noche para vacunar a su mascota muchas veces agenda con la primera veterinaria que le conteste.
>
> Estoy construyendo un asistente que responde ese WhatsApp a cualquier hora, agenda según su horario y le recuerda la cita al dueño. Busco 10 veterinarias que lo prueben gratis mientras lo afinamos.
>
> ¿Le interesaría verlo funcionar?
>
> {Tu nombre}
> SaludBot · Bogotá
>
> P.D. Si no le interesa, respóndame "no" y no le vuelvo a escribir.

**Correo 1B** — Asunto: `vacunas vencidas`

> {Saludo}:
>
> ¿Cuántas mascotas que atendieron el año pasado ya tienen la vacuna vencida y sus dueños no han vuelto?
>
> Estoy construyendo un asistente para el WhatsApp de la veterinaria: agenda a cualquier hora, recuerda la cita y, cuando toca el refuerzo, le escribe al dueño para que vuelva. Busco 10 veterinarias que lo prueben gratis mientras lo afinamos.
>
> ¿Le interesaría verlo?
>
> {Tu nombre}
> SaludBot · Bogotá
>
> P.D. Si no le interesa, respóndame "no" y no le vuelvo a escribir.

**Correo 2 · día 4** — Asunto: `citas que no llegan`

> {Saludo}, otra pregunta corta:
>
> ¿Cuántas citas le quedaron vacías la semana pasada porque el dueño no llegó?
>
> Lo que estamos probando: el asistente le escribe al dueño 48h, 24h y 2h antes. Si responde "1", confirma; si responde "2", le ofrece otro horario en el mismo chat, y ese espacio queda libre para otra mascota. Después de la cita le pregunta cómo sigue la mascota.
>
> Si le sirve, se lo configuro sin costo en su veterinaria.
>
> {Tu nombre}

**Correo 3 · día 8** — Asunto: `pruébelo usted`

> {Saludo}:
>
> En vez de explicarle, mejor pruébelo: escríbale a este WhatsApp como si fuera un cliente de {Clínica} y pida una cita de vacunación o de consulta: {Demo}.
>
> Toma dos minutos. Si le gusta cómo responde, lo dejamos funcionando con sus servicios y horarios.
>
> {Tu nombre}

**Correo 4 · día 14** — Asunto: `cierro por aquí`

> {Saludo}, no le escribo más sobre esto.
>
> Si en algún momento el WhatsApp de la veterinaria se vuelve un problema, o los recordatorios de vacunas se quedan sin enviar, respóndame este correo y lo retomamos.
>
> Que le vaya muy bien con {Clínica}.
>
> {Tu nombre}

---

## Versión C — Psicología

Diferencias importantes:
- **Tono más cuidadoso.** No insinuar que el psicólogo "pierde pacientes" por lento; muchos atienden solos y responden entre sesiones.
- **El gancho es la primera cita:** a quien se decide a pedir terapia le cuesta dar el paso, y si nadie responde puede no volver a intentarlo.
- **Una sesión vacía de 50 minutos** pesa mucho en un consultorio de una sola persona.
- **Privacidad:** decir claramente que el asistente solo maneja la agenda y no toca historias clínicas ni notas de sesión.
- **Nada de recall** (no aplica como en odontología o veterinaria).
- **La prueba del mensaje:** preguntar solo por disponibilidad para una primera sesión, sin inventar un motivo de consulta.

**Correo 1 · día 1** — Asunto: `primera cita por whatsapp`

> {Saludo}:
>
> El {Día} a las {Hora} le escribí a su WhatsApp preguntando por disponibilidad para una primera sesión. Me respondieron {Respuesta}.
>
> Sé que entre sesiones es difícil estar pendiente del celular. Pero a alguien que por fin se decide a pedir una cita le cuesta volver a escribir si no recibe respuesta pronto.
>
> Estoy construyendo un asistente que responde ese WhatsApp a cualquier hora con sus horarios disponibles, agenda y le recuerda la sesión al paciente. Solo maneja la agenda: no toca historias clínicas ni notas de sesión. Busco 10 psicólogos que lo prueben gratis mientras lo afinamos.
>
> ¿Le interesaría verlo funcionar?
>
> {Tu nombre}
> SaludBot · Bogotá
>
> P.D. Si no le interesa, respóndame "no" y no le vuelvo a escribir.

**Correo 1B** — Asunto: `sesiones canceladas`

> {Saludo}:
>
> ¿Cuántas sesiones se le cancelaron a última hora el último mes?
>
> Estoy construyendo un asistente para el WhatsApp del consultorio: recuerda la sesión con anticipación y, si el paciente no puede, le ofrece otro horario en el mismo chat, así el espacio se libera a tiempo. Solo maneja la agenda, no toca información clínica. Busco 10 psicólogos que lo prueben gratis mientras lo afinamos.
>
> ¿Le interesaría verlo?
>
> {Tu nombre}
> SaludBot · Bogotá
>
> P.D. Si no le interesa, respóndame "no" y no le vuelvo a escribir.

**Correo 2 · día 4** — Asunto: `el espacio de las 4`

> {Saludo}, otra pregunta corta:
>
> Cuando un paciente cancela con dos horas de anticipación, ¿alcanza a llenar ese espacio?
>
> Lo que estamos probando: el asistente le escribe al paciente 48h y 24h antes. Si responde "2", le ofrece otro horario en el mismo chat, y usted se entera con tiempo, no cuando ya está esperando.
>
> Si le sirve, se lo configuro sin costo.
>
> {Tu nombre}

**Correo 3 · día 8** — Asunto: `pruébelo usted`

> {Saludo}:
>
> En vez de explicarle, mejor pruébelo: escríbale a este WhatsApp como si fuera alguien pidiendo su primera sesión: {Demo}.
>
> Toma dos minutos, y así ve exactamente cómo le hablaría a sus pacientes: con respeto, de "usted" y sin menús. Si le gusta, lo dejamos funcionando con sus horarios.
>
> {Tu nombre}

**Correo 4 · día 14** — Asunto: `cierro por aquí`

> {Saludo}, no le escribo más sobre esto.
>
> Si en algún momento el WhatsApp del consultorio se vuelve difícil de llevar entre sesiones, respóndame este correo y lo retomamos.
>
> Le deseo lo mejor con su consulta.
>
> {Tu nombre}

---

## Qué esperar y cuándo ajustar

- **Tasa de respuesta:** con negocios pequeños lo normal es 1–5%. De 50 envíos por especialidad, 1–3 respuestas es un resultado normal.
- **Si después de 50 envíos no hay respuestas:** revisar la entregabilidad (¿llegan a spam?) antes de cambiar el texto.
- **Si abren pero no responden:** probar otro gancho (1 ↔ 1B) o cambiar de canal.
- **Si responden "no":** preguntar en una línea por qué. Esa respuesta vale más que el sí.
- **Cada respuesta:** anotar las frases textuales en *Customer Language* de `.agents/product-marketing.md`.
