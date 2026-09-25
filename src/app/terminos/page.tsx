import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, type LegalSection } from '@/components/landing/LegalPage';

export const metadata: Metadata = {
  title: 'Términos y Condiciones — SaludBot',
};

const SECTIONS: readonly LegalSection[] = [
  {
    title: '1. El servicio',
    body: (
      <p>
        SaludBot es un asistente por WhatsApp que agenda citas, envía recordatorios y seguimiento, y ofrece a la clínica un
        panel para ver citas y pacientes. Al crear una cuenta aceptas estos términos en nombre de tu clínica.
      </p>
    ),
  },
  {
    title: '2. Piloto y clínicas fundadoras',
    body: (
      <p>
        Durante el piloto el servicio no tiene costo. Las clínicas fundadoras conservan un precio preferente cuando termine,
        que se comunicará por escrito con al menos [plazo] de anticipación. A cambio, la clínica acepta compartir
        retroalimentación sobre el uso del producto.
      </p>
    ),
  },
  {
    title: '3. Responsabilidades de la clínica',
    body: (
      <ul>
        <li>
          Mantener actualizados sus servicios, horarios y calendario: el asistente agenda con la información que la clínica
          configura.
        </li>
        <li>Contar con autorización de sus pacientes para contactarlos por WhatsApp.</li>
        <li>Atender las conversaciones que el asistente escale a su equipo.</li>
        <li>Cumplir las políticas de WhatsApp Business.</li>
      </ul>
    ),
  },
  {
    title: '4. Lo que SaludBot no hace',
    body: (
      <p>
        El asistente no da diagnósticos ni recomendaciones médicas. Solo gestiona citas y comunicación administrativa. La
        atención en salud es responsabilidad exclusiva de la clínica.
      </p>
    ),
  },
  {
    title: '5. Disponibilidad',
    body: (
      <p>
        Hacemos lo razonable para que el servicio funcione de forma continua, pero depende de terceros (WhatsApp, Twilio,
        Google, proveedores de nube) y puede tener interrupciones. Durante el piloto no ofrecemos garantía de
        disponibilidad.
      </p>
    ),
  },
  {
    title: '6. Datos',
    body: (
      <p>
        El tratamiento de datos se rige por la <Link href="/privacidad">Política de Privacidad</Link>. Los datos de los
        pacientes pertenecen a la clínica; SaludBot los trata solo para prestar el servicio.
      </p>
    ),
  },
  {
    title: '7. Terminación',
    body: (
      <p>
        Cualquiera de las partes puede terminar el servicio en cualquier momento. La clínica puede pedir la exportación o
        eliminación de sus datos escribiendo a <a href="mailto:info@saludbot.co">info@saludbot.co</a>.
      </p>
    ),
  },
  {
    title: '8. Ley aplicable',
    body: (
      <p>
        Estos términos se rigen por las leyes de la República de Colombia. [Definir jurisdicción y mecanismo de resolución
        de conflictos.]
      </p>
    ),
  },
];

export default function TerminosPage() {
  return <LegalPage title="Términos y Condiciones" sections={SECTIONS} />;
}
