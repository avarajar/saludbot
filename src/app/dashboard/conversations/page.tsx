"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation, ConversationIntent, MessageDirection } from "@/types";
import { useClinic } from "@/lib/auth/clinic-context";

interface ConversationWithPatient extends Conversation {
  patients: { name: string; phone: string } | null;
}

const intentLabels: Record<ConversationIntent, string> = {
  schedule: "Agendar",
  reschedule: "Reagendar",
  cancel: "Cancelar",
  confirm: "Confirmar",
  info_services: "Info servicios",
  info_hours: "Info horarios",
  info_location: "Info ubicación",
  greeting: "Saludo",
  escalate: "Escalar",
  other: "Otro",
};

const directionLabels: Record<MessageDirection, string> = {
  inbound: "Entrante",
  outbound: "Saliente",
};

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversationsPage() {
  const { clinic } = useClinic();
  const [conversations, setConversations] = useState<
    ConversationWithPatient[]
  >([]);
  const [dateFilter, setDateFilter] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = useCallback(
    async (search: string) => {
      if (!clinic?.id) return;
      setLoading(true);
      setError(null);

      try {
        let url = `/api/conversations?clinic_id=${clinic.id}&limit=200`;
        if (dateFilter) {
          url += `&date=${dateFilter}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Error al cargar las conversaciones");
        }

        const data = await res.json();
        let convos: ConversationWithPatient[] = data.conversations ?? [];

        // Client-side filter by patient name if search is provided
        if (search.trim()) {
          const term = search.trim().toLowerCase();
          convos = convos.filter(
            (c) =>
              c.patients?.name?.toLowerCase().includes(term) ||
              c.patients?.phone?.includes(term)
          );
        }

        setConversations(convos);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error al cargar las conversaciones"
        );
      } finally {
        setLoading(false);
      }
    },
    [clinic?.id, dateFilter]
  );

  useEffect(() => {
    fetchConversations(patientSearch);
  }, [fetchConversations, patientSearch]);

  const handleSearchChange = (value: string) => {
    setPatientSearch(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchConversations(value);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conversaciones</h2>
          <p className="mt-1 text-sm text-gray-500">
            Historial de mensajes de WhatsApp
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1">
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
              placeholder="Buscar por paciente..."
              value={patientSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Fecha:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {(dateFilter || patientSearch) && (
              <button
                onClick={() => {
                  setDateFilter("");
                  setPatientSearch("");
                }}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => fetchConversations(patientSearch)}
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
              Cargando conversaciones...
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Fecha
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Paciente
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Dirección
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Mensaje
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Intención
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {conversations.map((convo) => (
                    <tr key={convo.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatDateTime(convo.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xs font-semibold flex-shrink-0">
                            {(convo.patients?.name ?? "?")
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {convo.patients?.name ?? "Desconocido"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {convo.patients?.phone ?? ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            convo.direction === "inbound"
                              ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                              : "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          }`}
                        >
                          {directionLabels[convo.direction]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                        <p className="truncate" title={convo.message}>
                          {convo.message}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {convo.intent ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20">
                            {intentLabels[convo.intent]}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {conversations.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-gray-500">
                  {dateFilter || patientSearch
                    ? "No se encontraron conversaciones con esos filtros."
                    : "No hay conversaciones registradas aún."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
