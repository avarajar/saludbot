'use client';

import { useEffect } from 'react';

// Port of the design handoff's anim-editorial.js. Initial reveal state lives in
// globals.css (.ed-root [data-reveal]); this only flips `.is-in` and drives the
// scroll/mouse effects. Parallax and tilt are desktop-only; everything except
// reveals is skipped under prefers-reduced-motion.
export function useEditorialMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.ed-root');
    if (!root) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktop = window.matchMedia('(min-width: 768px)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const cleanups: (() => void)[] = [];

    // Reveals, staggers and growing rules
    root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      el.style.setProperty('--ed-delay', `${Number(el.dataset.delay) || 0}ms`);
    });
    root.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
      const step = Number(group.dataset.stagger) || 90;
      Array.from(group.children).forEach((child, i) => {
        (child as HTMLElement).style.setProperty('--ed-delay', `${i * step}ms`);
      });
    });
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    root.querySelectorAll('[data-reveal], [data-stagger], [data-grow]').forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    // Nav shrink + scroll progress
    const nav = root.querySelector<HTMLElement>('[data-nav]');
    const bar = root.querySelector<HTMLElement>('[data-progress]');
    const onScrollChrome = () => {
      const y = window.scrollY;
      if (nav) {
        nav.style.height = y > 40 ? '52px' : '64px';
        nav.style.boxShadow = y > 40 ? '0 10px 30px -20px rgba(20,26,46,.35)' : 'none';
      }
      if (bar) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${h ? y / h : 0})`;
      }
    };
    window.addEventListener('scroll', onScrollChrome, { passive: true });
    onScrollChrome();
    cleanups.push(() => window.removeEventListener('scroll', onScrollChrome));

    if (reduced) return () => cleanups.forEach((fn) => fn());

    // Parallax
    if (desktop) {
      const layers = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]'));
      let raf = 0;
      const onScrollParallax = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const y = window.scrollY;
          layers.forEach((el) => {
            el.style.transform = `translate3d(0,${(y * Number(el.dataset.parallax)).toFixed(1)}px,0)`;
          });
        });
      };
      window.addEventListener('scroll', onScrollParallax, { passive: true });
      onScrollParallax();
      cleanups.push(() => {
        window.removeEventListener('scroll', onScrollParallax);
        cancelAnimationFrame(raf);
      });
    }

    // Magnetic buttons
    if (finePointer) {
      root.querySelectorAll<HTMLElement>('[data-magnet]').forEach((el) => {
        el.style.transition = 'transform .35s cubic-bezier(.16,1,.3,1), background .3s, color .3s, box-shadow .3s';
        const move = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - r.left - r.width / 2;
          const y = e.clientY - r.top - r.height / 2;
          el.style.transform = `translate(${x * 0.18}px,${y * 0.3}px)`;
        };
        const leave = () => {
          el.style.transform = '';
        };
        el.addEventListener('mousemove', move);
        el.addEventListener('mouseleave', leave);
        cleanups.push(() => {
          el.removeEventListener('mousemove', move);
          el.removeEventListener('mouseleave', leave);
        });
      });
    }

    // Mouse-follow tilt on the hero mock
    const tilt = root.querySelector<HTMLElement>('[data-tilt]');
    if (tilt && desktop && finePointer) {
      tilt.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
      const move = (e: MouseEvent) => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        tilt.style.transform = `perspective(1400px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
      };
      window.addEventListener('mousemove', move);
      cleanups.push(() => window.removeEventListener('mousemove', move));
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);
}

export function EditorialMotion() {
  useEditorialMotion();
  return null;
}
