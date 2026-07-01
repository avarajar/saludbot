import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Clinic, Patient, ClinicService, Appointment } from '@/types';

// Mock dependencies
vi.mock('@/lib/db/queries', () => ({
  getClinicServices: vi.fn(),
  getAvailableSlots: vi.fn(),
  getUpcomingAppointment: vi.fn(),
  createAppointment: vi.fn(),
  updateAppointmentStatus: vi.fn(),
}));

vi.mock('@/lib/whatsapp/client', () => ({
  sendMessage: vi.fn(),
}));

vi.mock('@/lib/ai/responder', () => ({
  generateResponse: vi.fn(),
}));

vi.mock('./flow', () => ({
  startScheduleFlow: vi.fn(),
}));

import {
  handleSchedule,
  handleConfirm,
  handleCancel,
  handleReschedule,
  handleInfoServices,
  handleInfoHours,
  handleGreeting,
  handleEscalate,
} from './handlers';
import {
  getClinicServices,
  getAvailableSlots,
  getUpcomingAppointment,
  updateAppointmentStatus,
} from '@/lib/db/queries';
import { sendMessage } from '@/lib/whatsapp/client';
import { generateResponse } from '@/lib/ai/responder';
import { startScheduleFlow } from './flow';

// Test fixtures
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

const mockServices: ClinicService[] = [
  {
    id: 'svc-001',
    clinic_id: 'clinic-001',
    name: 'Limpieza dental',
    duration_minutes: 30,
    price: 80000,
    description: null,
    active: true,
  },
  {
    id: 'svc-002',
    clinic_id: 'clinic-001',
    name: 'Blanqueamiento',
    duration_minutes: 60,
    price: 250000,
    description: null,
    active: true,
  },
];

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

describe('handleSchedule', () => {
  beforeEach(() => {
    vi.mocked(startScheduleFlow).mockReset();
  });

  it('delegates to startScheduleFlow and returns its reply', async () => {
    vi.mocked(startScheduleFlow).mockResolvedValueOnce(
      'Estos son los horarios disponibles para Limpieza dental:\n1. lunes...',
    );

    const result = await handleSchedule(mockClinic, mockPatient, { date: '2026-03-10' }, mockServices);

    expect(startScheduleFlow).toHaveBeenCalledWith(
      mockClinic, mockPatient, { date: '2026-03-10' }, mockServices,
    );
    expect(result).toContain('horarios disponibles');
  });

  it('passes entities and services through unchanged', async () => {
    vi.mocked(startScheduleFlow).mockResolvedValueOnce('Respuesta');

    await handleSchedule(mockClinic, mockPatient, { service_type: 'Blanqueamiento' }, mockServices);

    expect(startScheduleFlow).toHaveBeenCalledWith(
      mockClinic, mockPatient, { service_type: 'Blanqueamiento' }, mockServices,
    );
  });

  it('returns a fallback message on error', async () => {
    vi.mocked(startScheduleFlow).mockRejectedValueOnce(new Error('DB error'));

    const result = await handleSchedule(mockClinic, mockPatient, {}, mockServices);

    expect(result).toContain('Clinica Dental Sonrisa');
    expect(result).toContain('agendar');
  });
});

describe('handleConfirm', () => {
  beforeEach(() => {
    vi.mocked(getUpcomingAppointment).mockReset();
    vi.mocked(updateAppointmentStatus).mockReset();
    vi.mocked(generateResponse).mockReset();
  });

  it('confirms an existing upcoming appointment', async () => {
    vi.mocked(getUpcomingAppointment).mockResolvedValueOnce(mockAppointment);
    vi.mocked(updateAppointmentStatus).mockResolvedValueOnce({
      ...mockAppointment,
      status: 'confirmed',
    });
    vi.mocked(generateResponse).mockResolvedValueOnce('Cita confirmada. La esperamos.');

    const result = await handleConfirm(mockClinic, mockPatient, {});

    expect(getUpcomingAppointment).toHaveBeenCalledWith('clinic-001', 'patient-001');
    expect(updateAppointmentStatus).toHaveBeenCalledWith('appt-001', 'confirmed');
    expect(result).toContain('confirmada');
  });

  it('falls back to "other" response when no upcoming appointment is found', async () => {
    vi.mocked(getUpcomingAppointment).mockResolvedValueOnce(null);
    vi.mocked(generateResponse).mockResolvedValueOnce('No encontramos citas pendientes.');

    const result = await handleConfirm(mockClinic, mockPatient, {});

    expect(generateResponse).toHaveBeenCalledWith('other', expect.objectContaining({
      clinicName: 'Clinica Dental Sonrisa',
    }));
    expect(updateAppointmentStatus).not.toHaveBeenCalled();
  });

  it('returns a fallback message on error', async () => {
    vi.mocked(getUpcomingAppointment).mockRejectedValueOnce(new Error('DB error'));

    const result = await handleConfirm(mockClinic, mockPatient, {});

    expect(result).toContain('confirmar');
    expect(result).toContain('Clinica Dental Sonrisa');
  });
});

