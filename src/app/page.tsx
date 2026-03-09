import Link from "next/link";

function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg className="w-5 h-5 text-teal-deep flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChatBubbleIn({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="wa-bubble-in px-3 py-2 max-w-[75%] shadow-sm">
        <p className="text-[13px] text-gray-800 leading-snug">{text}</p>
        <p className="text-[10px] text-gray-400 text-right mt-1">{time}</p>
      </div>
    </div>
  );
}

function ChatBubbleOut({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex justify-end mb-3">
      <div className="wa-bubble-out px-3 py-2 max-w-[75%] shadow-sm">
        <p className="text-[13px] text-gray-800 leading-snug">{text}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <p className="text-[10px] text-gray-500">{time}</p>
          <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="grain min-h-screen font-sans relative overflow-hidden">
      {/* Floating WhatsApp Button */}
      <a
        href="#precios"
        className="wa-float fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-[#20BD5A] transition-colors"
        aria-label="WhatsApp"
      >
        <WhatsAppIcon className="w-7 h-7" />
      </a>

      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-ivory/80 border-b border-charcoal/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-18">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-teal-deep rounded-lg flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-charcoal tracking-tight">SaludBot</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <a href="#que-hacemos" className="px-4 py-2 text-sm font-medium text-warm-gray hover:text-charcoal transition-colors rounded-lg hover:bg-charcoal/5">
                Producto
              </a>
              <a href="#como-funciona" className="px-4 py-2 text-sm font-medium text-warm-gray hover:text-charcoal transition-colors rounded-lg hover:bg-charcoal/5">
                Proceso
              </a>
              <a href="#precios" className="px-4 py-2 text-sm font-medium text-warm-gray hover:text-charcoal transition-colors rounded-lg hover:bg-charcoal/5">
                Precios
              </a>
              <div className="w-px h-6 bg-charcoal/10 mx-2" />
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-warm-gray hover:text-charcoal transition-colors">
                Entrar
              </Link>
              <Link
                href="/register"
                className="ml-1 px-5 py-2.5 text-sm font-semibold text-white bg-teal-deep rounded-full hover:bg-teal-dark transition-all duration-300 hover:shadow-lg hover:shadow-teal-deep/20"
              >
                Comenzar gratis
              </Link>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-warm-gray">Entrar</Link>
              <Link href="/register" className="px-4 py-2 text-sm font-semibold text-white bg-teal-deep rounded-full">
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Mesh gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="mesh-blob absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-coral/15" />
          <div className="mesh-blob-2 absolute -bottom-20 -left-40 w-[500px] h-[500px] rounded-full bg-teal-medium/10" />
          <div className="mesh-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-sage/15" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left — Text */}
            <div className="lg:col-span-6 xl:col-span-5 stagger-in" style={{ animationDelay: "0.1s" }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-deep/8 border border-teal-deep/15 mb-8">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                <span className="text-xs font-semibold text-teal-deep tracking-wide uppercase">WhatsApp Business API</span>
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-[4.2rem] xl:text-7xl font-bold text-charcoal leading-[1.05] tracking-tight">
                Tu clínica,{" "}
                <span className="relative">
                  <span className="relative z-10 text-teal-deep italic">siempre</span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-coral/20 -z-0 -rotate-1" />
                </span>{" "}
                disponible
              </h1>

              <p className="mt-7 text-lg text-warm-gray leading-relaxed max-w-lg">
                Un asistente de IA que agenda citas, envía recordatorios y reduce
                inasistencias <span className="font-semibold text-charcoal">hasta en un 85%</span>. Todo desde
                el canal que tus pacientes ya usan todos los días.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 px-7 py-4 bg-teal-deep text-white text-base font-semibold rounded-full hover:bg-teal-dark transition-all duration-300 shadow-lg shadow-teal-deep/20 hover:shadow-xl hover:shadow-teal-deep/30"
                >
                  Solicitar demo gratis
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <a href="#como-funciona" className="inline-flex items-center gap-2 px-7 py-4 text-base font-semibold text-charcoal border-2 border-charcoal/15 rounded-full hover:border-charcoal/30 hover:bg-white/60 transition-all">
                  Ver cómo funciona
                </a>
              </div>
            </div>

            {/* Right — WhatsApp Phone Mockup */}
            <div className="lg:col-span-6 xl:col-span-7 flex justify-center lg:justify-end stagger-in" style={{ animationDelay: "0.4s" }}>
              <div className="relative">
                {/* Phone shell */}
                <div className="relative w-[320px] sm:w-[340px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl shadow-black/30 rotate-2 hover:rotate-0 transition-transform duration-500">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />

                  {/* Screen */}
                  <div className="bg-[#ECE5DD] rounded-[2.4rem] overflow-hidden">
                    {/* WhatsApp header */}
                    <div className="bg-teal-deep px-4 pt-10 pb-3 flex items-center gap-3">
                      <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">Centro Médico Vida</p>
                        <p className="text-white/60 text-xs">en línea</p>
                      </div>
                    </div>

                    {/* Chat area */}
                    <div className="px-3 py-4 min-h-[380px]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9c1b6' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
                      <div className="text-center mb-4">
                        <span className="inline-block px-3 py-1 bg-white/80 rounded-lg text-[10px] text-gray-500 shadow-sm">HOY</span>
                      </div>

                      <ChatBubbleOut text="Hola, quiero agendar una cita" time="9:41 a.m." />
                      <ChatBubbleIn text="¡Buen día! Con gusto le ayudo. ¿Qué servicio necesita?" time="9:41 a.m." />
                      <ChatBubbleOut text="Una consulta general" time="9:42 a.m." />
                      <ChatBubbleIn text="Perfecto. Tenemos disponibilidad esta semana:&#10;&#10;• Jueves 10:00 AM&#10;• Viernes 9:00 AM&#10;• Viernes 3:00 PM&#10;&#10;¿Cuál prefiere?" time="9:42 a.m." />
                      <ChatBubbleOut text="Viernes a las 9" time="9:42 a.m." />
                      <ChatBubbleIn text="¡Listo! Su cita queda agendada para el viernes a las 9:00 AM. Le enviaré un recordatorio. 😊" time="9:43 a.m." />
                    </div>

                    {/* Input bar */}
                    <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2">
                      <div className="flex-1 bg-white rounded-full px-4 py-2">
                        <p className="text-xs text-gray-400">Escribe un mensaje...</p>
                      </div>
                      <div className="w-9 h-9 bg-teal-deep rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating accent cards */}
                <div className="absolute -left-16 top-12 bg-white rounded-2xl shadow-xl p-4 rotate-[-4deg] hidden sm:block" style={{ animation: "fadeSlideUp 0.8s 0.8s cubic-bezier(0.16,1,0.3,1) forwards", opacity: 0 }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-charcoal">Cita confirmada</p>
                      <p className="text-[10px] text-warm-gray">Viernes 9:00 AM</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-12 bottom-28 bg-white rounded-2xl shadow-xl p-4 rotate-[3deg] hidden sm:block" style={{ animation: "fadeSlideUp 0.8s 1.1s cubic-bezier(0.16,1,0.3,1) forwards", opacity: 0 }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-coral/10 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-charcoal">Recordatorio enviado</p>
                      <p className="text-[10px] text-warm-gray">Hace 2 horas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF MARQUEE ===== */}
      <section className="py-6 bg-teal-deep overflow-hidden">
        <div className="marquee-track flex items-center gap-12 whitespace-nowrap">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-12">
              <span className="text-white/40 text-sm font-medium tracking-widest uppercase">Clínicas que confían en nosotros</span>
              <span className="text-coral text-sm">★★★★★</span>
              <span className="text-white/60 text-sm font-medium">Clínica Dental Sonrisa</span>
              <span className="text-white/30">·</span>
              <span className="text-white/60 text-sm font-medium">Veterinaria PetVida</span>
              <span className="text-white/30">·</span>
              <span className="text-white/60 text-sm font-medium">Centro Estético Bella</span>
              <span className="text-white/30">·</span>
              <span className="text-white/60 text-sm font-medium">Psicología Bienestar</span>
              <span className="text-white/30">·</span>
              <span className="text-white/60 text-sm font-medium">Consultorio Dra. Martínez</span>
              <span className="text-coral text-sm">★★★★★</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-20 lg:py-28 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {[
              { number: "85%", label: "menos inasistencias", accent: true },
              { number: "94%", label: "tasa de apertura WhatsApp", accent: false },
              { number: "24/7", label: "disponibilidad del bot", accent: false },
              { number: "< 3s", label: "tiempo de respuesta", accent: true },
            ].map((stat, i) => (
              <div key={i} className="text-center lg:text-left stagger-in" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                <p className={`font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight ${stat.accent ? "text-coral" : "text-teal-deep"}`}>
                  {stat.number}
                </p>
                <p className="mt-2 text-sm font-medium text-warm-gray uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES — ASYMMETRIC LAYOUT ===== */}
      <section id="que-hacemos" className="py-20 lg:py-28 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-ivory to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
          <div className="max-w-xl mb-16">
            <p className="text-sm font-semibold text-coral uppercase tracking-widest mb-3">Producto</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-charcoal leading-tight">
              Todo lo que tu clínica necesita, en WhatsApp
            </h2>
            <p className="mt-5 text-lg text-warm-gray leading-relaxed">
              Un asistente inteligente que trabaja 24/7 para que tú y tu equipo se enfoquen en lo más importante.
            </p>
          </div>

          {/* Feature Grid — 2 large + 3 small */}
          <div className="grid lg:grid-cols-12 gap-5">
            {/* Large card 1 */}
            <div className="lg:col-span-7 bg-teal-deep rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
              <div className="relative">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-3">Agenda inteligente 24/7</h3>
                <p className="text-white/70 text-base leading-relaxed max-w-md">
                  Tus pacientes agendan citas por WhatsApp a cualquier hora. El bot muestra
                  horarios disponibles en tiempo real conectado a Google Calendar y confirma al instante.
                </p>
              </div>
            </div>

            {/* Large card 2 */}
            <div className="lg:col-span-5 bg-gradient-to-br from-coral to-coral-dark rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden group">
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/3 -translate-x-1/3" />
              <div className="relative">
                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-3">Recordatorios automáticos</h3>
                <p className="text-white/80 text-base leading-relaxed">
                  Envía recordatorios por WhatsApp a 48h, 24h y 2h antes de cada cita. Los pacientes
                  confirman con un simple mensaje.
                </p>
              </div>
            </div>

            {/* 3 smaller cards */}
            <div className="lg:col-span-4 bg-ivory rounded-3xl p-7 border border-charcoal/5 group hover:border-teal-deep/20 transition-colors">
              <div className="w-12 h-12 bg-teal-deep/8 rounded-xl flex items-center justify-center mb-5 group-hover:bg-teal-deep/12 transition-colors">
                <svg className="w-6 h-6 text-teal-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal mb-2">Confirmaciones</h3>
              <p className="text-warm-gray text-sm leading-relaxed">
                Los pacientes confirman, cancelan o reagendan con un mensaje natural. Cero menús.
              </p>
            </div>

            <div className="lg:col-span-4 bg-ivory rounded-3xl p-7 border border-charcoal/5 group hover:border-teal-deep/20 transition-colors">
              <div className="w-12 h-12 bg-coral/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-coral/15 transition-colors">
                <svg className="w-6 h-6 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal mb-2">Multi-país LATAM</h3>
              <p className="text-warm-gray text-sm leading-relaxed">
                Colombia, México, Perú, Ecuador, Chile y Argentina. Moneda, zona horaria y locale automáticos.
              </p>
            </div>

            <div className="lg:col-span-4 bg-ivory rounded-3xl p-7 border border-charcoal/5 group hover:border-teal-deep/20 transition-colors">
              <div className="w-12 h-12 bg-sage/30 rounded-xl flex items-center justify-center mb-5 group-hover:bg-sage/40 transition-colors">
                <svg className="w-6 h-6 text-teal-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-charcoal mb-2">Panel de control</h3>
              <p className="text-warm-gray text-sm leading-relaxed">
                Dashboard con métricas en tiempo real: citas del día, pacientes, confirmaciones e inasistencias.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS — TIMELINE ===== */}
      <section id="como-funciona" className="py-20 lg:py-28 bg-ivory relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-20">
            <p className="text-sm font-semibold text-coral uppercase tracking-widest mb-3">Proceso</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-charcoal">
              Tres pasos. Cero complicaciones.
            </h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-deep/20 to-transparent" />

            <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="lg:text-center">
                  <div className="inline-flex lg:mx-auto w-16 h-16 bg-teal-deep text-white rounded-2xl items-center justify-center text-2xl font-serif font-bold mb-6 shadow-lg shadow-teal-deep/20 rotate-3 hover:rotate-0 transition-transform">
                    01
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-charcoal mb-3">Configuramos tu bot</h3>
                  <p className="text-warm-gray leading-relaxed">
                    Conectamos tu número de WhatsApp Business, configuramos tus servicios,
                    horarios y mensajes personalizados. Todo en menos de un día.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="lg:text-center">
                  <div className="inline-flex lg:mx-auto w-16 h-16 bg-coral text-white rounded-2xl items-center justify-center text-2xl font-serif font-bold mb-6 shadow-lg shadow-coral/20 -rotate-2 hover:rotate-0 transition-transform">
                    02
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-charcoal mb-3">Tus pacientes escriben</h3>
                  <p className="text-warm-gray leading-relaxed">
                    Los pacientes envían un mensaje por WhatsApp y la IA los guía con
                    lenguaje natural para agendar, confirmar o reagendar.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="lg:text-center">
                  <div className="inline-flex lg:mx-auto w-16 h-16 bg-charcoal text-white rounded-2xl items-center justify-center text-2xl font-serif font-bold mb-6 shadow-lg shadow-charcoal/20 rotate-2 hover:rotate-0 transition-transform">
                    03
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-charcoal mb-3">Tú gestionas todo</h3>
                  <p className="text-warm-gray leading-relaxed">
                    Desde tu panel ves todas las citas, pacientes y métricas.
                    El bot se encarga del resto automáticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="precios" className="py-20 lg:py-28 bg-teal-deep relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full border border-white/5" />
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/[0.02]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-coral uppercase tracking-widest mb-3">Precios</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight">
              Invierte en tu clínica,<br />
              <span className="text-coral-light italic">no en secretarias</span>
            </h2>
            <p className="mt-5 text-lg text-white/50 max-w-xl mx-auto">
              Todos los planes incluyen soporte, capacitación y configuración inicial.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-5 perspective-[2000px]">
            {/* Básico */}
            <div className="pricing-card bg-white rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ivory rounded-bl-[4rem]" />
              <div className="relative">
                <p className="text-sm font-semibold text-teal-deep uppercase tracking-wider">Básico</p>
                <p className="mt-1 text-sm text-warm-gray">Para clínicas que empiezan a automatizar</p>

                <div className="mt-6 pb-6 border-b border-gray-100">
                  <p className="text-xs text-warm-gray uppercase tracking-wider">Setup único</p>
                  <p className="text-3xl font-serif font-bold text-charcoal mt-1">
                    $800K – 2M <span className="text-sm font-sans font-normal text-warm-gray">COP</span>
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-warm-gray uppercase tracking-wider">Mensual</p>
                  <p className="text-3xl font-serif font-bold text-charcoal mt-1">
                    $300 – 500K <span className="text-sm font-sans font-normal text-warm-gray">COP/mes</span>
                  </p>
                </div>

                <ul className="mt-8 space-y-3">
                  <li className="flex items-start gap-3 text-sm text-charcoal"><CheckMark />Agendamiento por WhatsApp</li>
                  <li className="flex items-start gap-3 text-sm text-charcoal"><CheckMark />Recordatorios automáticos</li>
                  <li className="flex items-start gap-3 text-sm text-charcoal"><CheckMark />Panel administrativo</li>
                  <li className="flex items-start gap-3 text-sm text-charcoal"><CheckMark />Hasta 200 citas/mes</li>
                </ul>

                <Link href="/register" className="mt-8 block text-center px-6 py-3.5 rounded-full border-2 border-teal-deep text-teal-deep font-semibold text-sm hover:bg-teal-deep hover:text-white transition-all duration-300">
                  Solicitar demo
                </Link>
              </div>
            </div>

            {/* Autopilot — Featured */}
            <div className="pricing-card bg-charcoal rounded-3xl p-8 relative overflow-hidden lg:-mt-4 lg:mb-[-1rem] shadow-2xl shadow-black/40">
              {/* Ribbon */}
              <div className="absolute top-6 right-6">
                <span className="inline-block px-3 py-1 bg-coral text-white text-xs font-bold rounded-full uppercase tracking-wider">
                  Popular
                </span>
              </div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.03] rounded-tr-[6rem]" />
              <div className="relative">
                <p className="text-sm font-semibold text-coral uppercase tracking-wider">Autopilot</p>
                <p className="mt-1 text-sm text-white/40">Automatización completa con IA</p>

                <div className="mt-6 pb-6 border-b border-white/10">
                  <p className="text-xs text-white/40 uppercase tracking-wider">Setup único</p>
                  <p className="text-3xl font-serif font-bold text-white mt-1">
                    $3 – 5M <span className="text-sm font-sans font-normal text-white/40">COP</span>
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-white/40 uppercase tracking-wider">Mensual</p>
                  <p className="text-3xl font-serif font-bold text-white mt-1">
                    $500K – 1M <span className="text-sm font-sans font-normal text-white/40">COP/mes</span>
                  </p>
                </div>

                <ul className="mt-8 space-y-3">
                  <li className="flex items-start gap-3 text-sm text-white/80">
                    <svg className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Todo del plan Básico
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/80">
                    <svg className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    IA conversacional avanzada
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/80">
                    <svg className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Confirmaciones y reagendamiento
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/80">
                    <svg className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Lista de espera automática
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/80">
                    <svg className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Citas ilimitadas
                  </li>
                </ul>

                <Link href="/register" className="mt-8 block text-center px-6 py-3.5 rounded-full bg-coral text-white font-semibold text-sm hover:bg-coral-dark transition-all duration-300 shadow-lg shadow-coral/30">
                  Solicitar demo
                </Link>
              </div>
            </div>

            {/* Marketing */}
            <div className="pricing-card bg-white rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-ivory rounded-br-[4rem]" />
              <div className="relative">
                <p className="text-sm font-semibold text-teal-deep uppercase tracking-wider">Marketing</p>
                <p className="mt-1 text-sm text-warm-gray">Atrae y fideliza pacientes</p>

                <div className="mt-6 pb-6 border-b border-gray-100">
                  <p className="text-xs text-warm-gray uppercase tracking-wider">Setup único</p>
                  <p className="text-3xl font-serif font-bold text-charcoal mt-1">
                    $2 – 4M <span className="text-sm font-sans font-normal text-warm-gray">COP</span>
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-warm-gray uppercase tracking-wider">Mensual</p>
                  <p className="text-3xl font-serif font-bold text-charcoal mt-1">
                    $800K – 1.5M <span className="text-sm font-sans font-normal text-warm-gray">COP/mes</span>
                  </p>
                </div>

                <ul className="mt-8 space-y-3">
                  <li className="flex items-start gap-3 text-sm text-charcoal"><CheckMark />Campañas de WhatsApp masivas</li>
                  <li className="flex items-start gap-3 text-sm text-charcoal"><CheckMark />Seguimiento post-consulta</li>
                  <li className="flex items-start gap-3 text-sm text-charcoal"><CheckMark />Encuestas de satisfacción</li>
                  <li className="flex items-start gap-3 text-sm text-charcoal"><CheckMark />Reportes y analíticas</li>
                </ul>

                <Link href="/register" className="mt-8 block text-center px-6 py-3.5 rounded-full border-2 border-teal-deep text-teal-deep font-semibold text-sm hover:bg-teal-deep hover:text-white transition-all duration-300">
                  Solicitar demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 lg:py-28 bg-ivory relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="mesh-blob absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-coral/8" />
          <div className="mesh-blob-2 absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-teal-medium/8" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-charcoal leading-tight">
            Tu próximo paciente está esperando en{" "}
            <span className="text-teal-deep italic">WhatsApp</span>
          </h2>
          <p className="mt-6 text-lg text-warm-gray max-w-xl mx-auto leading-relaxed">
            Únete a las clínicas que ya automatizaron su agendamiento y dejaron de perder pacientes por inasistencias.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-teal-deep text-white text-lg font-semibold rounded-full hover:bg-teal-dark transition-all duration-300 shadow-xl shadow-teal-deep/20 hover:shadow-2xl hover:shadow-teal-deep/30"
            >
              Comenzar ahora
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/login" className="text-base font-medium text-warm-gray hover:text-charcoal transition-colors underline underline-offset-4 decoration-charcoal/20 hover:decoration-charcoal/50">
              Ya tengo una cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-charcoal text-white/40 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-12 gap-12">
            {/* Brand */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-teal-deep rounded-lg flex items-center justify-center rotate-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white tracking-tight">SaludBot</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                Automatiza la gestión de tu clínica con WhatsApp e inteligencia
                artificial. Hecho en Colombia, para clínicas de toda Latinoamérica.
              </p>
              <div className="mt-6 flex items-center gap-4">
                <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <WhatsAppIcon className="w-4 h-4 text-white/60" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="md:col-span-3 md:col-start-7">
              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-[0.2em] mb-5">Producto</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#que-hacemos" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a></li>
                <li><a href="#precios" className="hover:text-white transition-colors">Precios</a></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-[0.2em] mb-5">Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li>info@saludbot.co</li>
                <li>+57 300 123 4567</li>
                <li>Bogotá, Colombia</li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs">&copy; 2026 SaludBot. Todos los derechos reservados.</p>
            <div className="flex items-center gap-6 text-xs">
              <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
