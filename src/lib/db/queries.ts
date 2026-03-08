import { supabaseAdmin as getAdmin } from './supabase';
import type {
  Appointment,
  AppointmentStatus,
  Clinic,
  ClinicService,
  Conversation,
  Patient,
  ReminderType,
} from '@/types';

// ---------------------------------------------------------------------------
// Clinics
// ---------------------------------------------------------------------------

export async function getClinicByPhone(phone: string): Promise<Clinic | null> {
  const { data, error } = await getAdmin()
    .from('clinics')
    .select('*')
    .eq('whatsapp_number', phone)
    .maybeSingle();

  if (error) {
    throw new Error(`getClinicByPhone failed: ${error.message}`);
  }

  return data;
}

/**
 * Alias for getClinicByPhone — looks up a clinic by its WhatsApp number.
 */
export const getClinicByWhatsappNumber = getClinicByPhone;

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export async function getPatientByPhone(
  clinicId: string,
  phone: string,
): Promise<Patient | null> {
  const { data, error } = await getAdmin()
    .from('patients')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('phone', phone)
    .maybeSingle();

  if (error) {
    throw new Error(`getPatientByPhone failed: ${error.message}`);
  }

  return data;
}

export async function createPatient(
  data: Partial<Patient>,
): Promise<Patient> {
  const { data: patient, error } = await getAdmin()
    .from('patients')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    throw new Error(`createPatient failed: ${error.message}`);
  }

  return patient;
}

export async function updatePatient(
  id: string,
  data: Partial<Patient>,
): Promise<Patient> {
  const { data: patient, error } = await getAdmin()
    .from('patients')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`updatePatient failed: ${error.message}`);
  }

  return patient;
}

/**
 * Returns patients who have not had a visit in the last `monthsInactive` months.
 */
export async function getInactivePatients(
  clinicId: string,
  monthsInactive: number,
): Promise<Patient[]> {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsInactive);
  const cutoff = cutoffDate.toISOString();

  const { data, error } = await getAdmin()
    .from('patients')
    .select('*')
    .eq('clinic_id', clinicId)
    .or(`last_visit_at.is.null,last_visit_at.lt.${cutoff}`);

  if (error) {
    throw new Error(`getInactivePatients failed: ${error.message}`);
  }

  return data ?? [];
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export async function getAppointmentsByDate(
  clinicId: string,
  date: string,
): Promise<Appointment[]> {
  const { data, error } = await getAdmin()
    .from('appointments')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('date', date)
    .order('start_time', { ascending: true });

  if (error) {
    throw new Error(`getAppointmentsByDate failed: ${error.message}`);
  }

  return data ?? [];
}

export async function getUpcomingAppointments(
  clinicId: string,
): Promise<Appointment[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await getAdmin()
    .from('appointments')
    .select('*')
    .eq('clinic_id', clinicId)
    .gte('date', today)
    .in('status', ['scheduled', 'confirmed'])
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    throw new Error(`getUpcomingAppointments failed: ${error.message}`);
  }

  return data ?? [];
}

export async function createAppointment(
  data: Partial<Appointment>,
): Promise<Appointment> {
  const { data: appointment, error } = await getAdmin()
    .from('appointments')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    throw new Error(`createAppointment failed: ${error.message}`);
  }

  return appointment;
}

export async function updateAppointment(
  id: string,
  data: Partial<Appointment>,
): Promise<Appointment> {
  const { data: appointment, error } = await getAdmin()
    .from('appointments')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`updateAppointment failed: ${error.message}`);
  }

  return appointment;
}

/**
 * Returns the next upcoming appointment for a specific patient at a clinic.
 */
export async function getUpcomingAppointment(
  clinicId: string,
  patientId: string,
): Promise<Appointment | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await getAdmin()
    .from('appointments')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('patient_id', patientId)
    .gte('date', today)
    .in('status', ['scheduled', 'confirmed'])
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`getUpcomingAppointment failed: ${error.message}`);
  }

  return data;
}

