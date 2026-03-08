// ── Clinic ──────────────────────────────────────────────────────────────────

export type ClinicSpecialty =
  | 'dental'
  | 'veterinary'
  | 'aesthetic'
  | 'psychology'
  | 'dermatology'
  | 'physiotherapy'
  | 'other';

export type PackageType = 'basico' | 'autopilot' | 'marketing';

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  city: string;
  specialty: ClinicSpecialty;
  google_calendar_id: string;
  timezone: string; // default 'America/Bogota'
  whatsapp_number: string;
  owner_name: string;
  owner_email: string;
  package_type: PackageType;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Patient ─────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  phone: string; // WhatsApp number
  email: string | null;
  document_id: string | null; // cedula
  notes: string | null;
  last_visit_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Appointment ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  google_event_id: string | null;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  service: string;
  status: AppointmentStatus;
  reminder_48h_sent: boolean;
  reminder_24h_sent: boolean;
  reminder_2h_sent: boolean;
  patient_confirmed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Conversation ────────────────────────────────────────────────────────────

export type MessageDirection = 'inbound' | 'outbound';

export type ConversationIntent =
  | 'schedule'
  | 'reschedule'
  | 'cancel'
  | 'confirm'
  | 'info_services'
  | 'info_hours'
  | 'info_location'
  | 'greeting'
  | 'escalate'
  | 'other';

export interface Conversation {
  id: string;
  clinic_id: string;
  patient_id: string;
  whatsapp_message_id: string;
  direction: MessageDirection;
  message: string;
  intent: ConversationIntent | null;
  created_at: string;
}

// ── Clinic Service ──────────────────────────────────────────────────────────

export interface ClinicService {
  id: string;
  clinic_id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  description: string | null;
  active: boolean;
}

// ── Reminder Log ────────────────────────────────────────────────────────────

export type ReminderType = '48h' | '24h' | '2h';

export type ReminderStatus = 'sent' | 'failed';

export interface ReminderLog {
  id: string;
  appointment_id: string;
  type: ReminderType;
  sent_at: string;
  status: ReminderStatus;
}
