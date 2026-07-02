import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Clinic, ClinicService, ConversationSession, Patient } from '@/types';

vi.mock('@/lib/db/sessions', () => ({
  getActiveSession: vi.fn(), setSession: vi.fn(), clearSession: vi.fn(),
}));
vi.mock('@/lib/db/queries', () => ({
  getAvailableSlots: vi.fn(), createAppointment: vi.fn(), updateAppointment: vi.fn(),
  updatePatient: vi.fn(), updateAppointmentStatus: vi.fn(),
  getUpcomingAppointment: vi.fn(),
}));
vi.mock('@/lib/calendar/google', () => ({ createEvent: vi.fn(), deleteEvent: vi.fn() }));
vi.mock('@/lib/ai/classifier', () => ({ classifyIntent: vi.fn() }));

import {
  parseNumericChoice, isEscapeMessage, formatSlot,
  startScheduleFlow, startRescheduleFlow, continueSession,
} from './flow';
import { setSession, clearSession } from '@/lib/db/sessions';
import {
  getAvailableSlots, createAppointment, updateAppointment, updatePatient,
  updateAppointmentStatus, getUpcomingAppointment,
} from '@/lib/db/queries';
import { createEvent, deleteEvent } from '@/lib/calendar/google';
import { classifyIntent } from '@/lib/ai/classifier';

const clinic = {
  id: 'c1', name: 'Clinica X', timezone: 'America/Bogota',
  google_calendar_id: 'cal-1', whatsapp_number: '+573001234567',
} as unknown as Clinic;
const patient = { id: 'p1', clinic_id: 'c1', name: 'Maria', phone: '+573009876543' } as Patient;
const services: ClinicService[] = [
  { id: 's1', clinic_id: 'c1', name: 'Limpieza dental', duration_minutes: 60, price: 90000, description: null, active: true, follow_up_days: null },
  { id: 's2', clinic_id: 'c1', name: 'Ortodoncia', duration_minutes: 30, price: null, description: null, active: true, follow_up_days: null },
];
const slots = [
  { date: '2026-07-06', time: '09:00' },
  { date: '2026-07-06', time: '10:00' },
];

describe('parseNumericChoice', () => {
  it('acepta numeros dentro del rango', () => {
    expect(parseNumericChoice('2', 5)).toBe(2);
    expect(parseNumericChoice(' 1 ', 5)).toBe(1);
  });
  it('rechaza fuera de rango y texto', () => {
    expect(parseNumericChoice('7', 5)).toBeNull();
    expect(parseNumericChoice('el martes', 5)).toBeNull();
    expect(parseNumericChoice('0', 5)).toBeNull();
  });
});

describe('isEscapeMessage', () => {
  it('detecta frases de escape', () => {
    expect(isEscapeMessage('mejor cancelar eso')).toBe(true);
    expect(isEscapeMessage('no quiero agendar')).toBe(true);
    expect(isEscapeMessage('la 2')).toBe(false);
  });
  it('no confunde una respuesta normal con escape', () => {
    expect(isEscapeMessage('Carlos Ruiz')).toBe(false);
    expect(isEscapeMessage('2026-07-10')).toBe(false);
  });
});

describe('formatSlot', () => {
  it('formatea fecha y hora en espanol', () => {
    const text = formatSlot({ date: '2026-07-06', time: '09:00' });
    expect(text).toContain('6');
    expect(text).toContain('julio');
    expect(text).toMatch(/9:00\s*a\.?\s*m\.?/i);
  });
});

