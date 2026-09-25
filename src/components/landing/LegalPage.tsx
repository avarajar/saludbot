import Link from 'next/link';
import { LandingFooter, Logo } from './parts';

export type LegalSection = { title: string; body: React.ReactNode };

export function LegalPage({ title, sections }: { title: string; sections: readonly LegalSection[] }) {
  return (
    <div className="ed-root min-h-screen bg-ed-cream font-body text-ed-ink antialiased">
      <nav className="border-b border-ed-ink/10">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 sm:px-8">
          <Logo />
          <Link href="/" className="text-sm font-semibold text-ed-ink hover:text-ed-coral">
            ← Volver
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-[720px] px-4 pb-[120px] pt-20 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-ed-blue">Legal</p>
        <h1 className="mt-4 font-display text-[clamp(38px,5vw,56px)] font-normal leading-none tracking-[-.03em]">{title}</h1>
        <p className="mt-4 text-sm text-ed-subtle">Última actualización: [fecha]</p>
        <div className="mt-8 rounded-[6px] border border-ed-coral/30 bg-ed-coral/8 px-5 py-4 text-sm leading-relaxed text-[#8A2E18]">
          Borrador. Revisar con asesoría legal antes de publicar. Los puntos entre corchetes están por definir.
        </div>
        <div className="mt-12 grid gap-10 text-base leading-[1.7] text-ed-muted [&_a]:text-ed-blue [&_a:hover]:text-ed-blue-hover [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:pl-5">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 font-display text-2xl font-normal tracking-[-.02em] text-ed-ink">{section.title}</h2>
              {section.body}
            </section>
          ))}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
