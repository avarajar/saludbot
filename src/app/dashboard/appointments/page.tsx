"use client";

import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import { useCallback, useEffect, useState } from "react";
import type { Appointment, AppointmentStatus } from "@/types";
import { useClinic } from "@/lib/auth/clinic-context";

interface AppointmentWithPatient extends Appointment {
  patients: { name: string; phone: string } | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function AppointmentsPage() {
  const { clinic } = useClinic();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>(
    []
  );
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    setError(null);

    try {
      let url = `/api/appointments?clinic_id=${clinic.id}`;
      if (dateFilter) {
        url += `&date=${dateFilter}`;
      }
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Error al cargar las citas");
      }

      const data = await res.json();
      setAppointments(data.appointments ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar las citas"
      );
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, dateFilter, statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancel = async (appointmentId: string) => {
    if (!confirm("¿Está seguro de que desea cancelar esta cita?")) return;

    setCancellingId(appointmentId);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appointmentId, status: "cancelled" }),
      });

      if (!res.ok) {
        throw new Error("Error al cancelar la cita");
      }

      // Refresh list
      await fetchAppointments();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Error al cancelar la cita"
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirm = async (appointmentId: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appointmentId, status: "confirmed" }),
      });

      if (!res.ok) {
        throw new Error("Error al confirmar la cita");
      }

      await fetchAppointments();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Error al confirmar la cita"
      );
    }
  };

  const handleComplete = async (appointmentId: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appointmentId, status: "completed" }),
      });

      if (!res.ok) {
        throw new Error("Error al completar la cita");
      }

      await fetchAppointments();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Error al completar la cita"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Citas</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona todas las citas de tu clínica
          </p>
        </div>
        <Button>
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
          Nueva Cita
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <label className="text-sm font-medium text-gray-700">
            Filtrar por fecha:
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <label className="text-sm font-medium text-gray-700">Estado:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Todos</option>
            <option value="scheduled">Agendada</option>
            <option value="confirmed">Confirmada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
            <option value="no_show">No asistió</option>
          </select>
          {(dateFilter || statusFilter) && (
            <button
              onClick={() => {
                setDateFilter("");
                setStatusFilter("");
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchAppointments}
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
            <p className="mt-2 text-sm text-gray-500">Cargando citas...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Paciente
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Servicio
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Fecha
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Hora
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
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {apt.patients?.name ?? "Paciente desconocido"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {apt.service}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(apt.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {apt.start_time?.substring(0, 5)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          status={apt.status as AppointmentStatus}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {apt.status === "scheduled" && (
                            <>
                              <button
                                onClick={() => handleConfirm(apt.id)}
                                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                                title="Confirmar"
                              >
                                Confirmar
                              </button>
                              <span className="text-gray-300">|</span>
                            </>
                          )}
                          {(apt.status === "confirmed" ||
                            apt.status === "scheduled") && (
                            <>
                              <button
                                onClick={() => handleComplete(apt.id)}
                                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                                title="Completar"
                              >
                                Completar
                              </button>
                              <span className="text-gray-300">|</span>
                            </>
                          )}
                          {apt.status !== "cancelled" &&
                            apt.status !== "completed" && (
                              <button
                                onClick={() => handleCancel(apt.id)}
                                disabled={cancellingId === apt.id}
                                className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                                title="Cancelar"
                              >
                                {cancellingId === apt.id
                                  ? "Cancelando..."
                                  : "Cancelar"}
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {appointments.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-gray-500">
                  No se encontraron citas
                  {dateFilter ? " para esta fecha" : ""}
                  {statusFilter ? " con este estado" : ""}.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
