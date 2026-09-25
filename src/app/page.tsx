import Link from 'next/link';
import { EditorialMotion } from '@/components/landing/EditorialMotion';
import { Faq, type FaqItem } from '@/components/landing/Faq';
import { HeroMock } from '@/components/landing/HeroMock';
import { Eyebrow, LandingFooter, Logo } from '@/components/landing/parts';
import { SPECIALTIES } from '@/lib/clinics/templates';
import { COUNTRIES } from '@/lib/clinics/countries';

const SPECIALTY_LABELS = SPECIALTIES.filter((s) => s.value !== 'other').map((s) => s.label);

const FACTS = [
  { label: 'Recordatorios', value: <>48h <Dot /> 24h <Dot /> 2h</> },
  { label: 'Disponibilidad', value: 'Responde 24/7' },
  { label: 'Plantillas', value: `${SPECIALTY_LABELS.length} especialidades` },
  { label: 'Cobertura', value: `${COUNTRIES.length} países de LATAM` },
];

const FEATURES = [
  {
    title: 'Agenda con disponibilidad real',
    text: 'Respeta tu horario, la duración de cada servicio y tu Google Calendar. Solo ofrece horas que de verdad están libres.',
  },
  {
    title: 'Recordatorios automáticos',
    text: 'A las 48h, 24h y 2h. El paciente responde 1 para confirmar o 2 para reagendar.',
  },
  { title: 'Cancelar o reagendar escribiendo normal', text: 'Como le escribiría a la recepción. Sin menús.' },
  { title: 'Seguimiento después de la consulta', text: 'Y aviso cuando toca volver: limpieza, control, vacuna.' },
  { title: 'Panel de la clínica', text: 'Citas del día, pacientes y un clic para marcar asistió / no asistió.' },
  {
    title: 'Pasa la conversación a una persona',
    text: 'Cuando el paciente lo pide o el asistente no está seguro, tu equipo toma el chat.',
  },
];

const STEPS = [
  { title: 'Crea tu cuenta', text: 'Elige tu especialidad y tu país.' },
  { title: 'Ajusta servicios y horarios', text: 'Ya vienen plantillas listas para tu especialidad. Cambia lo que quieras.' },
  { title: 'Tus pacientes escriben', text: 'Por WhatsApp, como siempre. El asistente hace el resto.' },
];

const FOUNDER_PERKS = [
  'Configuración hecha por nosotros: servicios, horarios y Google Calendar.',
  'Sin costo durante el piloto. Precio de fundador después.',
  'A cambio: una llamada corta cada tanto para contarnos qué funciona y qué no.',
];

const PILOT_SLOTS = 10;

// "¿Necesito cambiar mi número de WhatsApp?" is left out until the answer is decided.
const FAQS: readonly FaqItem[] = [
  {
    q: '¿Y si el paciente quiere hablar con una persona?',
    a: 'Se escala a tu equipo. El asistente avisa y deja la conversación en manos de una persona de tu clínica.',
  },
  {
    q: '¿Puede agendar mal?',
    a: 'Solo ofrece horarios libres según tu agenda y tu horario de atención. Si un espacio no está disponible, no lo propone.',
  },
  {
    q: '¿Qué pasa con los datos de mis pacientes?',
    a: 'Se tratan como información sensible, con acceso restringido a tu clínica.',
  },
];

