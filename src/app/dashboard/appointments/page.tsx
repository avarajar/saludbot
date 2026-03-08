"use client";

import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import { useState } from "react";

type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

interface Appointment {
  id: number;
  patient: string;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
}

const mockAppointments: Appointment[] = [
  {
    id: 1,
    patient: "María García López",
    service: "Limpieza Dental",
    date: "2026-03-08",
    time: "09:00",
    status: "confirmed",
  },
  {
    id: 2,
    patient: "Carlos Rodríguez",
    service: "Consulta General",
    date: "2026-03-08",
    time: "10:30",
    status: "scheduled",
  },
  {
    id: 3,
    patient: "Ana Martínez Vega",
    service: "Ortodoncia - Control",
    date: "2026-03-08",
    time: "11:00",
    status: "confirmed",
  },
  {
    id: 4,
    patient: "Luis Hernández",
    service: "Blanqueamiento",
    date: "2026-03-09",
    time: "14:00",
    status: "scheduled",
  },
  {
    id: 5,
    patient: "Sandra Pérez",
    service: "Consulta General",
    date: "2026-03-07",
    time: "15:30",
    status: "completed",
  },
  {
    id: 6,
    patient: "Jorge Ramírez",
    service: "Extracción",
    date: "2026-03-06",
    time: "08:00",
    status: "no_show",
  },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function AppointmentsPage() {
  const [dateFilter, setDateFilter] = useState("");

  const filteredAppointments = dateFilter
    ? mockAppointments.filter((a) => a.date === dateFilter)
    : mockAppointments;

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

      {/* Filter */}
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
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
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
              {filteredAppointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {apt.patient}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {apt.service}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(apt.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {apt.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={apt.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        title="Ver detalle"
                      >
                        Ver
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                        title="Editar"
                      >
                        Editar
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                        title="Cancelar"
                      >
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAppointments.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">
              No se encontraron citas para esta fecha.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
