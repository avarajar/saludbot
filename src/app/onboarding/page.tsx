'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { BusinessHours, ClinicSpecialty } from '@/types';

const SERVICE_TEMPLATES: Record<ClinicSpecialty, { name: string; duration_minutes: number }[]> = {
  dental: [
    { name: 'Consulta general', duration_minutes: 30 },
    { name: 'Limpieza dental', duration_minutes: 60 },
    { name: 'Ortodoncia (control)', duration_minutes: 30 },
  ],
  veterinary: [
    { name: 'Consulta general', duration_minutes: 30 },
    { name: 'Vacunacion', duration_minutes: 20 },
    { name: 'Peluqueria', duration_minutes: 60 },
  ],
  aesthetic: [
    { name: 'Valoracion', duration_minutes: 30 },
    { name: 'Limpieza facial', duration_minutes: 60 },
  ],
  psychology: [{ name: 'Sesion de terapia', duration_minutes: 50 }],
  dermatology: [{ name: 'Consulta dermatologica', duration_minutes: 30 }],
  physiotherapy: [{ name: 'Sesion de fisioterapia', duration_minutes: 45 }],
  other: [{ name: 'Consulta', duration_minutes: 30 }],
};

const DEFAULT_HOURS: BusinessHours = {
  monday: { open: '08:00', close: '18:00' },
  tuesday: { open: '08:00', close: '18:00' },
  wednesday: { open: '08:00', close: '18:00' },
  thursday: { open: '08:00', close: '18:00' },
  friday: { open: '08:00', close: '18:00' },
  saturday: { open: '08:00', close: '13:00' },
  sunday: null,
};

interface ServiceDraft { name: string; duration_minutes: number; price: number | null }

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneLink, setDoneLink] = useState<string | null>(null);

  const [clinicData, setClinicData] = useState({ name: '', phone: '', address: '', city: '' });
  const [specialty, setSpecialty] = useState<ClinicSpecialty>('dental');
  const [services, setServices] = useState<ServiceDraft[]>(
    SERVICE_TEMPLATES.dental.map((s) => ({ ...s, price: null })),
  );
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_HOURS);

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
        body: JSON.stringify({ ...clinicData, specialty, business_hours: hours, services }),
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
        <Card>
          <h1 className="text-xl font-semibold">¡Su clinica quedo configurada!</h1>
          <p className="mt-2 text-sm text-gray-600">
            Comparta este enlace con sus pacientes para que le escriban por WhatsApp:
          </p>
          <a href={doneLink} className="mt-3 block break-all font-mono text-sm text-blue-600" target="_blank" rel="noreferrer">
            {doneLink}
          </a>
          <Button className="mt-6" onClick={() => router.push('/dashboard')}>Ir al panel</Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Configure su clinica</h1>
      <p className="text-sm text-gray-500">Paso {step} de 3</p>

      {step === 1 && (
        <Card className="mt-4 space-y-3">
          {(['name', 'phone', 'address', 'city'] as const).map((field) => (
            <label key={field} className="block">
              <span className="text-sm font-medium">
                {{ name: 'Nombre de la clinica', phone: 'Telefono', address: 'Direccion', city: 'Ciudad' }[field]}
              </span>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={clinicData[field]}
                onChange={(e) => setClinicData({ ...clinicData, [field]: e.target.value })}
              />
            </label>
          ))}
          <Button onClick={() => setStep(2)} disabled={!clinicData.name || !clinicData.phone}>
            Continuar
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Especialidad</span>
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={specialty}
              onChange={(e) => pickSpecialty(e.target.value as ClinicSpecialty)}
            >
              <option value="dental">Odontologia</option>
              <option value="veterinary">Veterinaria</option>
              <option value="aesthetic">Estetica</option>
              <option value="psychology">Psicologia</option>
              <option value="dermatology">Dermatologia</option>
              <option value="physiotherapy">Fisioterapia</option>
              <option value="other">Otra</option>
            </select>
          </label>
          <span className="text-sm font-medium">Servicios</span>
          {services.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="flex-1 rounded border px-3 py-2"
                value={s.name}
                onChange={(e) => setServices(services.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              />
              <input
                type="number"
                className="w-24 rounded border px-3 py-2"
                title="Duracion (min)"
                value={s.duration_minutes}
                onChange={(e) => setServices(services.map((x, j) => (j === i ? { ...x, duration_minutes: Number(e.target.value) } : x)))}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm text-blue-600"
            onClick={() => setServices([...services, { name: '', duration_minutes: 30, price: null }])}
          >
            + Agregar servicio
          </button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>Atras</Button>
            <Button onClick={() => setStep(3)} disabled={services.some((s) => !s.name)}>Continuar</Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="mt-4 space-y-3">
          <span className="text-sm font-medium">Horario de atencion</span>
          {(Object.keys(hours) as (keyof BusinessHours)[]).map((day) => {
            const labels: Record<keyof BusinessHours, string> = {
              monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miercoles',
              thursday: 'Jueves', friday: 'Viernes', saturday: 'Sabado', sunday: 'Domingo',
            };
            const dh = hours[day];
            return (
              <div key={day} className="flex items-center gap-2 text-sm">
                <span className="w-24">{labels[day]}</span>
                <input
                  type="checkbox"
                  checked={dh !== null}
                  onChange={(e) =>
                    setHours({ ...hours, [day]: e.target.checked ? { open: '08:00', close: '18:00' } : null })
                  }
                />
                {dh && (
                  <>
                    <input type="time" value={dh.open} className="rounded border px-2 py-1"
                      onChange={(e) => setHours({ ...hours, [day]: { ...dh, open: e.target.value } })} />
                    <span>a</span>
                    <input type="time" value={dh.close} className="rounded border px-2 py-1"
                      onChange={(e) => setHours({ ...hours, [day]: { ...dh, close: e.target.value } })} />
                  </>
                )}
              </div>
            );
          })}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(2)}>Atras</Button>
            <Button onClick={submit} disabled={saving}>{saving ? 'Guardando...' : 'Finalizar'}</Button>
          </div>
        </Card>
      )}
    </main>
  );
}
