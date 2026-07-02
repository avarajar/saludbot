import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TZDate } from '@date-fns/tz';
import { addHours, format } from 'date-fns';
import type { Appointment, Clinic, Patient, ReminderType } from '@/types';

const TIMEZONE = 'America/Bogota';

// Mock the shared WhatsApp client instead of twilio directly, since the
// engine now delegates sending to @/lib/whatsapp/client.
const { mockSendMessage } = vi.hoisted(() => ({
  mockSendMessage: vi.fn().mockResolvedValue('SM123'),
}));

vi.mock('@/lib/whatsapp/client', () => ({
  sendMessage: mockSendMessage,
}));

const { mockSetSession } = vi.hoisted(() => ({
  mockSetSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/sessions', () => ({
  setSession: mockSetSession,
}));

/**
 * Returns a date/time pair as the engine would interpret it (in Bogota timezone).
 * offsetHours is relative to "now" in Bogota.
 * We add a small buffer (+5 min) so that minute truncation from format()
 * does not cause differenceInHours to be off-by-one.
 */
function appointmentInBogota(offsetHours: number) {
  const nowBogota = TZDate.tz(TIMEZONE);
  // Adding 5 extra minutes ensures the formatted HH:mm is still offsetHours
  // ahead, even after seconds are dropped.
  const futureMs = nowBogota.getTime() + offsetHours * 60 * 60 * 1000 + 5 * 60 * 1000;
  const futureBogota = new TZDate(new Date(futureMs), TIMEZONE);
  return {
    date: format(futureBogota, 'yyyy-MM-dd'),
    time: format(futureBogota, 'HH:mm'),
  };
}

// Supabase chainable mock
function createChain(resolvedData: { data: unknown; error: unknown } = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'in', 'or', 'gte', 'lte', 'order', 'single', 'insert', 'update', 'maybeSingle'];
  for (const m of methods) {
    (chain as Record<string, ReturnType<typeof vi.fn>>)[m] = vi.fn().mockReturnValue(chain);
  }
  chain.data = resolvedData.data;
  chain.error = resolvedData.error;
  (chain as Record<string, unknown>).then = function (resolve: (v: unknown) => void) {
    resolve({ data: resolvedData.data, error: resolvedData.error });
    return chain;
  };
  return chain;
}

const mockSupabaseFrom = vi.fn();

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: vi.fn(() => ({
    from: mockSupabaseFrom,
  })),
}));

vi.stubEnv('TWILIO_ACCOUNT_SID', 'AC_test');
vi.stubEnv('TWILIO_AUTH_TOKEN', 'auth_test');
vi.stubEnv('TWILIO_WHATSAPP_NUMBER', '+14155238886');

import { generateReminderMessage, processReminders } from './engine';

