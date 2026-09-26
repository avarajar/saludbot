# Outreach a consultorios odontológicos — piloto Bogotá

**Creado:** 2026-09-26
**Meta:** 15 conversaciones y 5–10 consultorios fundadores en ~8 semanas.
**Lista:** `marketing/_privado/prospectos-odontologia-bogota.csv` (100 consultorios del REPS, corte 12-mar-2026). **No se sube a git**: el repo es público y la lista tiene datos de contacto.
**Emails:** la secuencia "Versión A — Odontología" de `marketing/cold-email-clinicas.md`.

## La lista

- **Fuente:** datos abiertos del REPS ([datos.gov.co c36g-9fc2](https://www.datos.gov.co/Salud-y-Protecci-n-Social/Registro-Especial-de-Prestadores-y-Sedes-de-Servic/c36g-9fc2)). Hay 431 sedes en Bogotá con "odont", "dental", "ortodon", "sonris", "smile" u "oral" en el nombre.
- **Filtros:**
  - solo privados, con 1 o 2 sedes (fuera cadenas como Keralty, Dental Planet u Oralmedic);
  - un registro por prestador.
- **Prioridad:** menciona ortodoncia (+3), tiene celular (+2), una sola sede (+1), tiene email de la sede (+1).
- **Ojo:** los profesionales independientes suelen registrarse con su nombre, así que muchos ortodoncistas no aparecen con "ortodoncia". Hay que confirmar la especialidad en Google Maps o Instagram antes de escribir.
- **Columnas para llenar:** `estado` (pendiente → contactado → respondió → llamada → piloto / no), `canal`, `fecha_contacto`, `respuesta`, `software_actual` y `notas`.

## Ritmo

- **10–15 contactos al día, a mano**, desde tu WhatsApp personal o del proyecto. **Nunca por la API de WhatsApp Business**: los mensajes en frío masivos hacen que Meta bloquee el número.
- **Horario:** lunes a viernes de 8 a.m. a 6 p.m. y sábados hasta la 1 p.m. La Ley 2300 de 2023 limita los mensajes comerciales a L–V 7am–7pm y sábados 8am–3pm; nunca domingos ni festivos.
- **Orden de canales:**
  1. WhatsApp al `whatsapp_probable`.
  2. Si no hay celular, o no responde en 3 días: email con la secuencia A.
  3. Si tampoco responde: una visita, si queda en la zona.
- **Siempre:** identificarse, un solo link y una forma clara de decir "no".

## Links (con UTM)

| Canal | Link |
|---|---|
| WhatsApp | `https://saludbot.co/odontologia/?utm_source=whatsapp&utm_medium=directo&utm_campaign=piloto-odonto` |
| Email | `https://saludbot.co/odontologia/?utm_source=email&utm_medium=cold&utm_campaign=piloto-odonto` |
| Visita / QR | `https://saludbot.co/odontologia/?utm_source=qr&utm_medium=visita&utm_campaign=piloto-odonto` |
| Referido | `https://saludbot.co/odontologia/?utm_source=referido&utm_medium=directo&utm_campaign=piloto-odonto` |

## WhatsApp

**Mensaje 1 · día 1**

> Buenas, {Saludo}. Soy {Tu nombre}, de SaludBot, en Bogotá.
>
> Le escribo por WhatsApp porque justo de eso se trata: estamos probando un asistente que le confirma las citas a sus pacientes por este medio (controles, limpiezas, valoraciones) y, si el paciente no puede, le reprograma en el mismo chat.
>
> Buscamos 10 consultorios que lo prueben gratis mientras lo afinamos. ¿Le puedo contar en una llamada de 15 minutos?
>
> Aquí está cómo funciona: {Link WhatsApp}
>
> Si no le interesa, me dice y no le vuelvo a escribir.

**Mensaje 2 · día 3** (si no respondió)

> {Saludo}, una pregunta corta: ¿cuántos pacientes le fallaron a su cita la semana pasada?
>
> Esa es la parte que queremos resolver con el piloto. Si le sirve, se lo configuramos sin costo.

**Mensaje 3 · día 7** (último)

> {Saludo}, no le escribo más para no molestar. Si más adelante le interesa probarlo, aquí queda el link: {Link WhatsApp}. ¡Que tenga buena semana!

**Si responde que sí:** proponga dos horarios concretos para la llamada ("¿le queda mejor el martes a las 12 o el miércoles a las 5?").

## Guion de la llamada (15 min)

La meta de la llamada es **aprender**, no vender. Pregunte y escuche; muestre el producto solo al final.

1. **Contexto (2 min):** ¿Cuántos odontólogos y sillas tienen? ¿Hacen ortodoncia? ¿Cuántas citas atienden por semana, más o menos?
2. **Cómo agendan hoy (3 min):** ¿Quién contesta el WhatsApp? ¿Usan algún software (Dentalink, Doctoralia, Excel, cuaderno)? ¿Lo pagan? ¿Cuánto?
3. **El dolor (4 min):**
   - ¿Cuántos pacientes faltan en una semana normal? ¿Les avisan antes?
   - ¿Qué pasa con el control de ortodoncia cuando el paciente falta: se atrasa la cuota?
   - ¿Llaman a los pacientes para la limpieza semestral?
4. **Lo que ya probaron (2 min):** ¿Han usado recordatorios automáticos? ¿Qué no les gustó?
5. **La propuesta (3 min):** piloto gratis y precio de fundador después. Pregunte: *"Si le recuperamos dos controles al mes, ¿pagaría $150.000 mensuales?"* Anote la respuesta tal cual, sea sí, no o "depende de…".
6. **Cierre (1 min):** si quiere entrar, envíele el link del formulario o llénenlo juntos, y acuerden la fecha de configuración.

Anote en el CSV `software_actual` y lo que dijeron sobre inasistencias y precio.

## Antes de empezar: falta la demo

El bot **no está corriendo en ningún lado**: el servidor de producción se borró el 23-sep-2026. Por eso:

- **Los mensajes de WhatsApp y los correos 1 y 2 se pueden mandar ya**, porque solo invitan a una llamada o al formulario.
- **El correo 3 de la secuencia ("pruébelo usted") necesita un número de demo funcionando.** No se envía hasta tenerlo.
- **Los consultorios que acepten el piloto necesitan el bot desplegado** (Meta Cloud API y un hosting). Conviene empezar ese trabajo apenas haya 2 o 3 interesados.