export default function Home() {
  return (
    <div className="ed-root min-h-screen overflow-x-hidden bg-ed-cream font-body text-ed-ink antialiased">
      <EditorialMotion />
      <noscript>
        <style>{`.ed-root [data-reveal],.ed-root [data-stagger]>*,.ed-root [data-grow]{opacity:1!important;filter:none!important;transform:none!important}`}</style>
      </noscript>

      <div
        data-progress
        className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left scale-x-0 bg-[linear-gradient(90deg,#1F3A93,#F26B4E)]"
      />

      <nav className="fixed inset-x-0 top-0 z-40 border-b border-ed-ink/10 bg-ed-cream/82 backdrop-blur-[16px]">
        <div
          data-nav
          className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-4 transition-[height] duration-[400ms] ease-editorial sm:px-8"
        >
          <Logo />
          <div className="flex items-center justify-end gap-7">
            <a href="#producto" className="hidden text-sm font-medium text-ed-ink hover:text-ed-blue md:inline">Producto</a>
            <a href="#como" className="hidden text-sm font-medium text-ed-ink hover:text-ed-blue md:inline">Cómo funciona</a>
            <a href="#faq" className="hidden text-sm font-medium text-ed-ink hover:text-ed-blue md:inline">Preguntas</a>
            <a
              href="#fundadoras"
              className="whitespace-nowrap rounded-[2px] border border-ed-ink px-4 py-[9px] text-sm font-semibold text-ed-ink transition-all duration-[250ms] hover:bg-ed-ink hover:text-ed-cream"
            >
              Ser clínica fundadora
            </a>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden pb-24 pt-[120px] sm:pt-[140px]">
        <div
          data-parallax="0.35"
          className="ed-drift pointer-events-none absolute -left-[200px] -top-[160px] size-[760px] rounded-full bg-[radial-gradient(circle,rgba(31,58,147,.20),rgba(31,58,147,0)_60%)] will-change-transform"
        />
        <div
          data-parallax="-0.2"
          className="ed-drift pointer-events-none absolute -right-[240px] top-[240px] size-[820px] rounded-full bg-[radial-gradient(circle,rgba(242,107,78,.26),rgba(242,107,78,0)_60%)] [animation-direction:reverse] [animation-duration:20s] will-change-transform"
        />
        <div data-parallax="0.45" className="pointer-events-none absolute -right-[140px] top-[120px] size-[520px] rounded-full border border-ed-blue/22" />
        <div data-parallax="0.25" className="pointer-events-none absolute -right-[60px] top-[200px] size-[520px] rounded-full border border-ed-coral/30" />

        <div className="relative mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-center gap-x-12 gap-y-16 px-4 sm:px-8">
          <div>
            <div className="ed-fade [animation-delay:.1s]">
              <Eyebrow>Piloto · buscamos {PILOT_SLOTS} clínicas fundadoras</Eyebrow>
            </div>
            <h1 className="mt-7 font-display text-[clamp(46px,5.4vw,80px)] font-normal leading-none tracking-[-.03em] text-balance">
              <RiseLine delay=".15s">Tus pacientes escriben</RiseLine>
              <RiseLine delay=".28s">por WhatsApp.</RiseLine>
              <RiseLine delay=".41s">
                <em className="font-light text-ed-blue">SaludBot</em> les agenda la cita,
              </RiseLine>
              <RiseLine delay=".54s">
                a <em className="text-ed-coral">cualquier hora.</em>
              </RiseLine>
            </h1>
            <p className="ed-fade mt-7 max-w-[500px] text-lg leading-[1.65] text-pretty text-ed-muted [animation-delay:.8s]">
              Un asistente con IA que agenda, recuerda la cita y deja que el paciente confirme o reagende en el mismo chat. Sin menús de 1-2-3.
            </p>
            <div className="ed-fade mt-10 flex flex-wrap items-center gap-7 [animation-delay:1s]">
              <a
                data-magnet
                href="#fundadoras"
                className="ed-shimmer inline-flex items-center gap-[14px] rounded-[2px] px-7 py-[18px] text-[15px] font-semibold text-ed-cream hover:shadow-[0_22px_40px_-18px_rgba(31,58,147,.8)]"
              >
                Quiero ser clínica fundadora <Arrow />
              </a>
              <a
                href="#como"
                className="border-b border-ed-ink pb-0.5 text-[15px] font-semibold text-ed-ink transition-all duration-[250ms] hover:border-ed-coral hover:text-ed-coral"
              >
                Ver cómo funciona
              </a>
            </div>
          </div>
          <HeroMock />
        </div>
      </section>

      {/* ===== FACTS ===== */}
      <section className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-8">
        <div data-grow className="h-px bg-ed-ink" />
        <div data-stagger="120" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 pt-7">
          {FACTS.map((fact) => (
            <div key={fact.label}>
              <MicroLabel>{fact.label}</MicroLabel>
              <p className="mt-2 font-display text-[30px] tracking-[-.02em]">{fact.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRODUCT ===== */}
      <section
        id="producto"
        className="relative scroll-mt-16 overflow-hidden border-y border-ed-ink/8 bg-[linear-gradient(180deg,#FBF8F2,#F5F1EA_60%,#FBF8F2)] py-[120px]"
      >
        <div
          data-parallax="0.15"
          className="pointer-events-none absolute -right-[300px] top-0 size-[700px] rounded-full bg-[radial-gradient(circle,rgba(31,58,147,.10),rgba(31,58,147,0)_60%)] will-change-transform"
        />
        <div className="relative mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-start gap-16 px-4 sm:px-8">
          <div data-reveal className="md:sticky md:top-[110px]">
            <Eyebrow>Producto</Eyebrow>
            <h2 className="mt-6 font-display text-[clamp(38px,4.2vw,64px)] font-normal leading-none tracking-[-.03em] text-balance">
              Seis cosas que hace hoy. <em className="font-light text-ed-subtle">Ni una más.</em>
            </h2>
            <p className="mt-6 max-w-[420px] text-[17px] leading-[1.65] text-ed-muted">
              Todo lo que ves aquí ya funciona hoy. Lo que no está, no lo prometemos.
            </p>
            <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2">
              {SPECIALTY_LABELS.map((label) => (
                <span key={label} className="ed-spec inline-flex items-center gap-5 font-display text-xl italic text-ed-ink">
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div data-stagger="110" className="border-t border-ed-ink">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="grid grid-cols-[64px_1fr] gap-5 border-b border-ed-ink/12 py-8 transition-[padding-left] duration-[400ms] ease-editorial hover:pl-3"
              >
                <span className={`font-display text-[32px] leading-none ${i === FEATURES.length - 1 ? 'text-ed-coral' : 'text-ed-blue'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-display text-[26px] font-normal tracking-[-.02em]">{feature.title}</h3>
                  <p className="mt-[10px] text-[15px] leading-[1.65] text-pretty text-ed-muted">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="como" className="scroll-mt-16 py-[120px]">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
          <div data-reveal className="mb-14 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>Cómo funciona</Eyebrow>
              <h2 className="mt-6 font-display text-[clamp(38px,4.2vw,64px)] font-normal leading-none tracking-[-.03em]">
                Tres pasos. Cero complicaciones.
              </h2>
            </div>
            <p className="max-w-[300px] text-[15px] leading-[1.6] text-ed-muted">
              Para las clínicas fundadoras, los pasos 1 y 2 los hacemos nosotros.
            </p>
          </div>
          <div className="relative">
            <div data-grow className="absolute inset-x-0 top-7 h-px bg-ed-ink" />
            <div data-stagger="180" className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-10">
              {STEPS.map((step, i) => {
                const last = i === STEPS.length - 1;
                return (
                  <div key={step.title} className="relative pt-16">
                    <span
                      className={`absolute left-0 top-0 grid size-14 place-items-center rounded-full border font-display text-2xl ${
                        last ? 'border-ed-coral bg-ed-coral text-white' : 'border-ed-ink bg-ed-cream'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <h3 className="font-display text-[28px] font-normal tracking-[-.02em]">{step.title}</h3>
                    <p className="mt-[10px] text-[15px] leading-[1.65] text-ed-muted">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOUNDING CLINICS ===== */}
      <section
        id="fundadoras"
        className="relative scroll-mt-16 overflow-hidden bg-[linear-gradient(160deg,#1F3A93_0%,#182E78_55%,#141A2E_100%)] py-[120px] text-ed-cream"
      >
        <div
          data-parallax="-0.25"
          className="ed-drift pointer-events-none absolute -left-[200px] -top-[300px] size-[800px] rounded-full bg-[radial-gradient(circle,rgba(242,107,78,.35),rgba(242,107,78,0)_60%)] [animation-duration:18s] will-change-transform"
        />
        <div data-parallax="-0.08" className="pointer-events-none absolute -bottom-[260px] -right-[120px] size-[640px] rounded-full border border-ed-cream/15" />
        <div data-parallax="-0.14" className="pointer-events-none absolute -bottom-[200px] right-0 size-[640px] rounded-full border border-ed-coral/40" />

        <div className="relative mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-center gap-16 px-4 sm:px-8">
          <div data-reveal>
            <Eyebrow tone="coral">Clínicas fundadoras</Eyebrow>
            <h2 className="mt-6 font-display text-[clamp(40px,4.6vw,72px)] font-normal leading-[.98] tracking-[-.03em] text-balance">
              Buscamos las <em className="font-light">primeras {PILOT_SLOTS}</em> clínicas.
            </h2>
            <p className="mt-7 max-w-[520px] text-lg leading-[1.65] text-pretty text-ed-cream/80">
              Te lo configuramos nosotros, sin costo durante el piloto, y mantienes un precio de fundador. A cambio, nos cuentas qué funciona y qué no.
            </p>
            <Link
              data-magnet
              href="/register"
              className="mt-10 inline-flex items-center gap-[14px] rounded-[2px] bg-ed-coral px-7 py-[18px] text-[15px] font-semibold text-white hover:bg-ed-cream hover:text-ed-blue hover:shadow-[0_22px_40px_-18px_rgba(0,0,0,.6)]"
            >
              Postular mi clínica <Arrow />
            </Link>
          </div>
          <div data-reveal data-delay="150">
            <MicroLabel className="text-ed-cream/60">Lugares del piloto</MicroLabel>
            <div data-stagger="70" className="mt-4 grid grid-cols-5 gap-[10px]">
              {Array.from({ length: PILOT_SLOTS }, (_, i) => (
                <div
                  key={i}
                  className="grid aspect-square place-items-center rounded-[3px] border border-dashed border-ed-cream/40 font-display text-[22px] text-ed-cream/50 transition-all duration-300 hover:border-solid hover:border-ed-coral hover:text-ed-coral"
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <p className="mt-[14px] text-[13px] text-ed-cream/60">
              {PILOT_SLOTS} de {PILOT_SLOTS} disponibles. Ninguna clínica ha entrado todavía; la primera puede ser la tuya.
            </p>
            <ul className="mt-9 grid border-t border-ed-cream/20">
              {FOUNDER_PERKS.map((perk) => (
                <li key={perk} className="flex gap-4 border-b border-ed-cream/20 py-4 text-[15px] leading-normal">
                  <span className="font-display text-xl leading-[1.1] text-ed-coral">✓</span>
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="scroll-mt-16 py-[120px]">
        <div className="mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-start gap-12 px-4 sm:px-8">
          <div data-reveal>
            <Eyebrow>Preguntas</Eyebrow>
            <h2 className="mt-6 font-display text-[clamp(38px,4.2vw,56px)] font-normal leading-none tracking-[-.03em] text-balance">
              Lo que nos preguntan las clínicas
            </h2>
          </div>
          <Faq items={FAQS} />
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative overflow-hidden border-t border-ed-ink/10 pb-[120px] pt-[140px]">
        <div
          data-parallax="-0.3"
          className="ed-drift pointer-events-none absolute -bottom-[300px] -left-[100px] size-[700px] rounded-full bg-[radial-gradient(circle,rgba(31,58,147,.18),rgba(31,58,147,0)_60%)] [animation-duration:14s] will-change-transform"
        />
        <div
          data-parallax="0.2"
          className="ed-drift pointer-events-none absolute -right-[100px] -top-[200px] size-[600px] rounded-full bg-[radial-gradient(circle,rgba(242,107,78,.28),rgba(242,107,78,0)_60%)] [animation-direction:reverse] [animation-duration:17s] will-change-transform"
        />
        <div
          data-parallax="-0.12"
          className="pointer-events-none absolute left-1/2 top-1/2 -ml-[360px] -mt-[360px] size-[720px] rounded-full border border-ed-coral/35"
        />
        <div data-reveal className="relative mx-auto max-w-[1000px] px-4 text-center sm:px-8">
          <h2 className="font-display text-[clamp(44px,6.2vw,96px)] font-normal leading-[.96] tracking-[-.035em] text-balance">
            Tu próximo paciente te está escribiendo <em className="font-light text-ed-coral">ahora mismo.</em>
          </h2>
          <a
            data-magnet
            href="#fundadoras"
            className="mt-12 inline-flex items-center gap-[14px] rounded-[2px] bg-ed-ink px-8 py-5 text-base font-semibold text-ed-cream hover:bg-ed-blue hover:shadow-[0_22px_40px_-18px_rgba(20,26,46,.7)]"
          >
            Quiero ser clínica fundadora <Arrow />
          </a>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function MicroLabel({ children, className = 'text-ed-subtle' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[11px] font-semibold uppercase tracking-[.16em] ${className}`}>{children}</p>;
}

function RiseLine({ children, delay }: { children: React.ReactNode; delay: string }) {
  return (
    <span className="block overflow-hidden pb-[.08em]">
      <span className="ed-rise block" style={{ animationDelay: delay }}>
        {children}
      </span>
    </span>
  );
}

function Arrow() {
  return <span className="font-display text-[22px] leading-none">→</span>;
}

function Dot() {
  return <span className="text-ed-coral">·</span>;
}
