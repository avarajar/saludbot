import type { BusinessHours, ClinicSpecialty } from '@/types';

export const SPECIALTIES: readonly { value: ClinicSpecialty; label: string; emoji: string }[] = [
  { value: 'dental', label: 'Odontología', emoji: '🦷' },
  { value: 'veterinary', label: 'Veterinaria', emoji: '🐾' },
  { value: 'aesthetic', label: 'Estética', emoji: '💆' },
  { value: 'psychology', label: 'Psicología', emoji: '🧠' },
  { value: 'dermatology', label: 'Dermatología', emoji: '🩺' },
  { value: 'physiotherapy', label: 'Fisioterapia', emoji: '🏃' },
  { value: 'other', label: 'Otra', emoji: '🏥' },
];

export const SERVICE_TEMPLATES: Record<ClinicSpecialty, { name: string; duration_minutes: number }[]> = {
  dental: [
    { name: 'Consulta general', duration_minutes: 30 },
    { name: 'Limpieza dental', duration_minutes: 60 },
    { name: 'Ortodoncia (control)', duration_minutes: 30 },
  ],
  veterinary: [
    { name: 'Consulta general', duration_minutes: 30 },
    { name: 'Vacunacion', duration_minutes: 20 },
    { name: 'Peluqueria', duration_minutes: 60 },
  ],
  aesthetic: [
    { name: 'Valoracion', duration_minutes: 30 },
    { name: 'Limpieza facial', duration_minutes: 60 },
  ],
  psychology: [{ name: 'Sesion de terapia', duration_minutes: 50 }],
  dermatology: [{ name: 'Consulta dermatologica', duration_minutes: 30 }],
  physiotherapy: [{ name: 'Sesion de fisioterapia', duration_minutes: 45 }],
  other: [{ name: 'Consulta', duration_minutes: 30 }],
};

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { open: '08:00', close: '18:00' },
  tuesday: { open: '08:00', close: '18:00' },
  wednesday: { open: '08:00', close: '18:00' },
  thursday: { open: '08:00', close: '18:00' },
  friday: { open: '08:00', close: '18:00' },
  saturday: { open: '08:00', close: '13:00' },
  sunday: null,
};
