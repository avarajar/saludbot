import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/landing/LegalPage';

export const metadata: Metadata = {
  title: 'Política de Privacidad — SaludBot',
};

const SECTIONS: readonly LegalSection[] = [
  {
    title: '1. Quién es responsable',
    body: (
      <p>
        SaludBot ([razón social], [NIT], Bogotá, Colombia) es el responsable del tratamiento de los datos de las clínicas
        que usan el servicio. Cada clínica es responsable de los datos de sus pacientes; SaludBot actúa como encargado del
        tratamiento por instrucción de la clínica.
      </p>
    ),
  },
  {
    title: '2. Qué datos tratamos',
    body: (
      <ul>
        <li>De la clínica: nombre, correo, número de WhatsApp, país, horarios y servicios.</li>
        <li>De los pacientes: nombre, número de teléfono, citas y mensajes intercambiados por WhatsApp con el asistente.</li>
        <li>Los mensajes pueden contener información de salud. Se tratan como información sensible.</li>
      </ul>
    ),
  },
  {
    title: '3. Para qué los usamos',
    body: (
      <p>
        Agendar, recordar y confirmar citas; enviar seguimiento después de la consulta; mostrar a la clínica su agenda y
        pacientes; y pasar la conversación a una persona del equipo cuando hace falta. No usamos los datos para publicidad
        ni los vendemos a terceros.
      </p>
    ),
  },
  {
    title: '4. Quién accede',
    body: (
      <p>
        Solo la clínica dueña de los datos, a través de su cuenta, y el personal de SaludBot estrictamente necesario para
        operar y dar soporte. Los proveedores que procesan datos en nuestro nombre son: Supabase (base de datos), Twilio
        (mensajería de WhatsApp), Anthropic (modelo de IA que interpreta y redacta mensajes) y Google (Calendar).
      </p>
    ),
  },
  {
    title: '5. Cuánto tiempo los conservamos',
    body: (
      <p>
        Mientras la clínica mantenga su cuenta activa y [plazo por definir] después de cerrarla, salvo obligación legal de
        conservarlos más tiempo.
      </p>
    ),
  },
  {
    title: '6. Derechos de los titulares',
    body: (
      <p>
        Pacientes y clínicas pueden conocer, actualizar, rectificar o pedir la eliminación de sus datos, y revocar la
        autorización, escribiendo a <a href="mailto:info@saludbot.co">info@saludbot.co</a>. Respondemos en los plazos que
        fija la Ley 1581 de 2012 y sus decretos reglamentarios, o la norma equivalente del país de la clínica.
      </p>
    ),
  },
  {
    title: '7. Cambios',
    body: <p>Si cambiamos esta política, avisamos a las clínicas por correo y publicamos la nueva versión en esta página.</p>,
  },
];

export default function PrivacidadPage() {
  return <LegalPage title="Política de Privacidad" sections={SECTIONS} />;
}
