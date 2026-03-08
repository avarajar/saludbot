import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">SaludBot</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#funcionalidades"
                className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                Funcionalidades
              </a>
              <a
                href="#como-funciona"
                className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                Cómo Funciona
              </a>
              <a
                href="#precios"
                className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                Precios
              </a>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                Ir al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
              Potenciado por WhatsApp Business API
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
              Automatiza tu clínica con{" "}
              <span className="text-emerald-500">WhatsApp e IA</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Agenda citas, envía recordatorios y reduce inasistencias en un
              85%. Todo desde WhatsApp.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#precios"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-emerald-500 text-white text-base font-semibold hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
              >
                Solicitar Demo Gratis
              </a>
              <a
                href="#como-funciona"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-lg border border-gray-300 text-gray-700 text-base font-semibold hover:bg-gray-50 transition-colors"
              >
                Ver Cómo Funciona
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Todo lo que tu clínica necesita
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Un asistente inteligente que trabaja 24/7 para que tú y tu equipo
              se enfoquen en lo que más importa: tus pacientes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-5">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Agenda 24/7
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Tus pacientes pueden agendar citas por WhatsApp a cualquier
                hora, cualquier día. Sin llamadas, sin esperas. El chatbot
                muestra horarios disponibles y confirma al instante.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-5">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Recordatorios Automáticos
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Envía recordatorios automáticos por WhatsApp 24h y 2h antes de
                cada cita. Los pacientes confirman o reagendan con un simple
                mensaje.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-5">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Cero Inasistencias
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Reduce las inasistencias hasta en un 85% con confirmaciones
                inteligentes, listas de espera automáticas y seguimiento
                post-cita para fidelizar pacientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Cómo Funciona
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              En 3 simples pasos tu clínica estará automatizada con WhatsApp e
              inteligencia artificial.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg shadow-emerald-500/25">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Configuramos tu Bot
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Conectamos tu número de WhatsApp Business, configuramos tus
                servicios, horarios y mensajes personalizados para tu clínica.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg shadow-emerald-500/25">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Tus Pacientes Escriben
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Los pacientes envían un mensaje por WhatsApp y el chatbot los
                guía para agendar, confirmar o reagendar sus citas al instante.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg shadow-emerald-500/25">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Tú Gestionas Todo
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Desde el panel de administración ves todas las citas, pacientes
                y métricas. El bot se encarga del resto automáticamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Planes y Precios
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a las necesidades de tu clínica.
              Todos incluyen soporte y capacitación.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Básico */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:border-emerald-200 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900">Básico</h3>
              <p className="mt-2 text-sm text-gray-500">
                Ideal para clínicas pequeñas que quieren empezar a automatizar.
              </p>
              <div className="mt-6">
                <p className="text-sm text-gray-500">Setup único</p>
                <p className="text-2xl font-bold text-gray-900">
                  $800K - 2M{" "}
                  <span className="text-sm font-normal text-gray-500">COP</span>
                </p>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">Mensual</p>
                <p className="text-2xl font-bold text-gray-900">
                  $300 - 500K{" "}
                  <span className="text-sm font-normal text-gray-500">
                    COP/mes
                  </span>
                </p>
              </div>
              <ul className="mt-8 space-y-3">
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Agendamiento por WhatsApp
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Recordatorios automáticos
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Panel administrativo básico
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Hasta 200 citas/mes
                </li>
              </ul>
              <a
                href="#"
                className="mt-8 block w-full text-center px-4 py-3 rounded-lg border border-emerald-500 text-emerald-600 font-semibold hover:bg-emerald-50 transition-colors"
              >
                Solicitar Demo
              </a>
            </div>

            {/* Autopilot */}
            <div className="relative bg-white rounded-2xl border-2 border-emerald-500 p-8 shadow-lg shadow-emerald-500/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">
                Más Popular
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Autopilot</h3>
              <p className="mt-2 text-sm text-gray-500">
                Automatización completa con IA para clínicas en crecimiento.
              </p>
              <div className="mt-6">
                <p className="text-sm text-gray-500">Setup único</p>
                <p className="text-2xl font-bold text-gray-900">
                  $3 - 5M{" "}
                  <span className="text-sm font-normal text-gray-500">COP</span>
                </p>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">Mensual</p>
                <p className="text-2xl font-bold text-gray-900">
                  $500K - 1M{" "}
                  <span className="text-sm font-normal text-gray-500">
                    COP/mes
                  </span>
                </p>
              </div>
              <ul className="mt-8 space-y-3">
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Todo del plan Básico
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  IA conversacional avanzada
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Confirmaciones y reagendamiento
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Lista de espera automática
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Citas ilimitadas
                </li>
              </ul>
              <a
                href="#"
                className="mt-8 block w-full text-center px-4 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/25"
              >
                Solicitar Demo
              </a>
            </div>

            {/* Marketing */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:border-emerald-200 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900">Marketing</h3>
              <p className="mt-2 text-sm text-gray-500">
                Atrae nuevos pacientes y fideliza los existentes con campañas
                automatizadas.
              </p>
              <div className="mt-6">
                <p className="text-sm text-gray-500">Setup único</p>
                <p className="text-2xl font-bold text-gray-900">
                  $2 - 4M{" "}
                  <span className="text-sm font-normal text-gray-500">COP</span>
                </p>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">Mensual</p>
                <p className="text-2xl font-bold text-gray-900">
                  $800K - 1.5M{" "}
                  <span className="text-sm font-normal text-gray-500">
                    COP/mes
                  </span>
                </p>
              </div>
              <ul className="mt-8 space-y-3">
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Campañas de WhatsApp masivas
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Seguimiento post-consulta
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Encuestas de satisfacción
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Reportes y analíticas
                </li>
              </ul>
              <a
                href="#"
                className="mt-8 block w-full text-center px-4 py-3 rounded-lg border border-emerald-500 text-emerald-600 font-semibold hover:bg-emerald-50 transition-colors"
              >
                Solicitar Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">SaludBot</span>
              </div>
              <p className="text-sm leading-relaxed max-w-md">
                Automatiza la gestión de tu clínica con WhatsApp e inteligencia
                artificial. Hecho en Colombia, para clínicas colombianas.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Contacto
              </h4>
              <ul className="space-y-2 text-sm">
                <li>info@saludbot.co</li>
                <li>+57 300 123 4567</li>
                <li>Bogotá, Colombia</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Enlaces
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#funcionalidades"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a
                    href="#precios"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Precios
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Política de Privacidad
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Términos y Condiciones
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; 2026 SaludBot. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