describe('handleCancel', () => {
  beforeEach(() => {
    vi.mocked(getUpcomingAppointment).mockReset();
    vi.mocked(updateAppointmentStatus).mockReset();
    vi.mocked(generateResponse).mockReset();
  });

  it('cancels an existing upcoming appointment', async () => {
    vi.mocked(getUpcomingAppointment).mockResolvedValueOnce(mockAppointment);
    vi.mocked(updateAppointmentStatus).mockResolvedValueOnce({
      ...mockAppointment,
      status: 'cancelled',
    });
    vi.mocked(generateResponse).mockResolvedValueOnce('Su cita ha sido cancelada.');

    const result = await handleCancel(mockClinic, mockPatient, {});

    expect(updateAppointmentStatus).toHaveBeenCalledWith('appt-001', 'cancelled');
    expect(result).toContain('cancelada');
  });

  it('falls back to "other" response when no upcoming appointment is found', async () => {
    vi.mocked(getUpcomingAppointment).mockResolvedValueOnce(null);
    vi.mocked(generateResponse).mockResolvedValueOnce('No encontramos citas pendientes.');

    await handleCancel(mockClinic, mockPatient, {});

    expect(generateResponse).toHaveBeenCalledWith('other', expect.objectContaining({
      clinicName: 'Clinica Dental Sonrisa',
    }));
    expect(updateAppointmentStatus).not.toHaveBeenCalled();
  });

  it('returns a fallback message on error', async () => {
    vi.mocked(getUpcomingAppointment).mockRejectedValueOnce(new Error('DB error'));

    const result = await handleCancel(mockClinic, mockPatient, {});

    expect(result).toContain('cancelado');
  });
});

describe('handleReschedule', () => {
  beforeEach(() => {
    vi.mocked(getUpcomingAppointment).mockReset();
    vi.mocked(updateAppointmentStatus).mockReset();
    vi.mocked(getAvailableSlots).mockReset();
    vi.mocked(generateResponse).mockReset();
  });

  it('reschedules an existing appointment and shows new available slots', async () => {
    vi.mocked(getUpcomingAppointment).mockResolvedValueOnce(mockAppointment);
    vi.mocked(updateAppointmentStatus).mockResolvedValueOnce({
      ...mockAppointment,
      status: 'rescheduled',
    });
    vi.mocked(getAvailableSlots).mockResolvedValueOnce([
      { date: '2026-03-12', time: '09:00' },
      { date: '2026-03-12', time: '11:00' },
    ]);
    vi.mocked(generateResponse).mockResolvedValueOnce('Podemos reagendar para el 12 de marzo.');

    const result = await handleReschedule(mockClinic, mockPatient, { date: '2026-03-12' });

    expect(updateAppointmentStatus).toHaveBeenCalledWith('appt-001', 'rescheduled');
    expect(getAvailableSlots).toHaveBeenCalledWith(mockClinic, { date: '2026-03-12' });
    expect(result).toContain('reagendar');
  });

  it('falls back to "other" response when no upcoming appointment is found', async () => {
    vi.mocked(getUpcomingAppointment).mockResolvedValueOnce(null);
    vi.mocked(generateResponse).mockResolvedValueOnce('No encontramos citas pendientes.');

    await handleReschedule(mockClinic, mockPatient, {});

    expect(generateResponse).toHaveBeenCalledWith('other', expect.objectContaining({
      clinicName: 'Clinica Dental Sonrisa',
    }));
    expect(updateAppointmentStatus).not.toHaveBeenCalled();
    expect(getAvailableSlots).not.toHaveBeenCalled();
  });

  it('returns a fallback message on error', async () => {
    vi.mocked(getUpcomingAppointment).mockRejectedValueOnce(new Error('DB error'));

    const result = await handleReschedule(mockClinic, mockPatient, {});

    expect(result).toContain('Clinica Dental Sonrisa');
    expect(result).toContain('horarios');
  });
});

