import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-baseline gap-2 text-ed-ink">
      <span className="font-display text-[26px] tracking-[-.02em]">SaludBot</span>
      <span className="inline-block size-1.5 rounded-full bg-ed-coral" />
    </Link>
  );
}

export function Eyebrow({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'coral' }) {
  return (
    <p
      className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[.16em] ${
        tone === 'coral' ? 'text-ed-coral' : 'text-ed-blue'
      }`}
    >
      <span className="h-px w-8 bg-ed-coral" />
      {children}
    </p>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-ed-ink py-8">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 text-[13px] text-ed-muted sm:px-8">
        <span>
          <span className="font-display text-xl text-ed-ink">SaludBot</span> &nbsp;·&nbsp; Bogotá, Colombia &nbsp;·&nbsp; © 2026
        </span>
        <div className="flex flex-wrap gap-6">
          <a href="mailto:info@saludbot.co" className="text-ed-ink hover:text-ed-coral">
            info@saludbot.co
          </a>
          <Link href="/privacidad" className="text-ed-ink hover:text-ed-coral">
            Política de Privacidad
          </Link>
          <Link href="/terminos" className="text-ed-ink hover:text-ed-coral">
            Términos y Condiciones
          </Link>
        </div>
      </div>
    </footer>
  );
}