describe('startScheduleFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAvailableSlots).mockResolvedValue(slots);
  });

  it('con varios servicios y sin servicio en el mensaje, pregunta el servicio', async () => {
    const reply = await startScheduleFlow(clinic, patient, {}, services);
    expect(reply).toContain('1. Limpieza dental');
    expect(reply.length).toBeLessThanOrEqual(300);
    expect(setSession).toHaveBeenCalledWith('c1', 'p1', 'awaiting_service',
      expect.objectContaining({ flow: 'schedule', offered_services: ['Limpieza dental', 'Ortodoncia'] }));
    expect(getAvailableSlots).not.toHaveBeenCalled();
  });

  it('con servicio identificado, ofrece slots numerados', async () => {
    const reply = await startScheduleFlow(clinic, patient, { service_type: 'limpieza' }, services);
    expect(reply).toMatch(/1\./);
    expect(reply.length).toBeLessThanOrEqual(300);
    expect(setSession).toHaveBeenCalledWith('c1', 'p1', 'awaiting_slot',
      expect.objectContaining({ service_name: 'Limpieza dental', duration_minutes: 60, offered_slots: slots }));
  });

  it('con un unico servicio activo, lo usa sin preguntar', async () => {
    const oneService = [services[0]];
    await startScheduleFlow(clinic, patient, {}, oneService);
    expect(setSession).toHaveBeenCalledWith('c1', 'p1', 'awaiting_slot',
      expect.objectContaining({ service_name: 'Limpieza dental', duration_minutes: 60 }));
  });

  it('si no hay cupos disponibles, limpia la sesion y avisa', async () => {
    vi.mocked(getAvailableSlots).mockResolvedValue([]);
    const reply = await startScheduleFlow(clinic, patient, { service_type: 'limpieza' }, services);
    expect(clearSession).toHaveBeenCalledWith('c1', 'p1');
    expect(reply).toContain('Clinica X');
    expect(reply.length).toBeLessThanOrEqual(300);
  });
});

describe('startRescheduleFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAvailableSlots).mockResolvedValue(slots);
  });

  it('sin cita proxima, avisa que no encontro nada', async () => {
    vi.mocked(getUpcomingAppointment).mockResolvedValue(null);
    const reply = await startRescheduleFlow(clinic, patient, {});
    expect(reply).toContain('Clinica X');
    expect(setSession).not.toHaveBeenCalled();
  });

  it('con cita proxima, ofrece slots para reagendar', async () => {
    vi.mocked(getUpcomingAppointment).mockResolvedValue({
      id: 'a0', service: 'Limpieza dental', google_event_id: 'old-evt-1',
    } as never);
    const reply = await startRescheduleFlow(clinic, patient, {});
    expect(reply).toMatch(/1\./);
    expect(setSession).toHaveBeenCalledWith('c1', 'p1', 'awaiting_reschedule_slot',
      expect.objectContaining({
        flow: 'reschedule', appointment_id: 'a0', service_name: 'Limpieza dental',
        old_google_event_id: 'old-evt-1',
      }));
  });

  it('NO toca la cita original al iniciar el flujo', async () => {
    vi.mocked(getUpcomingAppointment).mockResolvedValue({ id: 'a-old', service: 'Limpieza dental' } as never);
    await startRescheduleFlow(clinic, patient, {});
    expect(updateAppointmentStatus).not.toHaveBeenCalled();
  });
});

