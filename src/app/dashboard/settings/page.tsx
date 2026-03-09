"use client";

import Button from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { useClinic } from "@/lib/auth/clinic-context";

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

const emptyForm: ClinicFormData = {
  name: "",
  phone: "",
  address: "",
  city: "",
  whatsapp_number: "",
  timezone: "America/Bogota",
  owner_name: "",
  owner_email: "",
};

export default function SettingsPage() {
  const { clinic, loading } = useClinic();
  const [form, setForm] = useState<ClinicFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (clinic) {
      setForm({
        name: clinic.name,
        phone: clinic.phone,
        address: clinic.address,
        city: clinic.city,
        whatsapp_number: clinic.whatsapp_number,
        timezone: clinic.timezone,
        owner_name: clinic.owner_name,
        owner_email: clinic.owner_email,
      });
    }
  }, [clinic]);

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar los cambios"
      );
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
          <p className="mt-1 text-sm text-gray-500">
            Información y ajustes de tu clínica
          </p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
        <p className="mt-1 text-sm text-gray-500">
          Información y ajustes de tu clínica
        </p>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm text-emerald-700">
            Los cambios se guardaron correctamente.
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
          {!clinic && (
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* Clinic info (read-only) */}
      {clinic && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Información General
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-500">Slug</p>
              <p className="mt-1 text-gray-900">{clinic.slug}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Especialidad</p>
              <p className="mt-1 text-gray-900 capitalize">
                {clinic.specialty}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Plan</p>
              <p className="mt-1 text-gray-900 capitalize">
                {clinic.package_type}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Estado</p>
              <p className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    clinic.active
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                      : "bg-red-50 text-red-700 ring-red-600/20"
                  }`}
                >
                  {clinic.active ? "Activa" : "Inactiva"}
                </span>
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Creada</p>
              <p className="mt-1 text-gray-900">
                {new Date(clinic.created_at).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Editable form */}
      {clinic && (
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Editar Información
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la clínica
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de WhatsApp
                </label>
                <input
                  type="text"
                  required
                  value={form.whatsapp_number}
                  onChange={(e) =>
                    updateField("whatsapp_number", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zona horaria
                </label>
                <select
                  value={form.timezone}
                  onChange={(e) => updateField("timezone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="America/Bogota">
                    America/Bogota (Colombia)
                  </option>
                  <option value="America/Mexico_City">
                    America/Mexico_City (México)
                  </option>
                  <option value="America/Lima">America/Lima (Perú)</option>
                  <option value="America/Santiago">
                    America/Santiago (Chile)
                  </option>
                  <option value="America/Buenos_Aires">
                    America/Buenos_Aires (Argentina)
                  </option>
                </select>
              </div>
            </div>

            <hr className="border-gray-100" />

            <h4 className="text-md font-semibold text-gray-900">
              Información del Propietario
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del propietario
                </label>
                <input
                  type="text"
                  required
                  value={form.owner_name}
                  onChange={(e) => updateField("owner_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email del propietario
                </label>
                <input
                  type="email"
                  required
                  value={form.owner_email}
                  onChange={(e) => updateField("owner_email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={saving}>
                Guardar Cambios
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (clinic) {
                    setForm({
                      name: clinic.name,
                      phone: clinic.phone,
                      address: clinic.address,
                      city: clinic.city,
                      whatsapp_number: clinic.whatsapp_number,
                      timezone: clinic.timezone,
                      owner_name: clinic.owner_name,
                      owner_email: clinic.owner_email,
                    });
                  }
                  setError(null);
                }}
              >
                Descartar Cambios
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
