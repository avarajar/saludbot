"use client";

import Button from "@/components/ui/Button";
import { useCallback, useEffect, useState } from "react";
import type { ClinicService } from "@/types";
import { useClinic } from "@/lib/auth/clinic-context";

interface ServiceFormData {
  name: string;
  duration_minutes: number;
  price: string;
  description: string;
  active: boolean;
}

const emptyForm: ServiceFormData = {
  name: "",
  duration_minutes: 30,
  price: "",
  description: "",
  active: true,
};

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "-";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ServicesPage() {
  const { clinic } = useClinic();
  const [services, setServices] = useState<ClinicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ClinicService | null>(
    null
  );
  const [form, setForm] = useState<ServiceFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/services?clinic_id=${clinic.id}`);
      if (!res.ok) throw new Error("Error al cargar los servicios");

      const data = await res.json();
      setServices(data.services ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar los servicios"
      );
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openCreateForm = () => {
    setEditingService(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (service: ClinicService) => {
    setEditingService(service);
    setForm({
      name: service.name,
      duration_minutes: service.duration_minutes,
      price: service.price !== null ? String(service.price) : "",
      description: service.description ?? "",
      active: service.active,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingService(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...(editingService ? { id: editingService.id } : { clinic_id: clinic!.id }),
        name: form.name,
        duration_minutes: form.duration_minutes,
        price: form.price ? parseFloat(form.price) : null,
        description: form.description || null,
        active: form.active,
      };

      const res = await fetch("/api/services", {
        method: editingService ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar el servicio");
      }

      closeForm();
      await fetchServices();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Error al guardar el servicio"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este servicio?")) return;

    setDeletingId(serviceId);
    try {
      const res = await fetch(`/api/services?id=${serviceId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar el servicio");

      await fetchServices();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Error al eliminar el servicio"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (service: ClinicService) => {
    try {
      const res = await fetch("/api/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: service.id, active: !service.active }),
      });

      if (!res.ok) throw new Error("Error al actualizar el servicio");

      await fetchServices();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Error al actualizar el servicio"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Servicios</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los servicios que ofrece tu clínica
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nuevo Servicio
        </Button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingService ? "Editar Servicio" : "Nuevo Servicio"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del servicio
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ej: Limpieza Dental"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duration_minutes: parseInt(e.target.value) || 30,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio (COP)
                </label>
                <input
                  type="number"
                  min={0}
                  step="1000"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Opcional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) =>
                  setForm({ ...form, active: e.target.checked })
                }
                className="h-4 w-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label
                htmlFor="active"
                className="text-sm font-medium text-gray-700"
              >
                Servicio activo
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={saving}>
                {editingService ? "Guardar Cambios" : "Crear Servicio"}
              </Button>
              <Button type="button" variant="secondary" onClick={closeForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchServices}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="mt-2 text-sm text-gray-500">
              Cargando servicios...
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Nombre
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Duración
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Precio
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Descripción
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Estado
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {service.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {service.duration_minutes} min
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatPrice(service.price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {service.description ?? "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(service)}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset cursor-pointer transition-colors ${
                            service.active
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 hover:bg-emerald-100"
                              : "bg-gray-50 text-gray-500 ring-gray-600/20 hover:bg-gray-100"
                          }`}
                        >
                          {service.active ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditForm(service)}
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                            title="Editar"
                          >
                            Editar
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDelete(service.id)}
                            disabled={deletingId === service.id}
                            className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                            title="Eliminar"
                          >
                            {deletingId === service.id
                              ? "Eliminando..."
                              : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {services.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-gray-500">
                  No hay servicios registrados aún.
                </p>
                <button
                  onClick={openCreateForm}
                  className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Crear el primer servicio
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