describe('continueSession', () => {
  const slotSession = {
    id: 'ses1', clinic_id: 'c1', patient_id: 'p1', state: 'awaiting_slot',
    context: { flow: 'schedule', service_name: 'Limpieza dental', duration_minutes: 60, offered_slots: slots },
  } as unknown as ConversationSession;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAvailableSlots).mockResolvedValue(slots);
    vi.mocked(createEvent).mockResolvedValue('gcal-evt-1');
    vi.mocked(deleteEvent).mockResolvedValue(undefined);
    vi.mocked(updateAppointment).mockImplementation(async (id, data) => ({ id, ...data } as never));
  });

  it('eleccion numerica de slot crea la cita: primero el registro, con evento nulo', async () => {
    vi.mocked(createAppointment).mockResolvedValue({ id: 'a1', date: '2026-07-06', start_time: '09:00', service: 'Limpieza dental' } as never);
    const result = await continueSession({ session: slotSession, message: '1', clinic, patient, services });
    expect(result.handled).toBe(true);
    expect(createAppointment).toHaveBeenCalledWith(expect.objectContaining({
      clinic_id: 'c1', patient_id: 'p1', date: '2026-07-06',
      start_time: '09:00', end_time: '10:00', service: 'Limpieza dental', status: 'scheduled',
      google_event_id: null,
    }));
    expect(clearSession).toHaveBeenCalledWith('c1', 'p1');
    expect(result.reply).toContain('Maria');
    expect(result.reply!.length).toBeLessThanOrEqual(300);
  });

  it('tras crear la cita, actualiza el registro con el id del evento de calendario', async () => {
    vi.mocked(createAppointment).mockResolvedValue({ id: 'a1', date: '2026-07-06', start_time: '09:00', service: 'Limpieza dental' } as never);
    const result = await continueSession({ session: slotSession, message: '1', clinic, patient, services });
    expect(result.handled).toBe(true);
    expect(updateAppointment).toHaveBeenCalledWith('a1', { google_event_id: 'gcal-evt-1' });
  });

  it('crea la cita en base de datos antes de crear el evento de calendario', async () => {
    const callOrder: string[] = [];
    vi.mocked(createAppointment).mockImplementation(async () => {
      callOrder.push('create-appointment');
      return { id: 'a1', date: '2026-07-06', start_time: '09:00', service: 'Limpieza dental' } as never;
    });
    vi.mocked(createEvent).mockImplementation(async () => {
      callOrder.push('create-event');
      return 'gcal-evt-1';
    });
    const result = await continueSession({ session: slotSession, message: '1', clinic, patient, services });
    expect(result.handled).toBe(true);
    expect(callOrder).toEqual(['create-appointment', 'create-event']);
  });

  it('si la clinica no tiene calendario configurado, crea la cita sin evento', async () => {
    const clinicNoCal = { ...clinic, google_calendar_id: '' } as unknown as Clinic;
    vi.mocked(createAppointment).mockResolvedValue({ id: 'a1', date: '2026-07-06', start_time: '09:00', service: 'Limpieza dental' } as never);
    const result = await continueSession({ session: slotSession, message: '1', clinic: clinicNoCal, patient, services });
    expect(result.handled).toBe(true);
    expect(createEvent).not.toHaveBeenCalled();
    expect(createAppointment).toHaveBeenCalledWith(expect.objectContaining({ google_event_id: null }));
    expect(updateAppointment).not.toHaveBeenCalled();
  });

  it('si el paciente no tiene nombre, lo pide antes de crear', async () => {
    const noName = { ...patient, name: '' };
    const result = await continueSession({ session: slotSession, message: '1', clinic, patient: noName, services });
    expect(result.handled).toBe(true);
    expect(createAppointment).not.toHaveBeenCalled();
    expect(setSession).toHaveBeenCalledWith('c1', 'p1', 'awaiting_name',
      expect.objectContaining({ chosen_slot: slots[0] }));
  });

  it('en awaiting_name guarda el nombre y crea la cita', async () => {
    const nameSession = {
      ...slotSession, state: 'awaiting_name',
      context: { ...slotSession.context, chosen_slot: slots[0] },
    } as unknown as ConversationSession;
    vi.mocked(updatePatient).mockResolvedValue({ ...patient, name: 'Carlos Ruiz' } as never);
    vi.mocked(createAppointment).mockResolvedValue({ id: 'a1', date: '2026-07-06', start_time: '09:00', service: 'Limpieza dental' } as never);
    const result = await continueSession({ session: nameSession, message: 'Carlos Ruiz', clinic, patient: { ...patient, name: '' }, services });
    expect(result.handled).toBe(true);
    expect(updatePatient).toHaveBeenCalledWith('p1', { name: 'Carlos Ruiz' });
    expect(createAppointment).toHaveBeenCalled();
  });

  it('en awaiting_name rechaza un nombre invalido y no crea la cita', async () => {
    const nameSession = {
      ...slotSession, state: 'awaiting_name',
      context: { ...slotSession.context, chosen_slot: slots[0] },
    } as unknown as ConversationSession;
    const result = await continueSession({ session: nameSession, message: '1', clinic, patient: { ...patient, name: '' }, services });
    expect(result.handled).toBe(true);
    expect(updatePatient).not.toHaveBeenCalled();
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('si el slot ya fue tomado (unique violation), reofrece horarios y no crea evento huerfano', async () => {
    vi.mocked(createAppointment).mockRejectedValue(new Error('createAppointment failed: duplicate key value violates unique constraint "appointments_slot_unique"'));
    vi.mocked(getAvailableSlots).mockResolvedValue([{ date: '2026-07-06', time: '11:00' }]);
    const result = await continueSession({ session: slotSession, message: '1', clinic, patient, services });
    expect(result.handled).toBe(true);
    expect(result.reply).toContain('ocupado');
    expect(setSession).toHaveBeenCalledWith('c1', 'p1', 'awaiting_slot', expect.anything());
    expect(createEvent).not.toHaveBeenCalled();
  });

  it('un error de base de datos no relacionado con el slot se propaga', async () => {
    vi.mocked(createAppointment).mockRejectedValue(new Error('createAppointment failed: connection refused'));
    await expect(continueSession({ session: slotSession, message: '1', clinic, patient, services }))
      .rejects.toThrow('connection refused');
  });

  it('mensaje de escape aborta el flujo', async () => {
    const result = await continueSession({ session: slotSession, message: 'no quiero nada gracias', clinic, patient, services });
    expect(result.handled).toBe(true);
    expect(clearSession).toHaveBeenCalledWith('c1', 'p1');
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('respuesta libre sin numero valido intenta extraer una fecha con el clasificador', async () => {
    vi.mocked(classifyIntent).mockResolvedValue({ intent: 'schedule', confidence: 0.8, entities: { date: '2026-07-08' } });
    vi.mocked(getAvailableSlots).mockResolvedValue([{ date: '2026-07-08', time: '09:00' }]);
    const result = await continueSession({ session: slotSession, message: 'el miercoles mejor', clinic, patient, services });
    expect(result.handled).toBe(true);
    expect(getAvailableSlots).toHaveBeenCalledWith(clinic, expect.objectContaining({ date: '2026-07-08' }));
  });

  it('respuesta libre sin numero valido ni fecha reconocible marca handled:false', async () => {
    vi.mocked(classifyIntent).mockResolvedValue({ intent: 'other', confidence: 0.1, entities: {} });
    const result = await continueSession({ session: slotSession, message: 'mmmm no se', clinic, patient, services });
    expect(result.handled).toBe(false);
  });

  it('en awaiting_service elige por numero y ofrece slots del servicio', async () => {
    const serviceSession = {
      id: 'ses2', clinic_id: 'c1', patient_id: 'p1', state: 'awaiting_service',
      context: { flow: 'schedule', offered_services: ['Limpieza dental', 'Ortodoncia'] },
    } as unknown as ConversationSession;
    const result = await continueSession({ session: serviceSession, message: '2', clinic, patient, services });
    expect(result.handled).toBe(true);
    expect(setSession).toHaveBeenCalledWith('c1', 'p1', 'awaiting_slot',
      expect.objectContaining({ service_name: 'Ortodoncia', duration_minutes: 30 }));
  });

  it('en awaiting_service un numero fuera de rango no queda manejado', async () => {
    const serviceSession = {
      id: 'ses2', clinic_id: 'c1', patient_id: 'p1', state: 'awaiting_service',
      context: { flow: 'schedule', offered_services: ['Limpieza dental', 'Ortodoncia'] },
    } as unknown as ConversationSession;
    const result = await continueSession({ session: serviceSession, message: 'no se cual', clinic, patient, services });
    expect(result.handled).toBe(false);
  });

  describe('awaiting_reminder_reply', () => {
    const reminderSession = {
      id: 'ses3', clinic_id: 'c1', patient_id: 'p1', state: 'awaiting_reminder_reply',
      context: { appointment_id: 'a0' },
    } as unknown as ConversationSession;

    it('responde 1 confirma la cita', async () => {
      const result = await continueSession({ session: reminderSession, message: '1', clinic, patient, services });
      expect(result.handled).toBe(true);
      expect(updateAppointmentStatus).toHaveBeenCalledWith('a0', 'confirmed');
      expect(clearSession).toHaveBeenCalledWith('c1', 'p1');
    });

    it('responde 2 inicia el flujo de reagendamiento', async () => {
      vi.mocked(getUpcomingAppointment).mockResolvedValue({ id: 'a0', service: 'Limpieza dental' } as never);
      const result = await continueSession({ session: reminderSession, message: '2', clinic, patient, services });
      expect(result.handled).toBe(true);
      expect(clearSession).toHaveBeenCalledWith('c1', 'p1');
    });

    it('un mensaje de "cancelar" NO se trata como escape: cae al clasificador (handled:false)', async () => {
      const result = await continueSession({ session: reminderSession, message: 'cancelar', clinic, patient, services });
      expect(result.handled).toBe(false);
      expect(clearSession).not.toHaveBeenCalled();
    });
  });

  describe('reagendamiento crea antes de marcar la cita vieja', () => {
    it('crea la nueva cita antes de actualizar el estado de la anterior', async () => {
      const rescheduleSession = {
        id: 'ses4', clinic_id: 'c1', patient_id: 'p1', state: 'awaiting_reschedule_slot',
        context: { flow: 'reschedule', appointment_id: 'old-1', service_name: 'Limpieza dental', duration_minutes: 60, offered_slots: slots },
      } as unknown as ConversationSession;
      const callOrder: string[] = [];
      vi.mocked(createAppointment).mockImplementation(async () => {
        callOrder.push('create');
        return { id: 'a-new', date: '2026-07-06', start_time: '09:00', service: 'Limpieza dental' } as never;
      });
      vi.mocked(updateAppointmentStatus).mockImplementation(async () => {
        callOrder.push('update-old');
        return {} as never;
      });
      const result = await continueSession({ session: rescheduleSession, message: '1', clinic, patient, services });
      expect(result.handled).toBe(true);
      expect(callOrder).toEqual(['create', 'update-old']);
      expect(updateAppointmentStatus).toHaveBeenCalledWith('old-1', 'rescheduled');
      expect(deleteEvent).not.toHaveBeenCalled();
    });

    it('si crear la nueva falla, la original queda intacta', async () => {
      const rescheduleSession = {
        id: 'ses4', clinic_id: 'c1', patient_id: 'p1', state: 'awaiting_reschedule_slot',
        context: { flow: 'reschedule', appointment_id: 'old-1', duration_minutes: 60, offered_slots: slots },
      } as unknown as ConversationSession;
      vi.mocked(createAppointment).mockRejectedValue(new Error('db down'));
      await expect(continueSession({ session: rescheduleSession, message: '1', clinic, patient, services }))
        .rejects.toThrow();
      expect(updateAppointmentStatus).not.toHaveBeenCalled();
    });
  });

  describe('reagendamiento limpia el evento de calendario de la cita anterior', () => {
    const rescheduleSessionWithOldEvent = {
      id: 'ses5', clinic_id: 'c1', patient_id: 'p1', state: 'awaiting_reschedule_slot',
      context: {
        flow: 'reschedule', appointment_id: 'old-1', old_google_event_id: 'old-evt-1',
        service_name: 'Limpieza dental', duration_minutes: 60, offered_slots: slots,
      },
    } as unknown as ConversationSession;

    it('elimina el evento de calendario de la cita anterior tras reagendar', async () => {
      vi.mocked(createAppointment).mockResolvedValue({ id: 'a-new', date: '2026-07-06', start_time: '09:00', service: 'Limpieza dental' } as never);
      const result = await continueSession({ session: rescheduleSessionWithOldEvent, message: '1', clinic, patient, services });
      expect(result.handled).toBe(true);
      expect(deleteEvent).toHaveBeenCalledWith('cal-1', 'old-evt-1');
    });

    it('si la eliminacion del evento anterior falla, no bloquea la respuesta de exito', async () => {
      vi.mocked(createAppointment).mockResolvedValue({ id: 'a-new', date: '2026-07-06', start_time: '09:00', service: 'Limpieza dental' } as never);
      vi.mocked(deleteEvent).mockRejectedValue(new Error('calendar API down'));
      const result = await continueSession({ session: rescheduleSessionWithOldEvent, message: '1', clinic, patient, services });
      expect(result.handled).toBe(true);
      expect(result.reply).toContain('reagendada');
      expect(clearSession).toHaveBeenCalledWith('c1', 'p1');
    });
  });
});
