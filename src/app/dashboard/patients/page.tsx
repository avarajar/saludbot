"use client";

import Button from "@/components/ui/Button";
import { useState } from "react";

interface Patient {
  id: number;
  name: string;
  phone: string;
  lastVisit: string;
  totalAppointments: number;
}

const mockPatients: Patient[] = [
  {
    id: 1,
    name: "María García López",
    phone: "+57 300 123 4567",
    lastVisit: "2026-03-06",
    totalAppointments: 8,
  },
  {
    id: 2,
    name: "Carlos Rodríguez Muñoz",
    phone: "+57 310 234 5678",
    lastVisit: "2026-03-05",
    totalAppointments: 3,
  },
  {
    id: 3,
    name: "Ana Martínez Vega",
    phone: "+57 320 345 6789",
    lastVisit: "2026-02-28",
    totalAppointments: 12,
  },
  {
    id: 4,
    name: "Luis Hernández Castro",
    phone: "+57 301 456 7890",
    lastVisit: "2026-02-20",
    totalAppointments: 5,
  },
  {
    id: 5,
    name: "Sandra Pérez Gómez",
    phone: "+57 315 567 8901",
    lastVisit: "2026-03-07",
    totalAppointments: 2,
  },
  {
    id: 6,
    name: "Jorge Ramírez Torres",
    phone: "+57 322 678 9012",
    lastVisit: "2026-01-15",
    totalAppointments: 6,
  },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PatientsPage() {
  const [search, setSearch] = useState("");

  const filteredPatients = mockPatients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pacientes</h2>
          <p className="mt-1 text-sm text-gray-500">
            Directorio de pacientes de tu clínica
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
          Nuevo Paciente
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Nombre
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Teléfono
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Última Visita
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Total Citas
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xs font-semibold flex-shrink-0">
                        {patient.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {patient.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {patient.phone}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(patient.lastVisit)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {patient.totalAppointments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        title="Ver perfil"
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
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        title="Agendar cita"
                      >
                        Agendar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPatients.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">
              No se encontraron pacientes con ese criterio de búsqueda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