describe('handleInfoServices', () => {
  beforeEach(() => {
    vi.mocked(getClinicServices).mockReset();
    vi.mocked(generateResponse).mockReset();
  });

  it('fetches active services and generates an info response', async () => {
    vi.mocked(getClinicServices).mockResolvedValueOnce(mockServices);
    vi.mocked(generateResponse).mockResolvedValueOnce('Ofrecemos: Limpieza, Blanqueamiento.');

    const result = await handleInfoServices(mockClinic);

    expect(getClinicServices).toHaveBeenCalledWith('clinic-001');
    expect(result).toContain('Ofrecemos');
  });

  it('filters out inactive services', async () => {
    vi.mocked(getClinicServices).mockResolvedValueOnce([
      ...mockServices,
      {
        id: 'svc-003',
        clinic_id: 'clinic-001',
        name: 'Servicio Inactivo',
        duration_minutes: 30,
        price: 50000,
        description: null,
        active: false,
      },
    ]);
    vi.mocked(generateResponse).mockResolvedValueOnce('Servicios activos');

    await handleInfoServices(mockClinic);

    const context = vi.mocked(generateResponse).mock.calls[0][1];
    expect(context.services).not.toContain(expect.stringContaining('Servicio Inactivo'));
  });

  it('returns a fallback message on error', async () => {
    vi.mocked(getClinicServices).mockRejectedValueOnce(new Error('DB error'));

    const result = await handleInfoServices(mockClinic);

    expect(result).toContain('Clinica Dental Sonrisa');
    expect(result).toContain('servicios');
  });
});

describe('handleInfoHours', () => {
  beforeEach(() => {
    vi.mocked(generateResponse).mockReset();
  });

  it('generates a response with clinic hours', async () => {
    vi.mocked(generateResponse).mockResolvedValueOnce('Lunes a Viernes 8 AM - 6 PM');

    const result = await handleInfoHours(mockClinic);

    expect(generateResponse).toHaveBeenCalledWith('info_hours', expect.objectContaining({
      clinicName: 'Clinica Dental Sonrisa',
      clinicAddress: 'Calle 80 #45-23, Bogota',
    }));
    expect(result).toContain('Lunes');
  });

  it('returns a fallback message on error', async () => {
    vi.mocked(generateResponse).mockRejectedValueOnce(new Error('API error'));

    const result = await handleInfoHours(mockClinic);

    expect(result).toContain('Clinica Dental Sonrisa');
    expect(result).toContain('horario');
  });
});

describe('handleGreeting', () => {
  beforeEach(() => {
    vi.mocked(getClinicServices).mockReset();
    vi.mocked(generateResponse).mockReset();
  });

  it('fetches services and generates a welcome message', async () => {
    vi.mocked(getClinicServices).mockResolvedValueOnce(mockServices);
    vi.mocked(generateResponse).mockResolvedValueOnce('Bienvenida Maria Lopez!');

    const result = await handleGreeting(mockClinic, mockPatient);

    expect(getClinicServices).toHaveBeenCalledWith('clinic-001');
    expect(generateResponse).toHaveBeenCalledWith('greeting', expect.objectContaining({
      patientName: 'Maria Lopez',
    }));
    expect(result).toContain('Bienvenida');
  });

  it('limits services to 5 in the greeting', async () => {
    const manyServices = Array.from({ length: 8 }, (_, i) => ({
      id: `svc-${i}`,
      clinic_id: 'clinic-001',
      name: `Servicio ${i}`,
      duration_minutes: 30,
      price: null,
      description: null,
      active: true,
    }));

    vi.mocked(getClinicServices).mockResolvedValueOnce(manyServices);
    vi.mocked(generateResponse).mockResolvedValueOnce('Bienvenido');

    await handleGreeting(mockClinic, mockPatient);

    const context = vi.mocked(generateResponse).mock.calls[0][1];
    expect(context.services!.length).toBeLessThanOrEqual(5);
  });

  it('returns a fallback message on error', async () => {
    vi.mocked(getClinicServices).mockRejectedValueOnce(new Error('DB error'));

    const result = await handleGreeting(mockClinic, mockPatient);

    expect(result).toContain('Bienvenido/a');
    expect(result).toContain('Clinica Dental Sonrisa');
  });
});

describe('handleEscalate', () => {
  beforeEach(() => {
    vi.mocked(sendMessage).mockReset();
    vi.mocked(generateResponse).mockReset();
  });

  it('notifies the clinic owner and generates an escalation response', async () => {
    vi.mocked(sendMessage).mockResolvedValueOnce('msg-123');
    vi.mocked(generateResponse).mockResolvedValueOnce(
      'Un miembro de nuestro equipo se comunicara con usted pronto.',
    );

    const result = await handleEscalate(mockClinic, mockPatient, 'Tengo una urgencia');

    expect(sendMessage).toHaveBeenCalledWith(
      '+573001234567',
      expect.stringContaining('Maria Lopez'),
      '+573001234567',
    );
    expect(sendMessage).toHaveBeenCalledWith(
      '+573001234567',
      expect.stringContaining('Tengo una urgencia'),
      '+573001234567',
    );
    expect(result).toContain('equipo');
  });

  it('returns a fallback message on error', async () => {
    vi.mocked(sendMessage).mockRejectedValueOnce(new Error('Twilio error'));

    const result = await handleEscalate(mockClinic, mockPatient, 'Urgencia');

    expect(result).toContain('Clinica Dental Sonrisa');
    expect(result).toContain('equipo');
  });
});
