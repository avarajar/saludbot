// SaludBot landing — motion, hero chat, FAQ, pilot slots and application form.
// Plain JS, no build step: served as-is by GitHub Pages and by server.mjs locally.
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const media = (q) => window.matchMedia(q).matches;

  // Kept in sync by hand with src/lib/clinics/templates.ts and countries.ts
  const SPECIALTIES = ['Odontología', 'Veterinaria', 'Estética', 'Psicología', 'Dermatología', 'Fisioterapia', 'Otra'];
  const COUNTRIES = ['Colombia', 'México', 'Perú', 'Ecuador', 'Chile', 'Argentina', 'Venezuela', 'Panamá', 'Costa Rica', 'Rep. Dominicana'];
  // Values must match the check constraint in supabase/migrations/011
  const SCHEDULING = [
    ['whatsapp_manual', 'WhatsApp o cuaderno, a mano'],
    ['excel', 'Excel u hoja de cálculo'],
    ['google_calendar', 'Google Calendar'],
    ['dentalink', 'Dentalink'],
    ['doctoralia', 'Doctoralia'],
    ['otro_software', 'Otro software'],
  ];

  // Supabase publishable key: safe in the browser. RLS only lets it insert
  // applications, upload logos and read approved slots (supabase/migrations/010).
  const SUPABASE_URL = 'https://txrevckvhxaaywtjsmjg.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_63HxRaMPbw1EdE5W0RxV6A_qRRv0-NP';
  const LOGO_BUCKET = 'pilot-logos';
  const MAX_LOGO_BYTES = 5 * 1024 * 1024;
  const LOGO_SIZE = 256;

  /* ---------------- Motion (port of the handoff's anim-editorial.js) ---------------- */
  function setupMotion() {
    const reduced = media('(prefers-reduced-motion: reduce)');
    const desktop = media('(min-width: 768px)');
    const finePointer = media('(pointer: fine)');

    $$('[data-stagger]').forEach((group) => {
      const step = Number(group.dataset.stagger) || 90;
      Array.from(group.children).forEach((child, i) => child.style.setProperty('--d', `${i * step}ms`));
    });
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    $$('[data-reveal], [data-stagger], [data-grow]').forEach((el) => io.observe(el));

    const nav = $('[data-nav]');
    const bar = $('[data-progress]');
    const onScroll = () => {
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
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (reduced) return;

    if (desktop) {
      const layers = $$('[data-parallax]');
      let raf = 0;
      const onParallax = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const y = window.scrollY;
          layers.forEach((el) => { el.style.transform = `translate3d(0,${(y * Number(el.dataset.parallax)).toFixed(1)}px,0)`; });
        });
      };
      window.addEventListener('scroll', onParallax, { passive: true });
      onParallax();
    }

    if (finePointer) {
      $$('[data-magnet]').forEach((el) => {
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
        });
        el.addEventListener('mouseleave', () => { el.style.transform = ''; });
      });
      const tilt = $('[data-tilt]');
      if (tilt && desktop) {
        tilt.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
        window.addEventListener('mousemove', (e) => {
          const x = e.clientX / window.innerWidth - 0.5;
          const y = e.clientY / window.innerHeight - 0.5;
          tilt.style.transform = `perspective(1400px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
        });
      }
    }
  }

  /* ---------------- Hero chat loop ---------------- */
  // A page can replace the script with <script type="application/json" data-chat-script>
  const DEFAULT_CHAT = [
    { me: true, text: 'Hola, necesito una cita para limpieza dental' },
    { me: false, text: 'Con gusto. Para limpieza (60 min) tengo jueves 10:00 a. m., viernes 9:00 a. m. o viernes 3:00 p. m. ¿Cuál prefiere?' },
    { me: true, text: 'El viernes a las 9' },
    { me: false, text: 'Listo. Su cita queda para el viernes a las 9:00 a. m. Le recordaré antes.' },
    { me: false, text: 'Recordatorio: su limpieza es mañana a las 9:00 a. m. Responda 1 para confirmar o 2 para reagendar.' },
    { me: true, text: '1' },
    { me: false, text: 'Confirmada. La esperamos mañana a las 9:00 a. m.' },
  ];
  const PAUSE_TICKS = 3;

  function setupChat() {
    const chat = $('[data-chat]');
    if (!chat) return;
    const custom = $('[data-chat-script]');
    const CHAT = custom ? JSON.parse(custom.textContent) : DEFAULT_CHAT;
    const row = $('[data-row-9]');
    const pill = $('[data-pill]');
    const count = $('[data-confirmed]');
    let step = 0;

    const render = () => {
      const shown = Math.min(step, CHAT.length);
      const next = CHAT[shown];
      chat.replaceChildren(...CHAT.slice(0, shown).map((m) => {
        const wrap = document.createElement('div');
        wrap.className = m.me ? 'msg me' : 'msg';
        const p = document.createElement('p');
        p.textContent = m.text;
        wrap.append(p);
        return wrap;
      }));
      // Only the newest bubble animates in
      Array.from(chat.children).slice(0, -1).forEach((el) => { el.style.animation = 'none'; });
      if (step > 0 && next && !next.me) {
        const typing = document.createElement('div');
        typing.className = 'msg';
        typing.setAttribute('aria-label', 'Escribiendo');
        typing.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
        chat.append(typing);
      }
      const confirmed = shown >= CHAT.length - 1;
      row.classList.toggle('confirmed', confirmed);
      pill.textContent = confirmed ? 'Confirmada' : 'Pendiente';
      count.textContent = confirmed ? '3' : '2';
      return next && !next.me ? 2100 : 1400;
    };

    const tick = () => {
      step = (step + 1) % (CHAT.length + PAUSE_TICKS);
      setTimeout(tick, render());
    };
    setTimeout(tick, render());
  }

  /* ---------------- FAQ accordion (one open at a time) ---------------- */
  function setupFaq() {
    const items = $$('.faq-item');
    items.forEach((item) => {
      $('.faq-q', item).addEventListener('click', () => {
        const willOpen = !item.classList.contains('open');
        items.forEach((other) => {
          other.classList.remove('open');
          $('.faq-q', other).setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          item.classList.add('open');
          $('.faq-q', item).setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------------- Supabase (plain fetch, no SDK) ---------------- */
  const sb = (path, init = {}) => fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SUPABASE_KEY, ...init.headers },
  });

  // Postgres/trigger errors → messages fit for the applicant
  const APPLY_ERRORS = {
    23505: 'Ya recibimos una postulación con ese WhatsApp. Te escribimos pronto.',
    pilot_full: 'Los 10 cupos ya están tomados. Escríbenos a info@saludbot.co para la lista de espera.',
    pilot_queue_full: 'Estamos revisando muchas postulaciones. Escríbenos a info@saludbot.co y te guardamos el lugar.',
    rate_limited: 'Estamos recibiendo muchas postulaciones. Inténtalo de nuevo en un rato.',
  };

  /* ---------------- Pilot slots (only approved clinics take a slot) ---------------- */
  let slotState = { total: 10, cupos: [] };

  async function loadSlots() {
    try {
      const res = await sb('/rest/v1/rpc/pilot_slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (res.ok) slotState = await res.json();
    } catch {
      // Keep the empty default: every slot shows as available
    }
    renderSlots();
  }

  // The logo bucket is private: fetch with the key, then show it as a blob URL.
  async function loadLogo(img, path) {
    try {
      const res = await sb(`/storage/v1/object/authenticated/${LOGO_BUCKET}/${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('logo');
      img.src = URL.createObjectURL(await res.blob());
    } catch {
      img.replaceWith(Object.assign(document.createElement('span'), { className: 'slot-name', textContent: img.alt }));
    }
  }

  function renderSlots() {
    const grid = $('[data-slots]');
    const note = $('[data-slots-note]');
    if (!grid) return;
    const { total, cupos } = slotState;
    const taken = cupos.length;

    grid.replaceChildren(...Array.from({ length: total }, (_, i) => {
      const cupo = cupos[i];
      const el = document.createElement(cupo ? 'div' : 'button');
      el.className = 'slot';
      if (!cupo) {
        el.type = 'button';
        el.textContent = String(i + 1);
        el.setAttribute('aria-label', `Cupo ${i + 1} disponible: postular mi clínica`);
        el.addEventListener('click', openApply);
        return el;
      }
      el.classList.add('taken', 'approved');
      const label = cupo.nombre || `Clínica en ${cupo.ciudad || 'LATAM'}`;
      if (cupo.logo) {
        const img = document.createElement('img');
        img.alt = label;
        el.append(img);
        loadLogo(img, cupo.logo);
      } else {
        const name = document.createElement('span');
        name.className = 'slot-name';
        name.textContent = label;
        el.append(name);
      }
      el.title = [cupo.nombre, cupo.ciudad].filter(Boolean).join(' · ');
      return el;
    }));

    const free = total - taken;
    if (taken === 0) {
      note.textContent = `${total} de ${total} disponibles. Ninguna clínica ha entrado todavía; la primera puede ser la tuya.`;
    } else if (free > 0) {
      note.textContent = `${free} de ${total} disponibles (${taken} clínica${taken === 1 ? '' : 's'} fundadora${taken === 1 ? '' : 's'}).`;
    } else {
      note.textContent = 'Los 10 cupos están tomados. Escríbenos a info@saludbot.co para la lista de espera.';
    }
    $$('[data-apply]').forEach((btn) => { btn.hidden = free <= 0; });
  }

  /* ---------------- Application form ---------------- */
  let logoDataUrl = null;

  function openApply() {
    const dialog = $('[data-apply-dialog]');
    $('[data-apply-form]').hidden = false;
    $('[data-apply-done]').hidden = true;
    dialog.showModal();
  }

  // options: plain strings, or [value, label] pairs
  function fillSelect(select, options, placeholder) {
    select.replaceChildren(new Option(placeholder, ''), ...options.map((o) => (Array.isArray(o) ? new Option(o[1], o[0]) : new Option(o, o))));
  }

  // Downscale the logo in the browser so the server only ever stores a small file.
  async function resizeLogo(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, LOGO_SIZE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL('image/webp', 0.85); // falls back to PNG where WebP encoding is unsupported
  }

  function setupApply() {
    const dialog = $('[data-apply-dialog]');
    const form = $('[data-apply-form]');
    const error = $('[data-apply-error]');
    const submit = $('[data-apply-submit]');
    const preview = $('[data-logo-preview]');
    const logoInput = $('[data-logo-input]');
    const logoLabel = $('[data-logo-label]');
    if (!dialog || !form) return;

    const specialties = $('[data-specialties]');
    fillSelect(specialties, SPECIALTIES, 'Elige…');
    specialties.value = form.dataset.specialty || '';
    fillSelect($('[data-countries]'), COUNTRIES, 'Elige…');
    fillSelect($('[data-scheduling]'), SCHEDULING, 'Elige… (opcional)');
    $$('[data-apply]').forEach((btn) => btn.addEventListener('click', openApply));
    $$('[data-apply-close]').forEach((btn) => btn.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

    const showError = (msg) => { error.textContent = msg; error.hidden = false; };

    logoInput.addEventListener('change', async () => {
      error.hidden = true;
      logoDataUrl = null;
      preview.textContent = 'Logo';
      logoLabel.textContent = 'Subir logo';
      const file = logoInput.files[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return showError('El logo debe ser PNG, JPG o WebP.');
      if (file.size > MAX_LOGO_BYTES) return showError('El logo pesa más de 5 MB. Prueba con uno más liviano.');
      try {
        logoDataUrl = await resizeLogo(file);
        const img = new Image();
        img.src = logoDataUrl;
        img.alt = 'Vista previa del logo';
        preview.replaceChildren(img);
        logoLabel.textContent = 'Cambiar logo';
      } catch {
        showError('No pudimos leer esa imagen. Prueba con otra.');
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      error.hidden = true;
      form.classList.add('was-validated');
      if (!form.checkValidity()) {
        const firstInvalid = form.querySelector(':invalid');
        firstInvalid?.focus();
        return showError(firstInvalid?.name === 'acepta'
          ? 'Para postularte necesitas aceptar la Política de Privacidad y los Términos.'
          : 'Revisa los campos marcados: faltan datos o hay alguno inválido.');
      }
      const data = Object.fromEntries(new FormData(form));
      const done = () => {
        form.reset();
        specialties.value = form.dataset.specialty || '';
        form.classList.remove('was-validated');
        logoDataUrl = null;
        preview.textContent = 'Logo';
        logoLabel.textContent = 'Subir logo';
        form.hidden = true;
        $('[data-apply-done]').hidden = false;
      };
      // Honeypot filled → a bot. Look like a success so it doesn't retry, but send nothing.
      if (data.sitio) return done();

      submit.disabled = true;
      try {
        let logoPath = null;
        if (logoDataUrl) {
          const blob = await (await fetch(logoDataUrl)).blob();
          logoPath = `${crypto.randomUUID()}.${{ 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' }[blob.type]}`;
          const up = await sb(`/storage/v1/object/${LOGO_BUCKET}/${logoPath}`, {
            method: 'POST',
            headers: { 'Content-Type': blob.type },
            body: blob,
          });
          if (!up.ok) throw new Error('logo');
        }
        const res = await sb('/rest/v1/pilot_applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({
            clinic_name: data.clinica.trim(), specialty: data.especialidad, country: data.pais,
            city: data.ciudad.trim(), contact_name: data.contacto.trim(), whatsapp: data.whatsapp.trim(),
            email: data.correo.trim() || null, show_publicly: form.mostrar.checked,
            accepted_terms: form.acepta.checked, logo_path: logoPath,
            current_scheduling: data.agenda || null,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(APPLY_ERRORS[body.code] || APPLY_ERRORS[body.message] || 'fallo');
        }
        done();
      } catch (err) {
        showError(Object.values(APPLY_ERRORS).includes(err.message)
          ? err.message
          : 'No pudimos enviar tu postulación. Escríbenos a info@saludbot.co y te reservamos el cupo.');
      } finally {
        submit.disabled = false;
      }
    });
  }

  setupMotion();
  setupChat();
  setupFaq();
  setupApply();
  loadSlots();
})();