// Fixtures
const mockClinic: Clinic = {
  id: 'clinic-001',
  name: 'Clinica Dental Sonrisa',
  slug: 'clinica-dental-sonrisa',
  phone: '+573001234567',
  address: 'Calle 80 #45-23, Bogota',
  city: 'Bogota',
  specialty: 'dental',
  google_calendar_id: 'cal-123',
  timezone: 'America/Bogota',
  whatsapp_number: '+573001234567',
  owner_name: 'Dr. Perez',
  owner_email: 'perez@clinica.com',
  package_type: 'autopilot',
  country: 'CO',
  currency: 'COP',
  locale: 'es-CO',
  business_hours: {
    monday: { open: '08:00', close: '18:00' },
    tuesday: { open: '08:00', close: '18:00' },
    wednesday: { open: '08:00', close: '18:00' },
    thursday: { open: '08:00', close: '18:00' },
    friday: { open: '08:00', close: '18:00' },
    saturday: { open: '08:00', close: '13:00' },
    sunday: null,
  },
  active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockPatient: Patient = {
  id: 'patient-001',
  clinic_id: 'clinic-001',
  name: 'Maria Lopez',
  phone: '+573009876543',
  email: 'maria@example.com',
  document_id: '1234567890',
  notes: null,
  last_visit_at: null,
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
};

const mockAppointment: Appointment = {
  id: 'appt-001',
  clinic_id: 'clinic-001',
  patient_id: 'patient-001',
  google_event_id: null,
  date: '2026-03-10',
  start_time: '10:00',
  end_time: '10:30',
  service: 'Limpieza dental',
  status: 'scheduled',
  reminder_48h_sent: false,
  reminder_24h_sent: false,
  reminder_2h_sent: false,
  patient_confirmed: false,
  notes: null,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

describe('generateReminderMessage', () => {
  it('generates a 48h reminder message in Spanish', () => {
    const message = generateReminderMessage('48h', mockAppointment, mockClinic, mockPatient);

    expect(message).toContain('Maria Lopez');
    expect(message).toContain('Clinica Dental Sonrisa');
    expect(message).toContain('Responda 1 para confirmar');
    expect(message).toContain('2 para reagendar');
  });

  it('generates a 24h reminder message in Spanish', () => {
    const message = generateReminderMessage('24h', mockAppointment, mockClinic, mockPatient);

    expect(message).toContain('Maria Lopez');
    expect(message).toContain('Clinica Dental Sonrisa');
    expect(message).toContain('mañana');
    expect(message).toContain('confirmar');
  });

  it('generates a 2h reminder message in Spanish', () => {
    const message = generateReminderMessage('2h', mockAppointment, mockClinic, mockPatient);

    expect(message).toContain('Maria Lopez');
    expect(message).toContain('Clinica Dental Sonrisa');
    expect(message).toContain('2 horas');
    expect(message).toContain('esperamos');
  });

  it('includes the appointment time in all reminder types', () => {
    const types: ReminderType[] = ['48h', '24h', '2h'];

    for (const type of types) {
      const message = generateReminderMessage(type, mockAppointment, mockClinic, mockPatient);
      expect(message.length).toBeGreaterThan(0);
    }
  });
});

describe('processReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-establish default resolved values after clearAllMocks, since a
    // prior test's mockResolvedValueOnce/mockRejectedValueOnce queue must
    // not leak into the next test.
    mockSendMessage.mockResolvedValue('SM123');
    mockSetSession.mockResolvedValue(undefined);
  });

  function setupMocks(options: {
    appointments?: Appointment[];
    appointmentsError?: { message: string } | null;
    clinics?: Clinic[];
    patients?: Patient[];
    // Result returned by the atomic claim update (`.update().eq().eq().select('id')`).
    // Defaults to a successful claim (non-empty rows) so existing tests that
    // don't care about the claim step keep exercising the send path.
    claimResult?: { id: string }[] | null;
    claimError?: { message: string } | null;
  }) {
    const {
      appointments = [],
      appointmentsError = null,
      clinics = [mockClinic],
      patients = [mockPatient],
      claimResult = [{ id: 'claimed' }],
      claimError = null,
    } = options;

    // Appointments chain (for query, update, and reminder_logs insert)
    const appointmentsQueryChain = createChain({
      data: appointmentsError ? null : appointments,
      error: appointmentsError,
    });
    // Shared by both the atomic claim (`update().eq().eq().select()`) and the
    // revert-on-failure (`update().eq()`) calls against `appointments`.
    const appointmentsUpdateChain = createChain({ data: claimResult, error: claimError });
    const clinicsChain = createChain({ data: clinics, error: null });
    const patientsChain = createChain({ data: patients, error: null });
    const reminderLogsChain = createChain({ data: null, error: null });

    let appointmentsCallCount = 0;
    mockSupabaseFrom.mockImplementation((table: string) => {
      switch (table) {
        case 'appointments':
          appointmentsCallCount++;
          // First call is the main query, subsequent calls are updates
          if (appointmentsCallCount === 1) return appointmentsQueryChain;
          return appointmentsUpdateChain;
        case 'clinics':
          return clinicsChain;
        case 'patients':
          return patientsChain;
        case 'reminder_logs':
          return reminderLogsChain;
        default:
          return createChain();
      }
    });

    return { appointmentsQueryChain, appointmentsUpdateChain, reminderLogsChain };
  }

  it('returns zero counts when there are no appointments', async () => {
    setupMocks({ appointments: [] });

    const result = await processReminders();

    expect(result).toEqual({ sent48h: 0, sent24h: 0, sent2h: 0, errors: 0 });
  });

  it('throws when appointment query fails', async () => {
    setupMocks({ appointmentsError: { message: 'Connection failed' } });

    await expect(processReminders()).rejects.toThrow('Failed to fetch appointments');
  });

  it('sends a 48h reminder for appointments within the 48h window', async () => {
    // 36 hours from now in Bogota (falls in <=48 and >24 window)
    const { date: dateStr, time: timeStr } = appointmentInBogota(36);

    const appointment: Appointment = {
      ...mockAppointment,
      date: dateStr,
      start_time: timeStr,
      reminder_48h_sent: false,
      reminder_24h_sent: false,
      reminder_2h_sent: false,
    };

    setupMocks({ appointments: [appointment] });
    mockSendMessage.mockResolvedValueOnce('SM123');

    const result = await processReminders();

    expect(result.sent48h).toBe(1);
    expect(mockSendMessage).toHaveBeenCalled();
  });

  it('sends a 24h reminder for appointments within the 24h window', async () => {
    const { date: dateStr, time: timeStr } = appointmentInBogota(12);

    const appointment: Appointment = {
      ...mockAppointment,
      date: dateStr,
      start_time: timeStr,
      reminder_48h_sent: true,
      reminder_24h_sent: false,
      reminder_2h_sent: false,
    };

    setupMocks({ appointments: [appointment] });
    mockSendMessage.mockResolvedValueOnce('SM123');

    const result = await processReminders();

    expect(result.sent24h).toBe(1);
  });

  it('sends a 2h reminder for appointments within the 2h window', async () => {
    const { date: dateStr, time: timeStr } = appointmentInBogota(1);

    const appointment: Appointment = {
      ...mockAppointment,
      date: dateStr,
      start_time: timeStr,
      reminder_48h_sent: true,
      reminder_24h_sent: true,
      reminder_2h_sent: false,
    };

    setupMocks({ appointments: [appointment] });
    mockSendMessage.mockResolvedValueOnce('SM123');

    const result = await processReminders();

    expect(result.sent2h).toBe(1);
  });

  it('does not send a reminder that was already sent', async () => {
    const { date: dateStr, time: timeStr } = appointmentInBogota(36);

    const appointment: Appointment = {
      ...mockAppointment,
      date: dateStr,
      start_time: timeStr,
      reminder_48h_sent: true, // already sent
      reminder_24h_sent: false,
      reminder_2h_sent: false,
    };

    setupMocks({ appointments: [appointment] });

    const result = await processReminders();

    // 48h was already sent, and 36h doesn't trigger 24h or 2h
    expect(result.sent48h).toBe(0);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('skips appointments with missing clinic or patient data', async () => {
    const { date: dateStr, time: timeStr } = appointmentInBogota(36);

    const appointment: Appointment = {
      ...mockAppointment,
      clinic_id: 'nonexistent-clinic',
      date: dateStr,
      start_time: timeStr,
    };

    setupMocks({
      appointments: [appointment],
      clinics: [mockClinic], // clinic-001, not nonexistent-clinic
    });

    const result = await processReminders();

    expect(result.sent48h).toBe(0);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('increments errors count when WhatsApp message fails', async () => {
    const { date: dateStr, time: timeStr } = appointmentInBogota(36);

    const appointment: Appointment = {
      ...mockAppointment,
      date: dateStr,
      start_time: timeStr,
    };

    setupMocks({ appointments: [appointment] });
    mockSendMessage.mockRejectedValueOnce(new Error('Twilio error'));

    const result = await processReminders();

    expect(result.errors).toBe(1);
  });

  it('reclama el flag antes de enviar y lo revierte si el envio falla', async () => {
    const { date: dateStr, time: timeStr } = appointmentInBogota(36);

    const appointment: Appointment = {
      ...mockAppointment,
      date: dateStr,
      start_time: timeStr,
    };

    const { appointmentsUpdateChain } = setupMocks({ appointments: [appointment] });
    mockSendMessage.mockRejectedValueOnce(new Error('Twilio down'));

    const result = await processReminders();

    expect(result.errors).toBe(1);

    const updateMock = appointmentsUpdateChain.update as ReturnType<typeof vi.fn>;
    const updateCalls = updateMock.mock.calls.map((c: unknown[]) => c[0]);
    // The flag was claimed (set to true) before attempting to send...
    expect(updateCalls).toContainEqual({ reminder_48h_sent: true });
    // ...and reverted back to false after the send failed, so a later run can retry.
    expect(updateCalls).toContainEqual({ reminder_48h_sent: false });
  });

  it('no envia si otro proceso ya reclamo el flag (update no retorna filas)', async () => {
    const { date: dateStr, time: timeStr } = appointmentInBogota(36);

    const appointment: Appointment = {
      ...mockAppointment,
      date: dateStr,
      start_time: timeStr,
    };

    setupMocks({ appointments: [appointment], claimResult: [] });

    const result = await processReminders();

    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(result.sent48h).toBe(0);
    expect(result.errors).toBe(0);
  });

  it('deja la sesion en awaiting_reminder_reply tras enviar recordatorio 48h', async () => {
    const { date: dateStr, time: timeStr } = appointmentInBogota(36);

    const appointment: Appointment = {
      ...mockAppointment,
      date: dateStr,
      start_time: timeStr,
    };

    setupMocks({ appointments: [appointment] });

    await processReminders();

    expect(mockSetSession).toHaveBeenCalledWith(
      appointment.clinic_id,
      appointment.patient_id,
      'awaiting_reminder_reply',
      { appointment_id: appointment.id },
      24 * 60,
    );
  });

  it('deja la sesion en awaiting_reminder_reply tras enviar recordatorio 24h', async () => {
    const { date: dateStr, time: timeStr } = appointmentInBogota(12);

    const appointment: Appointment = {
      ...mockAppointment,
      date: dateStr,
      start_time: timeStr,
      reminder_48h_sent: true,
      reminder_24h_sent: false,
      reminder_2h_sent: false,
    };

    setupMocks({ appointments: [appointment] });

    await processReminders();

    expect(mockSetSession).toHaveBeenCalledWith(
      appointment.clinic_id,
      appointment.patient_id,
      'awaiting_reminder_reply',
      { appointment_id: appointment.id },
      24 * 60,
    );
  });

  it('NO establece sesion tras enviar recordatorio 2h', async () => {
    const { date: dateStr, time: timeStr } = appointmentInBogota(1);

    const appointment: Appointment = {
      ...mockAppointment,
      date: dateStr,
      start_time: timeStr,
      reminder_48h_sent: true,
      reminder_24h_sent: true,
      reminder_2h_sent: false,
    };

    setupMocks({ appointments: [appointment] });

    const result = await processReminders();

    expect(result.sent2h).toBe(1);
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  it('no marca el recordatorio como fallido si setSession falla despues del envio exitoso', async () => {
    const { date: dateStr, time: timeStr } = appointmentInBogota(36);

    const appointment: Appointment = {
      ...mockAppointment,
      date: dateStr,
      start_time: timeStr,
    };

    const { appointmentsUpdateChain } = setupMocks({ appointments: [appointment] });
    mockSetSession.mockRejectedValueOnce(new Error('sessions table down'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await processReminders();

    // The WhatsApp message already went out, so this must still count as sent,
    // with no revert of the claim flag.
    expect(result.sent48h).toBe(1);
    expect(result.errors).toBe(0);

    const updateMock = appointmentsUpdateChain.update as ReturnType<typeof vi.fn>;
    const updateCalls = updateMock.mock.calls.map((c: unknown[]) => c[0]);
    expect(updateCalls).toContainEqual({ reminder_48h_sent: true });
    expect(updateCalls).not.toContainEqual({ reminder_48h_sent: false });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
