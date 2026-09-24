'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import BusinessHoursEditor from '@/components/clinic/BusinessHoursEditor';
import { COUNTRIES, getCountry } from '@/lib/clinics/countries';
import { SPECIALTIES, SERVICE_TEMPLATES, DEFAULT_BUSINESS_HOURS } from '@/lib/clinics/templates';
import type { BusinessHours, ClinicSpecialty } from '@/types';

interface ServiceDraft { name: string; duration_minutes: number; price: number | null }

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow';

const TOTAL_STEPS = 4;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneLink, setDoneLink] = useState<string | null>(null);

  const [country, setCountry] = useState('CO');
  const [specialty, setSpecialty] = useState<ClinicSpecialty>('dental');
  const [clinicData, setClinicData] = useState({ name: '', phoneLocal: '', address: '', city: '' });
  const [services, setServices] = useState<ServiceDraft[]>(
    SERVICE_TEMPLATES.dental.map((s) => ({ ...s, price: null })),
  );
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);

  const countryInfo = getCountry(country);
  const slug = slugify(clinicData.name);

  const pickSpecialty = (sp: ClinicSpecialty) => {
    setSpecialty(sp);
    setServices(SERVICE_TEMPLATES[sp].map((s) => ({ ...s, price: null })));
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: clinicData.name,
          phone: `${countryInfo.phonePrefix} ${clinicData.phoneLocal}`.trim(),
          address: clinicData.address,
          city: clinicData.city,
          country,
          specialty,
          business_hours: hours,
          services,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError('No se pudo completar el registro. Revise los datos e intente de nuevo.');
        return;
      }
      setDoneLink(json.whatsapp_link);
    } catch {
      setError('Error de conexion. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (doneLink) {
    return (
      <main className="mx-auto max-w-xl p-8">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xl">✅</div>
          <h1 className="text-xl font-semibold text-gray-900">¡Su clínica quedó configurada!</h1>
          <p className="mt-2 text-sm text-gray-600">
            Comparta este enlace con sus pacientes para que le escriban por WhatsApp:
          </p>
          <a
            href={doneLink}
            className="mt-3 block break-all font-mono text-sm text-emerald-600 hover:text-emerald-700"
            target="_blank"
            rel="noreferrer"
          >
            {doneLink}
          </a>
          <Button className="mt-6" onClick={() => router.push('/dashboard')}>Ir al panel</Button>
        </div>
      </main>
    );
  }

  const stepTitles: Record<number, string> = {
    1: '¿Dónde está su clínica?',
    2: 'Datos de la clínica',
    3: 'Servicios que ofrece',
    4: 'Horario de atención',
  };

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold text-gray-900">Configure su clínica</h1>
      <div className="mt-2 flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-emerald-500' : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className="mt-1 text-sm text-gray-500">Paso {step} de {TOTAL_STEPS}</p>

      <div className="mt-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
            {step}
          </span>
          <h2 className="text-lg font-semibold text-gray-900">{stepTitles[step]}</h2>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">País</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Especialidad</label>
                <select
                  value={specialty}
                  onChange={(e) => pickSpecialty(e.target.value as ClinicSpecialty)}
                  className={inputClass}
                >
                  {SPECIALTIES.map((s) => (
                    <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                🕐 {countryInfo.timezone}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                💰 {countryInfo.currency}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                📞 {countryInfo.phonePrefix}
              </span>
            </div>
            <Button onClick={() => setStep(2)}>Continuar</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nombre de la clínica *</label>
              <input
                className={inputClass}
                value={clinicData.name}
                onChange={(e) => setClinicData({ ...clinicData, name: e.target.value })}
                placeholder="Ej: Clínica Vida"
              />
              {slug && (
                <p className="mt-1 text-xs text-gray-400">
                  URL: saludbot.co/<span className="font-medium text-gray-500">{slug}</span>
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono *</label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm font-medium text-gray-500">
                  {countryInfo.flag} {countryInfo.phonePrefix}
                </span>
                <input
                  type="tel"
                  className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 transition-shadow focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={clinicData.phoneLocal}
                  onChange={(e) => setClinicData({ ...clinicData, phoneLocal: e.target.value })}
                  placeholder="300 123 4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Dirección *</label>
                <input
                  className={inputClass}
                  value={clinicData.address}
                  onChange={(e) => setClinicData({ ...clinicData, address: e.target.value })}
                  placeholder="Cra 7 #45-12, Local 201"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ciudad *</label>
                <input
                  className={inputClass}
                  value={clinicData.city}
                  onChange={(e) => setClinicData({ ...clinicData, city: e.target.value })}
                  placeholder="Bogotá"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" onClick={() => setStep(1)}>Atrás</Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!clinicData.name || !clinicData.phoneLocal || !clinicData.address || !clinicData.city}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Pre-cargamos servicios típicos de {SPECIALTIES.find((s) => s.value === specialty)?.label.toLowerCase()}.
              Ajústelos a su clínica.
            </p>
            {services.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={inputClass}
                  value={s.name}
                  placeholder="Nombre del servicio"
                  onChange={(e) => setServices(services.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={10}
                    max={480}
                    className="w-20 rounded-lg border border-gray-300 px-2 py-2.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    title="Duración (minutos)"
                    value={s.duration_minutes}
                    onChange={(e) =>
                      setServices(services.map((x, j) => (j === i ? { ...x, duration_minutes: Number(e.target.value) } : x)))
                    }
                  />
                  <span className="text-xs text-gray-400">min</span>
                </div>
                <button
                  type="button"
                  aria-label="Eliminar servicio"
                  className="text-gray-300 hover:text-red-500"
                  onClick={() => setServices(services.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              onClick={() => setServices([...services, { name: '', duration_minutes: 30, price: null }])}
            >
              + Agregar servicio
            </button>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" onClick={() => setStep(2)}>Atrás</Button>
              <Button
                onClick={() => setStep(4)}
                disabled={
                  services.length === 0 ||
                  services.some(
                    (s) =>
                      s.name.trim().length < 2 ||
                      !Number.isInteger(s.duration_minutes) ||
                      s.duration_minutes < 10 ||
                      s.duration_minutes > 480,
                  )
                }
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <BusinessHoursEditor value={hours} onChange={setHours} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" onClick={() => setStep(3)}>Atrás</Button>
              <Button onClick={submit} disabled={saving}>{saving ? 'Guardando...' : 'Finalizar'}</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