/**
 * Updates only the status field of an appointment.
 */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  return updateAppointment(id, { status } as Partial<Appointment>);
}

/**
 * Returns available time slots for a clinic on a given date (or upcoming dates).
 * Compares against existing appointments to find open windows.
 */
export async function getAvailableSlots(
  clinicId: string,
  date?: string,
): Promise<{ date: string; time: string }[]> {
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Fetch booked appointments for the target date
  const { data: booked, error } = await getAdmin()
    .from('appointments')
    .select('start_time, end_time')
    .eq('clinic_id', clinicId)
    .eq('date', targetDate)
    .in('status', ['scheduled', 'confirmed']);

  if (error) {
    throw new Error(`getAvailableSlots failed: ${error.message}`);
  }

  // Generate 30-minute slots from 08:00 to 17:30
  const slots: { date: string; time: string }[] = [];
  const bookedTimes = new Set(
    (booked ?? []).map((a) => a.start_time?.substring(0, 5)),
  );

  for (let hour = 8; hour < 18; hour++) {
    for (const minutes of ['00', '30']) {
      const time = `${hour.toString().padStart(2, '0')}:${minutes}`;
      if (!bookedTimes.has(time)) {
        slots.push({ date: targetDate, time });
      }
    }
  }

  return slots;
}

/**
 * Returns appointments that need a reminder of the given type and have not
 * already had that reminder sent.
 *
 * - 48h: appointments whose start is between 47 and 49 hours from now
 * - 24h: appointments whose start is between 23 and 25 hours from now
 * - 2h:  appointments whose start is between 1.5 and 2.5 hours from now
 */
export async function getAppointmentsNeedingReminder(
  type: ReminderType,
): Promise<Appointment[]> {
  const windowMap: Record<ReminderType, { hoursMin: number; hoursMax: number; column: string }> = {
    '48h': { hoursMin: 47, hoursMax: 49, column: 'reminder_48h_sent' },
    '24h': { hoursMin: 23, hoursMax: 25, column: 'reminder_24h_sent' },
    '2h':  { hoursMin: 1.5, hoursMax: 2.5, column: 'reminder_2h_sent' },
  };

  const { hoursMin, hoursMax, column } = windowMap[type];

  const now = new Date();
  const minTime = new Date(now.getTime() + hoursMin * 60 * 60 * 1000);
  const maxTime = new Date(now.getTime() + hoursMax * 60 * 60 * 1000);

  const minDate = minTime.toISOString().split('T')[0];
  const maxDate = maxTime.toISOString().split('T')[0];
  const minTimeStr = minTime.toISOString().split('T')[1].substring(0, 5);
  const maxTimeStr = maxTime.toISOString().split('T')[1].substring(0, 5);

  // Query appointments within the date range that haven't had this reminder sent
  const { data, error } = await getAdmin()
    .from('appointments')
    .select('*')
    .in('status', ['scheduled', 'confirmed'])
    .eq(column, false)
    .gte('date', minDate)
    .lte('date', maxDate);

  if (error) {
    throw new Error(`getAppointmentsNeedingReminder(${type}) failed: ${error.message}`);
  }

  // Fine-grained filtering: combine date + start_time and compare with the window
  const filtered = (data ?? []).filter((appt) => {
    const apptDateTime = new Date(`${appt.date}T${appt.start_time}`);
    return apptDateTime >= minTime && apptDateTime <= maxTime;
  });

  return filtered;
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export async function logConversation(
  data: Partial<Conversation>,
): Promise<Conversation> {
  const { data: conversation, error } = await getAdmin()
    .from('conversations')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    throw new Error(`logConversation failed: ${error.message}`);
  }

  return conversation;
}

// ---------------------------------------------------------------------------
// Clinic Services
// ---------------------------------------------------------------------------

export async function getClinicServices(
  clinicId: string,
): Promise<ClinicService[]> {
  const { data, error } = await getAdmin()
    .from('clinic_services')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`getClinicServices failed: ${error.message}`);
  }

  return data ?? [];
}
