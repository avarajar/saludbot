"use client";

import Button from "@/components/ui/Button";
import BusinessHoursEditor from "@/components/clinic/BusinessHoursEditor";
import { useEffect, useState } from "react";
import { useClinic } from "@/lib/auth/clinic-context";
import { COUNTRIES, getCountry } from "@/lib/clinics/countries";
import { SPECIALTIES, DEFAULT_BUSINESS_HOURS } from "@/lib/clinics/templates";
import type { BusinessHours } from "@/types";

interface ClinicFormData {
  name: string;
  phone: string;
  address: string;
  city: string;
  // string (no ClinicSpecialty): updateField asigna string a claves union;
  // el enum se valida en el servidor (updateClinicSchema).
  specialty: string;
  country: string;
  whatsapp_number: string;
  timezone: string;
  owner_name: string;
  owner_email: string;
}

const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow";

export default function SettingsPage() {
  const { clinic, loading, refetch } = useClinic();
  const [form, setForm] = useState<ClinicFormData>({
    name: "", phone: "", address: "", city: "",
    specialty: "other", country: "CO",
    whatsapp_number: "", timezone: "America/Bogota",
    owner_name: "", owner_email: "",
  });
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);
  const [saving, setSaving] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (clinic) {
      setForm({
        name: clinic.name, phone: clinic.phone,
        address: clinic.address, city: clinic.city,
        specialty: clinic.specialty, country: clinic.country,
        whatsapp_number: clinic.whatsapp_number,
        timezone: clinic.timezone,
        owner_name: clinic.owner_name, owner_email: clinic.owner_email,
      });
      setHours(clinic.business_hours ?? DEFAULT_BUSINESS_HOURS);
    }
  }, [clinic]);

  const updateField = (field: keyof ClinicFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Al cambiar el país se previsualiza el timezone derivado; el servidor
  // re-deriva moneda y locale al guardar.
  const handleCountryChange = (code: string) => {
    const c = getCountry(code);
    setForm((prev) => ({ ...prev, country: c.code, timezone: c.timezone }));
  };

  const patchClinic = async (body: Record<string, unknown>, doneMessage: string) => {
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/clinics", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clinic!.id, ...body }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al guardar los cambios");
    }
    await res.json();
    await refetch();
    setSuccess(doneMessage);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await patchClinic({ ...form }, "Los cambios se guardaron correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHours = async () => {
    setSavingHours(true);
    try {
      await patchClinic({ business_hours: hours }, "El horario se guardó correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el horario");
    } finally {
      setSavingHours(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
          <p className="mt-1 text-sm text-gray-500">Información y ajustes de tu clínica</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-center py-12">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="ml-3 text-sm text-gray-500">Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  // Sin clínica: clinic-context redirige a /onboarding; esto es solo un
  // estado transitorio por si el redirect aún no ocurrió.
  if (!clinic) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm text-gray-600">
          Aún no tienes una clínica configurada.{" "}
          <a href="/onboarding" className="font-medium text-emerald-600 hover:text-emerald-700">
            Completa el registro aquí
          </a>
          .
        </p>
      </div>
    );
  }

  const selectedCountry = getCountry(form.country);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
        <p className="mt-1 text-sm text-gray-500">Información y ajustes de tu clínica</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Clinic info (read-only) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-500">Slug</p>
            <p className="mt-1 text-gray-900">{clinic.slug}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Plan</p>
            <p className="mt-1 text-gray-900 capitalize">{clinic.package_type}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Estado</p>
            <p className="mt-1">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                clinic.active
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                  : "bg-red-50 text-red-700 ring-red-600/20"
              }`}>
                {clinic.active ? "Activa" : "Inactiva"}
              </span>
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Creada</p>
            <p className="mt-1 text-gray-900">
              {new Date(clinic.created_at).toLocaleDateString("es-CO", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Editable form */}
      <form onSubmit={handleUpdate}>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Editar Información</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la clínica</label>
              <input type="text" required value={form.name} onChange={(e) => updateField("name", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="text" required value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input type="text" required value={form.address} onChange={(e) => updateField("address", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input type="text" required value={form.city} onChange={(e) => updateField("city", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
              <select value={form.specialty} onChange={(e) => updateField("specialty", e.target.value)} className={inputClass}>
                {SPECIALTIES.map((s) => (
                  <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <select value={form.country} onChange={(e) => handleCountryChange(e.target.value)} className={inputClass}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">
                Moneda {selectedCountry.currency} · {selectedCountry.locale}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zona horaria</label>
              <select value={form.timezone} onChange={(e) => updateField("timezone", e.target.value)} className={inputClass}>
                {COUNTRIES.map((c) => (
                  <option key={c.timezone} value={c.timezone}>{c.flag} {c.timezone}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de WhatsApp</label>
              <input type="text" required value={form.whatsapp_number} onChange={(e) => updateField("whatsapp_number", e.target.value)} className={inputClass} />
              <p className="mt-1 text-xs text-gray-400">
                Número desde el que el bot envía mensajes. Cámbialo solo si soporte te lo indica.
              </p>
            </div>
          </div>

          <hr className="border-gray-100" />
          <h4 className="text-md font-semibold text-gray-900">Información del Propietario</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del propietario</label>
              <input type="text" required value={form.owner_name} onChange={(e) => updateField("owner_name", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email del propietario</label>
              <input type="email" required value={form.owner_email} onChange={(e) => updateField("owner_email", e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving}>Guardar Cambios</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setForm({
                  name: clinic.name, phone: clinic.phone, address: clinic.address,
                  city: clinic.city, specialty: clinic.specialty, country: clinic.country,
                  whatsapp_number: clinic.whatsapp_number,
                  timezone: clinic.timezone, owner_name: clinic.owner_name,
                  owner_email: clinic.owner_email,
                });
                setError(null);
              }}
            >
              Descartar Cambios
            </Button>
          </div>
        </div>
      </form>

      {/* Business hours */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Horario de Atención</h3>
          <p className="mt-1 text-sm text-gray-500">
            El bot solo ofrece citas dentro de este horario.
          </p>
        </div>
        <BusinessHoursEditor value={hours} onChange={setHours} />
        <div className="flex gap-3 pt-2">
          <Button type="button" loading={savingHours} onClick={handleSaveHours}>Guardar Horario</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setHours(clinic.business_hours ?? DEFAULT_BUSINESS_HOURS)}
          >
            Descartar
          </Button>
        </div>
      </div>
    </div>
  );
}
