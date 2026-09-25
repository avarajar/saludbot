'use client';

import { useEffect, useState } from 'react';

type ChatMessage = { me: boolean; text: string };

export const HERO_CHAT: readonly ChatMessage[] = [
  { me: true, text: 'Hola, necesito una cita para limpieza dental' },
  { me: false, text: 'Con gusto. Para limpieza (60 min) tengo jueves 10:00 a. m., viernes 9:00 a. m. o viernes 3:00 p. m. ¿Cuál prefiere?' },
  { me: true, text: 'El viernes a las 9' },
  { me: false, text: 'Listo. Su cita queda para el viernes a las 9:00 a. m. Le recordaré antes.' },
  { me: false, text: 'Recordatorio: su limpieza es mañana a las 9:00 a. m. Responda 1 para confirmar o 2 para reagendar.' },
  { me: true, text: '1' },
  { me: false, text: 'Confirmada. La esperamos mañana a las 9:00 a. m.' },
];

// Steps past the last message act as a pause before the loop restarts.
const PAUSE_TICKS = 3;
const BOT_DELAY_MS = 2100;
const PATIENT_DELAY_MS = 1400;

export function heroChatState(step: number) {
  const shown = Math.min(step, HERO_CHAT.length);
  const next = HERO_CHAT[shown];
  return {
    messages: HERO_CHAT.slice(0, shown),
    typing: step > 0 && next !== undefined && !next.me,
    confirmed: shown >= HERO_CHAT.length - 1,
    nextDelay: next && !next.me ? BOT_DELAY_MS : PATIENT_DELAY_MS,
  };
}

const ROWS = [
  { time: '8:00', name: 'Andrés Pérez', service: 'Control' },
  { time: '10:30', name: 'Camila Ruiz', service: 'Blanqueamiento' },
  { time: '11:30', name: 'Jorge Díaz', service: 'Primera consulta' },
];

export function HeroMock() {
  const [step, setStep] = useState(0);
  const { messages, typing, confirmed, nextDelay } = heroChatState(step);

  useEffect(() => {
    const timer = setTimeout(
      () => setStep((s) => (s + 1) % (HERO_CHAT.length + PAUSE_TICKS)),
      nextDelay,
    );
    return () => clearTimeout(timer);
  }, [step, nextDelay]);

  return (
    <div
      data-tilt
      className="ed-fade relative flex flex-col gap-8 [animation-delay:.5s] [transform-style:preserve-3d] md:block md:min-h-[760px]"
    >
      {/* Clinic panel, behind */}
      <div
        data-parallax="0.08"
        className="relative w-full md:absolute md:right-0 md:top-0 md:w-[min(100%,380px)]"
      >
        <div className="rotate-[1.5deg] rounded-[6px] border border-ed-ink/10 bg-ed-surface p-[22px] shadow-[0_30px_60px_-40px_rgba(20,26,46,.4)]">
          <div className="flex items-baseline justify-between border-b border-ed-ink/10 pb-[14px]">
            <span className="font-display text-[22px]">Viernes 12</span>
            <span className="text-[11px] font-semibold uppercase tracking-[.1em] text-ed-blue">
              {confirmed ? 3 : 2} confirmadas · 4 citas
            </span>
          </div>
          <div className="mt-[10px] grid gap-1 text-[13px]">
            <PanelRow time={ROWS[0].time} name={ROWS[0].name} service={ROWS[0].service}>
              <span className="text-[11px] font-semibold text-[#0F6B45]">Asistió</span>
            </PanelRow>
            <PanelRow
              time="9:00"
              name="Laura Gómez"
              service="Limpieza"
              className={`transition-colors duration-[800ms] ${confirmed ? 'bg-[#E3E8F7]' : 'bg-ed-surface'}`}
            >
              <span
                className={`rounded-[2px] px-2 py-[3px] text-[11px] font-semibold transition-all duration-[800ms] ${
                  confirmed ? 'bg-ed-blue/12 text-ed-blue' : 'bg-[#FDE3DB] text-[#8A2E18]'
                }`}
              >
                {confirmed ? 'Confirmada' : 'Pendiente'}
              </span>
            </PanelRow>
            {ROWS.slice(1).map((row) => (
              <PanelRow key={row.time} time={row.time} name={row.name} service={row.service}>
                <span className="text-[11px] font-semibold text-ed-blue">Confirmada</span>
              </PanelRow>
            ))}
          </div>
        </div>
      </div>

      {/* WhatsApp chat, front */}
      <div
        data-parallax="-0.12"
        className="relative mx-auto w-full max-w-[320px] md:absolute md:left-0 md:top-[230px] md:mx-0 md:w-[min(78%,320px)]"
      >
        <div className="ed-float rounded-[22px] bg-ed-ink p-2 shadow-[0_50px_80px_-40px_rgba(20,26,46,.6)]">
          <div className="overflow-hidden rounded-2xl bg-[#ECE5DD]">
            <div className="flex items-center gap-[10px] bg-ed-blue px-[14px] py-3">
              <span className="grid size-[30px] place-items-center rounded-full bg-white/25 font-display text-[15px] text-white">
                S
              </span>
              <div>
                <p className="text-[13px] font-semibold text-white">Clínica Dental Sonríe</p>
                <p className="text-[11px] text-white/70">en línea</p>
              </div>
            </div>
            {/* Fixed height on mobile so the growing conversation doesn't shift the page below */}
            <div
              className="flex h-[480px] flex-col justify-end gap-2 overflow-hidden px-3 py-[14px] md:h-auto md:min-h-[400px] md:overflow-visible"
              aria-live="polite"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`ed-pop flex ${m.me ? 'origin-bottom-right justify-end' : 'origin-bottom-left'}`}
                >
                  <p
                    className={`max-w-[82%] px-3 py-2 text-[13px] leading-[1.45] text-[#1f2937] shadow-[0_1px_2px_rgba(0,0,0,.06)] ${
                      m.me ? 'rounded-[12px_12px_2px_12px] bg-[#DCF8C6]' : 'rounded-[12px_12px_12px_2px] bg-white'
                    }`}
                  >
                    {m.text}
                  </p>
                </div>
              ))}
              {typing && (
                <div className="ed-pop flex origin-bottom-left [animation-duration:.4s]" aria-label="Escribiendo">
                  <div className="flex gap-1 rounded-[12px_12px_12px_2px] bg-white px-[14px] py-[10px]">
                    {[0, 0.2, 0.4].map((delay) => (
                      <span
                        key={delay}
                        className="ed-blink size-1.5 rounded-full bg-[#6b7280]"
                        style={{ animationDelay: `${delay}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelRow({
  time,
  name,
  service,
  className = '',
  children,
}: {
  time: string;
  name: string;
  service: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid grid-cols-[44px_1fr_auto] items-center gap-[10px] rounded-[3px] px-2 py-[10px] ${className}`}>
      <span className="font-semibold text-ed-muted">{time}</span>
      <span>
        {name} <span className="text-ed-subtle">· {service}</span>
      </span>
      {children}
    </div>
  );
}
