"use client";

import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Appointment, AppointmentStatus, Patient } from "@/types";
import { useClinic } from "@/lib/auth/clinic-context";

interface AppointmentWithPatient extends Appointment {
  patients: { name: string; phone: string } | null;
}

interface DashboardStats {
  todayCount: number;
  totalPatients: number;
  confirmationRate: string;
  noShowCount: number;
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function DashboardHome() {
  const { clinic } = useClinic();
  const [todayAppointments, setTodayAppointments] = useState<
    AppointmentWithPatient[]
  >([]);
  const [stats, setStats] = useState<DashboardStats>({
    todayCount: 0,
    totalPatients: 0,
    confirmationRate: "0%",
    noShowCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    setError(null);

    try {
      const today = getTodayDate();

      const [appointmentsRes, patientsRes, allMonthRes] = await Promise.all([
        fetch(`/api/appointments?clinic_id=${clinic.id}&date=${today}`),
        fetch(`/api/patients?clinic_id=${clinic.id}`),
        fetch(`/api/appointments?clinic_id=${clinic.id}`),
      ]);

      if (!appointmentsRes.ok || !patientsRes.ok || !allMonthRes.ok) {
        throw new Error("Error al cargar los datos del panel");
      }

      const [appointmentsData, patientsData, allAppointmentsData] =
        await Promise.all([
          appointmentsRes.json(),
          patientsRes.json(),
          allMonthRes.json(),
        ]);

      const todayAppts: AppointmentWithPatient[] =
        appointmentsData.appointments ?? [];
      setTodayAppointments(todayAppts);

      const patients: Patient[] = patientsData.patients ?? [];
      const allAppts: AppointmentWithPatient[] =
        allAppointmentsData.appointments ?? [];

      // Calculate monthly stats
      const monthStart = getMonthStart();
      const monthAppts = allAppts.filter((a) => a.date >= monthStart);
      const noShowCount = monthAppts.filter(
        (a) => a.status === "no_show"
      ).length;

      // Confirmation rate: confirmed + completed / (total - cancelled)
      const relevantAppts = monthAppts.filter(
        (a) => a.status !== "cancelled" && a.status !== "rescheduled"
      );
      const confirmedAppts = relevantAppts.filter(
        (a) =>
          a.status === "confirmed" ||
          a.status === "completed" ||
          a.patient_confirmed
      );
      const confirmationRate =
        relevantAppts.length > 0
          ? Math.round((confirmedAppts.length / relevantAppts.length) * 100)
          : 0;

      setStats({
        todayCount: todayAppts.length,
        totalPatients: patients.length,
        confirmationRate: `${confirmationRate}%`,
        noShowCount,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar los datos"
      );
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Panel de Control
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Resumen de actividad de tu clínica
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
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
          </Link>
          <Link
            href="/dashboard/patients"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
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
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card
          title="Citas Hoy"
          value={loading ? "..." : stats.todayCount}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
        />
        <Card
          title="Pacientes Total"
          value={loading ? "..." : stats.totalPatients}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
        />
        <Card
          title="Tasa de Confirmación"
          value={loading ? "..." : stats.confirmationRate}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <Card
          title="Inasistencias del Mes"
          value={loading ? "..." : stats.noShowCount}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Recent appointments */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Citas de Hoy
          </h3>
          <Link
            href="/dashboard/appointments"
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Ver todas
          </Link>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="mt-2 text-sm text-gray-500">Cargando citas...</p>
          </div>
        ) : todayAppointments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">
              No hay citas programadas para hoy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Paciente
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Servicio
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Hora
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todayAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {apt.patients?.name ?? "Paciente desconocido"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {apt.service}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {apt.start_time?.substring(0, 5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge
                        status={apt.status as AppointmentStatus}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
