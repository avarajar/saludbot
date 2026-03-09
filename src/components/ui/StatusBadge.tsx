import type { AppointmentStatus } from "@/types";

interface StatusBadgeProps {
  status: AppointmentStatus;
}

const statusConfig: Record<
  AppointmentStatus,
  { label: string; classes: string }
> = {
  scheduled: {
    label: "Agendada",
    classes: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  confirmed: {
    label: "Confirmada",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  completed: {
    label: "Completada",
    classes: "bg-gray-50 text-gray-700 ring-gray-600/20",
  },
  cancelled: {
    label: "Cancelada",
    classes: "bg-red-50 text-red-700 ring-red-600/20",
  },
  no_show: {
    label: "No asistió",
    classes: "bg-orange-50 text-orange-700 ring-orange-600/20",
  },
  rescheduled: {
    label: "Reagendada",
    classes: "bg-purple-50 text-purple-700 ring-purple-600/20",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
