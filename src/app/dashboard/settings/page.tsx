"use client";

import Button from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { useClinic } from "@/lib/auth/clinic-context";

const COUNTRIES = [
  { code: "CO", name: "Colombia", flag: "🇨🇴", phone: "+57", currency: "COP", locale: "es-CO", timezone: "America/Bogota" },
  { code: "MX", name: "México", flag: "🇲🇽", phone: "+52", currency: "MXN", locale: "es-MX", timezone: "America/Mexico_City" },
  { code: "PE", name: "Perú", flag: "🇵🇪", phone: "+51", currency: "PEN", locale: "es-PE", timezone: "America/Lima" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", phone: "+593", currency: "USD", locale: "es-EC", timezone: "America/Guayaquil" },
  { code: "CL", name: "Chile", flag: "🇨🇱", phone: "+56", currency: "CLP", locale: "es-CL", timezone: "America/Santiago" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", phone: "+54", currency: "ARS", locale: "es-AR", timezone: "America/Buenos_Aires" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", phone: "+58", currency: "VES", locale: "es-VE", timezone: "America/Caracas" },
  { code: "PA", name: "Panamá", flag: "🇵🇦", phone: "+507", currency: "USD", locale: "es-PA", timezone: "America/Panama" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", phone: "+506", currency: "CRC", locale: "es-CR", timezone: "America/Costa_Rica" },
  { code: "DO", name: "Rep. Dominicana", flag: "🇩🇴", phone: "+1", currency: "DOP", locale: "es-DO", timezone: "America/Santo_Domingo" },
] as const;

const SPECIALTIES = [
  { value: "dental", label: "🦷 Dental", emoji: "🦷" },
  { value: "veterinary", label: "🐾 Veterinaria", emoji: "🐾" },
  { value: "aesthetic", label: "💆 Estética", emoji: "💆" },
  { value: "psychology", label: "🧠 Psicología", emoji: "🧠" },
  { value: "dermatology", label: "🩺 Dermatología", emoji: "🩺" },
  { value: "physiotherapy", label: "🏃 Fisioterapia", emoji: "🏃" },
  { value: "other", label: "🏥 Otra", emoji: "🏥" },
] as const;

interface ClinicFormData {
  name: string;
  phone: string;
  address: string;
  city: string;
  whatsapp_number: string;
  timezone: string;
  owner_name: string;
  owner_email: string;
}

interface CreateClinicFormData extends ClinicFormData {
  slug: string;
  specialty: string;
  package_type: string;
  country: string;
  currency: string;
  locale: string;
}

const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow";

function getCountry(code: string) {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

export default function SettingsPage() {
  const { clinic, loading, refetch, userEmail } = useClinic();
  const [form, setForm] = useState<ClinicFormData>({
    name: "", phone: "", address: "", city: "",
    whatsapp_number: "", timezone: "America/Bogota",
    owner_name: "", owner_email: "",
  });
  const [createForm, setCreateForm] = useState<CreateClinicFormData>({
    name: "", phone: "", address: "", city: "",
    whatsapp_number: "", timezone: "America/Bogota",
    owner_name: "", owner_email: "",
    slug: "", specialty: "dental", package_type: "basico",
    country: "CO", currency: "COP", locale: "es-CO",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [waLocal, setWaLocal] = useState("");

  useEffect(() => {
    if (clinic) {
      setForm({
        name: clinic.name, phone: clinic.phone,
        address: clinic.address, city: clinic.city,
        whatsapp_number: clinic.whatsapp_number,
        timezone: clinic.timezone,
        owner_name: clinic.owner_name, owner_email: clinic.owner_email,
      });
    }
  }, [clinic]);

  // Auto-fill owner_email from authenticated user
  useEffect(() => {
    if (userEmail) {
      setCreateForm((prev) => ({ ...prev, owner_email: userEmail }));
    }
  }, [userEmail]);

  // Auto-generate slug from name
  useEffect(() => {
    const slug = createForm.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setCreateForm((prev) => ({ ...prev, slug }));
  }, [createForm.name]);

  // When country changes, auto-fill timezone, currency, locale and re-format phones
  function handleCountryChange(countryCode: string) {
    const c = getCountry(countryCode);
    setCreateForm((prev) => ({
      ...prev,
      country: c.code,
      currency: c.currency,
      locale: c.locale,
      timezone: c.timezone,
      phone: phoneLocal ? `${c.phone} ${phoneLocal}` : "",
      whatsapp_number: waLocal ? `whatsapp:${c.phone}${waLocal.replace(/\s/g, "")}` : "",
    }));
  }

  // When local phone changes, rebuild full phone with country prefix
  function handlePhoneLocalChange(value: string) {
    setPhoneLocal(value);
    const c = getCountry(createForm.country);
    setCreateForm((prev) => ({
      ...prev,
      phone: value ? `${c.phone} ${value}` : "",
    }));
  }

  // When local WA number changes, rebuild whatsapp_number
  function handleWaLocalChange(value: string) {
    setWaLocal(value);
    const c = getCountry(createForm.country);
    setCreateForm((prev) => ({
      ...prev,
      whatsapp_number: value ? `whatsapp:${c.phone}${value.replace(/\s/g, "")}` : "",
    }));
  }

  // Copy phone to WhatsApp
  function copyPhoneToWa() {
    setWaLocal(phoneLocal);
    const c = getCountry(createForm.country);
    setCreateForm((prev) => ({
      ...prev,
      whatsapp_number: phoneLocal ? `whatsapp:${c.phone}${phoneLocal.replace(/\s/g, "")}` : "",
    }));
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/clinics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: clinic!.id, ...form }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar los cambios");
      }
      await res.json();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear la clínica");
      }
      // Reload the entire page so all contexts pick up the new clinic
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la clínica");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ClinicFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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

  // ── No clinic → Setup wizard ──
  if (!clinic) {
    const selectedCountry = getCountry(createForm.country);

    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configura tu clínica</h2>
          <p className="mt-1 text-sm text-gray-500">
            Completa la información para empezar a usar SaludBot
          </p>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700">¡Clínica creada exitosamente!</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Step 1: País y especialidad */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">1</span>
              <h3 className="text-lg font-semibold text-gray-900">¿Dónde está tu clínica?</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* País con banderas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <select
                  value={createForm.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className={inputClass}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Especialidad con emojis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                <select
                  value={createForm.specialty}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, specialty: e.target.value }))}
                  className={inputClass}
                >
                  {SPECIALTIES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Auto-filled info preview */}
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                🕐 {selectedCountry.timezone}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                💰 {selectedCountry.currency}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                📞 {selectedCountry.phone}
              </span>
            </div>
          </div>

          {/* Step 2: Info de la clínica */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">2</span>
              <h3 className="text-lg font-semibold text-gray-900">Datos de la clínica</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={`Ej: ${SPECIALTIES.find((s) => s.value === createForm.specialty)?.emoji ?? "🏥"} Clínica Vida`}
                  className={inputClass}
                />
                {createForm.slug && (
                  <p className="mt-1 text-xs text-gray-400">
                    URL: saludbot.co/<span className="font-medium text-gray-500">{createForm.slug}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                <input
                  type="text"
                  required
                  value={createForm.city}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder={createForm.country === "CO" ? "Bogotá" : createForm.country === "MX" ? "CDMX" : "Ciudad"}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                <input
                  type="text"
                  required
                  value={createForm.address}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Cra 7 #45-12, Local 201"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Step 3: Teléfonos */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">3</span>
              <h3 className="text-lg font-semibold text-gray-900">Teléfonos</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Teléfono con prefijo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de la clínica *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-sm text-gray-500 font-medium">
                    {selectedCountry.flag} {selectedCountry.phone}
                  </span>
                  <input
                    type="tel"
                    required
                    value={phoneLocal}
                    onChange={(e) => handlePhoneLocalChange(e.target.value)}
                    placeholder="300 123 4567"
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-r-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                  />
                </div>
                {createForm.phone && (
                  <p className="mt-1 text-xs text-gray-400">
                    Completo: <span className="font-medium text-gray-500">{createForm.phone}</span>
                  </p>
                )}
              </div>

              {/* WhatsApp con prefijo + botón copiar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp *
                  {phoneLocal && waLocal !== phoneLocal && (
                    <button
                      type="button"
                      onClick={copyPhoneToWa}
                      className="ml-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      ← Usar mismo número
                    </button>
                  )}
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-sm text-gray-500 font-medium">
                    {selectedCountry.flag} {selectedCountry.phone}
                  </span>
                  <input
                    type="tel"
                    required
                    value={waLocal}
                    onChange={(e) => handleWaLocalChange(e.target.value)}
                    placeholder="300 123 4567"
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-r-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                  />
                </div>
                {createForm.whatsapp_number && (
                  <p className="mt-1 text-xs text-gray-400">
                    Twilio: <span className="font-medium text-gray-500">{createForm.whatsapp_number}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Step 4: Propietario */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">4</span>
              <h3 className="text-lg font-semibold text-gray-900">Propietario</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={createForm.owner_name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, owner_name: e.target.value }))}
                  placeholder="Dr. Juan Pérez"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  readOnly
                  value={createForm.owner_email}
                  className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                />
                <p className="mt-1 text-xs text-gray-400">Se usa el email de tu cuenta automáticamente</p>
                <p className="mt-1 text-xs text-gray-400">
                  Debe ser el mismo email con el que te registraste
                </p>
              </div>
            </div>

            {/* Plan selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "basico", label: "Básico", desc: "Hasta 200 citas/mes" },
                  { value: "autopilot", label: "Autopilot", desc: "Citas ilimitadas + IA" },
                  { value: "marketing", label: "Marketing", desc: "Campañas + analytics" },
                ].map((plan) => (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => setCreateForm((prev) => ({ ...prev, package_type: plan.value }))}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      createForm.package_type === plan.value
                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${
                      createForm.package_type === plan.value ? "text-emerald-700" : "text-gray-900"
                    }`}>{plan.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{plan.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <Button type="submit" loading={saving}>
              Crear mi clínica
            </Button>
            <p className="text-xs text-gray-400">
              Podrás editar toda esta información después
            </p>
          </div>
        </form>
      </div>
    );
  }

  // ── Clinic exists → Edit form ──
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
        <p className="mt-1 text-sm text-gray-500">Información y ajustes de tu clínica</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm text-emerald-700">Los cambios se guardaron correctamente.</p>
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
            <p className="font-medium text-gray-500">Especialidad</p>
            <p className="mt-1 text-gray-900 capitalize">{clinic.specialty}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Plan</p>
            <p className="mt-1 text-gray-900 capitalize">{clinic.package_type}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">País</p>
            <p className="mt-1 text-gray-900">
              {COUNTRIES.find((c) => c.code === clinic.country)?.flag ?? "🌎"}{" "}
              {COUNTRIES.find((c) => c.code === clinic.country)?.name ?? clinic.country}
            </p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de WhatsApp</label>
              <input type="text" required value={form.whatsapp_number} onChange={(e) => updateField("whatsapp_number", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zona horaria</label>
              <select value={form.timezone} onChange={(e) => updateField("timezone", e.target.value)} className={inputClass}>
                {COUNTRIES.map((c) => (
                  <option key={c.timezone} value={c.timezone}>{c.flag} {c.timezone}</option>
                ))}
              </select>
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
                  city: clinic.city, whatsapp_number: clinic.whatsapp_number,
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
    </div>
  );
}
