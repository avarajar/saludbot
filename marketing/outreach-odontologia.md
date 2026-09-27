# Outreach a consultorios odontológicos — piloto Bogotá

**Creado:** 2026-09-26
**Meta:** 15 conversaciones y 5–10 consultorios fundadores en ~8 semanas.
**Lista:** `marketing/_privado/prospectos-odontologia-bogota.csv` (100 consultorios del REPS, corte 12-mar-2026). **No se sube a git**: el repo es público y la lista tiene datos de contacto.
**Emails:** la secuencia "Versión A — Odontología" de `marketing/cold-email-clinicas.md`.

## La lista

- **Fuente:** datos abiertos del REPS ([datos.gov.co c36g-9fc2](https://www.datos.gov.co/Salud-y-Protecci-n-Social/Registro-Especial-de-Prestadores-y-Sedes-de-Servic/c36g-9fc2)). Se buscan sedes de Bogotá con "odont", "dent", "ortodon", "sonris", "smile" u "oral" en el nombre. "Oral" y "smile" van como palabra completa; si no, se cuelan apellidos como Morales, la "medicina laboral" y nombres como "Yasmile".
- **Filtros:**
  - fuera radiología, imágenes, laboratorios, gremios, fundaciones, universidades y cooperativas;
  - fuera cadenas: correo corporativo compartido por 3 o más sedes (Colsanitas, Oralmedic, Marlon Becerra, Odontoexpress, etc.);
  - solo privados, con 1 o 2 sedes;
  - un registro por prestador.
- **Resultado:** 180 sedes objetivo; la lista toma las 100 con mejor prioridad.
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

## Primero: validar si el mercado ya está cubierto

Recordar citas y agendar por WhatsApp ya lo ofrecen Meta (Business Agent, lanzado para todo el mundo en jun-2026) y las suites de agenda (Doctoralia, Dentalink, Saludtools). Antes de construir más, las primeras 15 respuestas tienen que contestar dos preguntas:

1. **¿Ya lo tienen resuelto?** ¿Confirman con software, con el bot de Meta o a mano?
2. **¿Pierden pacientes que no vuelven?** Controles, limpieza semestral, tratamientos a medias y presupuestos sin agendar.

Por eso el primer contacto **pregunta, no vende**.

### Email 1 · asunto: `pregunta sobre sus citas`

> {Saludo}:
>
> Estoy hablando con consultorios odontológicos de Bogotá para entender algo, y quería preguntarle a usted:
>
> 1. ¿Cómo confirman hoy las citas con sus pacientes: con un software, por WhatsApp a mano o de otra forma?
> 2. ¿Qué hacen con los pacientes que no vuelven a su control o dejan un tratamiento a medias?
>
> Me basta con una respuesta corta. Estoy construyendo algo para esto y prefiero preguntar antes de suponer.
>
> {Tu nombre}
> SaludBot · Bogotá
> info@saludbot.co
>
> P.D. Si no le interesa, respóndame "no" y no le vuelvo a escribir.

El link a la landing va **solo en la segunda respuesta**, cuando muestren interés: {Link email}.

### WhatsApp 1 · día 1

> Buenas, {Saludo}. Soy {Tu nombre}, de SaludBot, en Bogotá. Estoy hablando con consultorios odontológicos para entender cómo manejan sus citas. ¿Le puedo hacer dos preguntas cortas?
>
> 1. ¿Cómo confirman hoy las citas: con un software, por WhatsApp a mano o de otra forma?
> 2. ¿Qué hacen con los pacientes que no vuelven a su control o dejan un tratamiento a medias?
>
> Si no le interesa, me dice y no le vuelvo a escribir.

### WhatsApp 2 · día 4 (si no respondió)

> {Saludo}, solo la primera pregunta, si tiene un minuto: ¿cómo confirman hoy las citas con sus pacientes?

**Si responde y hay interés:** cuéntele en dos líneas qué está construyendo y envíe {Link WhatsApp} para que postule el consultorio.

### Qué anotar (columnas en el CSV)

| Columna | Valores |
|---|---|
| `como_confirman` | `software` (cuál) · `bot_meta` · `whatsapp_manual` · `llamadas` · `no_confirman` |
| `pierden_pacientes` | `sí` · `no` · `no_sabe` (y lo que digan en `notas`) |
| `ya_resuelto` | `sí`: dicen que ya lo tienen cubierto · `no` |
| `interes` | `alto`: quiere probar · `medio`: pide info · `bajo`/`no` |
| `lista_pacientes` | `software_exporta` · `software_no_exporta` · `excel` · `cuaderno` · `no_sabe` (se llena en la llamada) |

### Regla para decidir (con 15 respuestas)

- **10 o más dicen `ya_resuelto = sí`:** el mercado está saturado. Parar o cambiar de nicho y propuesta.
- **5 o más dicen `whatsapp_manual`/`no_confirman` con `pierden_pacientes = sí`:** hay espacio. Seguir con la propuesta de "recuperar pacientes que no vuelven" y desplegar el bot para ellos.
- **Algo intermedio:** hacer 10 conversaciones más antes de decidir.

## Guion de la llamada (15 min, para quien muestre interés)

La meta de la llamada es **aprender**, no vender. Pregunte y escuche; muestre el producto solo al final.

1. **Contexto (2 min):** ¿Cuántos odontólogos y sillas tienen? ¿Hacen ortodoncia? ¿Cuántas citas atienden por semana, más o menos?
2. **Cómo agendan hoy (3 min):** ¿Quién contesta el WhatsApp? ¿Usan algún software (Dentalink, Doctoralia, Excel, cuaderno)? ¿Lo pagan? ¿Cuánto?
   - ¿Dónde tienen la lista de sus pacientes, con teléfono y fecha de la última cita? ¿Nos la podrían pasar en Excel si se la pidiéramos? Sin esa lista no hay a quién escribirle para que vuelva.
3. **El dolor (4 min):**
   - ¿Cuántos pacientes faltan en una semana normal? ¿Les avisan antes?
   - ¿Qué pasa con el control de ortodoncia cuando el paciente falta: se atrasa la cuota?
   - ¿Llaman a los pacientes para la limpieza semestral?
4. **Lo que ya probaron (2 min):** ¿Han usado recordatorios automáticos? ¿Qué no les gustó?
5. **La propuesta (3 min):** piloto gratis y precio de fundador después. Pregunte: *"Si le recuperamos dos controles al mes, ¿pagaría $150.000 mensuales?"* Anote la respuesta tal cual, sea sí, no o "depende de…".
6. **Cierre (1 min):** si quiere entrar, envíele el link del formulario o llénenlo juntos, y acuerden la fecha de configuración.

Anote en el CSV `software_actual`, `lista_pacientes` y lo que dijeron sobre inasistencias y precio.

## Antes de empezar: falta la demo

El bot **no está corriendo en ningún lado**: el servidor de producción se borró el 23-sep-2026. Por eso:

- **Los mensajes de WhatsApp y los correos 1 y 2 se pueden mandar ya**, porque solo invitan a una llamada o al formulario.
- **El correo 3 de la secuencia ("pruébelo usted") necesita un número de demo funcionando.** No se envía hasta tenerlo.
- **Los consultorios que acepten el piloto necesitan el bot desplegado** (Meta Cloud API y un hosting). Conviene empezar ese trabajo apenas haya 2 o 3 interesados.
