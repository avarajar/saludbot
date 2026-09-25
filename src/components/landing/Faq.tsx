'use client';

import { useState } from 'react';

export type FaqItem = { q: string; a: string };

export function Faq({ items }: { items: readonly FaqItem[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div data-reveal data-delay="120" className="border-t border-ed-ink">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="border-b border-ed-ink/15">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-${i}`}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left"
            >
              <span className="font-display text-[23px] leading-[1.25] tracking-[-.01em] text-ed-ink">{item.q}</span>
              <span
                aria-hidden
                className={`grid size-8 shrink-0 place-items-center rounded-full border border-ed-ink text-xl font-light text-ed-ink transition-transform duration-[400ms] ease-editorial ${
                  isOpen ? 'rotate-45' : ''
                }`}
              >
                +
              </span>
            </button>
            <div
              id={`faq-${i}`}
              className={`grid transition-[grid-template-rows] duration-[450ms] ease-editorial ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p className="pb-6 pr-14 text-base leading-[1.65] text-ed-muted">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
