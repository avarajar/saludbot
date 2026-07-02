import { TZDate } from '@date-fns/tz';
import { addMinutes, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  AvailableSlot, Clinic, ClinicService, ConversationSession, Patient, SessionContext,
  SessionState,
} from '@/types';
import { setSession, clearSession } from '@/lib/db/sessions';
import {
  getAvailableSlots, createAppointment, updateAppointment, updatePatient,
  updateAppointmentStatus, getUpcomingAppointment,
} from '@/lib/db/queries';
import { createEvent, deleteEvent } from '@/lib/calendar/google';
import { classifyIntent } from '@/lib/ai/classifier';

const ESCAPE_PATTERNS = [
  /\bcancelar?\b/i, /\bolv[ií]d[ea]lo\b/i, /\bno quiero\b/i,
  /\bd[ée]jelo as[ií]\b/i, /\bya no\b/i, /^nada$/i,
];

export function parseNumericChoice(message: string, max: number): number | null {
  const match = message.trim().match(/^([1-9])\s*\.?$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return n >= 1 && n <= max ? n : null;
}

export function isEscapeMessage(message: string): boolean {
  return ESCAPE_PATTERNS.some((p) => p.test(message));
}

export function formatSlot(slot: AvailableSlot): string {
  const d = new TZDate(`${slot.date}T${slot.time}:00`, 'America/Bogota');
  return `${format(d, "EEEE d 'de' MMMM", { locale: es })}, ${format(d, 'h:mm a', { locale: es })}`;
}

function numberedList(items: string[]): string {
  return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
}

function matchService(text: string, services: ClinicService[]): ClinicService | null {
  const t = text.toLowerCase();
  return services.find((s) => t.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(t.trim())) ?? null;
}

async function offerSlots(
  clinic: Clinic, patient: Patient, ctx: SessionContext, dateHint?: string,
  state: 'awaiting_slot' | 'awaiting_reschedule_slot' = 'awaiting_slot',
): Promise<string> {
  const slots = (await getAvailableSlots(clinic, {
    date: dateHint,
    durationMinutes: ctx.duration_minutes,
  })).slice(0, 5);

  if (slots.length === 0) {
    await clearSession(clinic.id, patient.id);
    return `Que pena, no encontramos horarios disponibles en los proximos dias en ${clinic.name}. Por favor comuniquese directamente con nosotros.`;
  }

  await setSession(clinic.id, patient.id, state, { ...ctx, offered_slots: slots });
  const header = ctx.service_name
    ? `Estos son los horarios disponibles para ${ctx.service_name}:`
    : 'Estos son los horarios disponibles:';
  return `${header}\n${numberedList(slots.map(formatSlot))}\nResponda con el numero de su preferencia.`;
}

export async function startScheduleFlow(
  clinic: Clinic,
  patient: Patient,
  entities: Record<string, string>,
  services: ClinicService[],
): Promise<string> {
  const active = services.filter((s) => s.active);
  const matched = entities.service_type ? matchService(entities.service_type, active) : null;
  const service = matched ?? (active.length === 1 ? active[0] : null);

  if (!service && active.length > 1) {
    await setSession(clinic.id, patient.id, 'awaiting_service', {
      flow: 'schedule',
      offered_services: active.map((s) => s.name),
    });
    return `Con mucho gusto le agendamos su cita. ¿Que servicio necesita?\n${numberedList(active.map((s) => s.name))}\nResponda con el numero.`;
  }

  const ctx: SessionContext = {
    flow: 'schedule',
    service_name: service?.name ?? 'Consulta',
    duration_minutes: service?.duration_minutes ?? 30,
  };
  return offerSlots(clinic, patient, ctx, entities.date || undefined);
}

export async function startRescheduleFlow(
  clinic: Clinic,
  patient: Patient,
  entities: Record<string, string>,
): Promise<string> {
  const appointment = await getUpcomingAppointment(clinic.id, patient.id);
  if (!appointment) {
    return `No encontramos una cita proxima a su nombre en ${clinic.name}. Si desea agendar una nueva, con mucho gusto le ayudamos.`;
  }
  const ctx: SessionContext = {
    flow: 'reschedule',
    appointment_id: appointment.id,
    service_name: appointment.service,
    old_google_event_id: appointment.google_event_id,
  };
  return offerSlots(clinic, patient, ctx, entities.date || undefined, 'awaiting_reschedule_slot');
}

function endTimeFor(slot: AvailableSlot, durationMinutes: number): string {
  const start = new Date(`2000-01-01T${slot.time}:00`);
  return format(addMinutes(start, durationMinutes), 'HH:mm');
}

/**
 * Creates the Google Calendar event for a confirmed appointment. Non-blocking:
 * any failure (missing calendar, API error) is swallowed so the appointment is
 * still created in the DB — the calendar event is best-effort.
 * `createEvent` returns the event ID directly (a string), not an object.
 */
async function createCalendarEventSafe(
  clinic: Clinic, patient: Patient, ctx: SessionContext, slot: AvailableSlot, duration: number,
): Promise<string | null> {
  try {
    if (!clinic.google_calendar_id) return null;
    const timezone = clinic.timezone || 'America/Bogota';
    const start = new TZDate(`${slot.date}T${slot.time}:00`, timezone);
    const eventId = await createEvent(clinic.google_calendar_id, {
      summary: `${ctx.service_name} - ${patient.name || patient.phone}`,
      description: `Cita agendada via SaludBot. Paciente: ${patient.name || 'sin nombre'} (${patient.phone})`,
      start: start.toISOString(),
      end: addMinutes(start, duration).toISOString(),
    });
    return eventId ?? null;
  } catch (error) {
    console.error('Calendar event creation failed (non-blocking):', error);
    return null;
  }
}

function isSlotTakenError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('appointments_slot_unique');
}

async function finalizeAppointment(
  clinic: Clinic, patient: Patient, ctx: SessionContext, slot: AvailableSlot,
): Promise<string> {
  const duration = ctx.duration_minutes ?? 30;
  try {
    // La cita se crea PRIMERO (sin evento de calendario) para que, si el
    // insert falla por horario ya ocupado (appointments_slot_unique), no
    // quede un evento de calendario huerfano. El evento se crea despues,
    // best-effort, y se enlaza a la cita ya persistida.
    const appointment = await createAppointment({
      clinic_id: clinic.id,
      patient_id: patient.id,
      google_event_id: null,
      date: slot.date,
      start_time: slot.time,
      end_time: endTimeFor(slot, duration),
      service: ctx.service_name ?? 'Consulta',
      status: 'scheduled',
    });

    const googleEventId = await createCalendarEventSafe(clinic, patient, ctx, slot, duration);
    if (googleEventId) {
      try {
        await updateAppointment(appointment.id, { google_event_id: googleEventId });
      } catch (error) {
        console.error('Failed to link calendar event to appointment (non-blocking):', error);
      }
    }

    // Reagendamiento: marcar la cita anterior SOLO despues de crear la nueva,
    // para que un fallo al crear no deje al paciente sin ninguna cita.
    if (ctx.flow === 'reschedule' && ctx.appointment_id) {
      await updateAppointmentStatus(ctx.appointment_id, 'rescheduled');

      // Limpiar el evento de calendario de la cita anterior, best-effort.
      if (ctx.old_google_event_id && clinic.google_calendar_id) {
        try {
          await deleteEvent(clinic.google_calendar_id, ctx.old_google_event_id);
        } catch (error) {
          console.error('Failed to delete old calendar event (non-blocking):', error);
        }
      }
    }

    await clearSession(clinic.id, patient.id);
    const verb = ctx.flow === 'reschedule' ? 'reagendada' : 'agendada';
    return `Listo, ${patient.name}. Su cita de ${appointment.service ?? ctx.service_name} quedo ${verb} para el ${formatSlot(slot)} en ${clinic.name}. ¡Lo/La esperamos!`;
  } catch (error) {
    if (isSlotTakenError(error)) {
      const reply = await offerSlots(
        clinic, patient, ctx, slot.date,
        ctx.flow === 'reschedule' ? 'awaiting_reschedule_slot' : 'awaiting_slot',
      );
      return `Que pena, ese horario acaba de ser ocupado. ${reply}`;
    }
    throw error;
  }
}

export async function continueSession(params: {
  session: ConversationSession;
  message: string;
  clinic: Clinic;
  patient: Patient;
  services: ClinicService[];
}): Promise<{ handled: boolean; reply?: string }> {
  const { session, message, clinic, patient, services } = params;
  const ctx = session.context ?? {};

  // En awaiting_reminder_reply NO se aplica escape: "cancelar" ahi significa
  // cancelar la cita en si -> debe caer al clasificador (handled: false abajo).
  if (session.state !== 'awaiting_reminder_reply' && isEscapeMessage(message)) {
    await clearSession(clinic.id, patient.id);
    return {
      handled: true,
      reply: `De acuerdo, no hay problema. Quedo atento/a si necesita algo mas de ${clinic.name}.`,
    };
  }

  switch (session.state as SessionState) {
    case 'awaiting_service': {
      const offered = ctx.offered_services ?? [];
      const choice = parseNumericChoice(message, offered.length);
      const active = services.filter((s) => s.active);
      const service = choice
        ? active.find((s) => s.name === offered[choice - 1]) ?? null
        : matchService(message, active);
      if (!service) return { handled: false };
      return {
        handled: true,
        reply: await offerSlots(clinic, patient, {
          flow: ctx.flow ?? 'schedule',
          service_name: service.name,
          duration_minutes: service.duration_minutes,
          appointment_id: ctx.appointment_id,
        }),
      };
    }

    case 'awaiting_slot':
    case 'awaiting_reschedule_slot': {
      const slotState = session.state as 'awaiting_slot' | 'awaiting_reschedule_slot';
      const offered = ctx.offered_slots ?? [];
      const choice = parseNumericChoice(message, offered.length);
      if (choice) {
        const slot = offered[choice - 1];
        if (!patient.name) {
          await setSession(clinic.id, patient.id, 'awaiting_name', { ...ctx, chosen_slot: slot });
          return { handled: true, reply: 'Perfecto. ¿A nombre de quien agendamos la cita? Por favor escriba su nombre completo.' };
        }
        return { handled: true, reply: await finalizeAppointment(clinic, patient, ctx, slot) };
      }
      // Respuesta libre: intentar extraer una fecha nueva con el clasificador.
      const classification = await classifyIntent(message, { clinicName: clinic.name });
      if (classification.entities.date) {
        return {
          handled: true,
          reply: await offerSlots(clinic, patient, ctx, classification.entities.date, slotState),
        };
      }
      return { handled: false };
    }

    case 'awaiting_name': {
      const name = message.trim();
      if (name.length < 2 || name.length > 80 || /\d{4,}/.test(name)) {
        return { handled: true, reply: 'Por favor indiquenos su nombre completo para agendar la cita.' };
      }
      const updated = await updatePatient(patient.id, { name });
      if (!ctx.chosen_slot) {
        await clearSession(clinic.id, patient.id);
        return { handled: false };
      }
      return { handled: true, reply: await finalizeAppointment(clinic, updated, ctx, ctx.chosen_slot) };
    }

    case 'awaiting_reminder_reply': {
      if (message.trim() === '1' && ctx.appointment_id) {
        await updateAppointmentStatus(ctx.appointment_id, 'confirmed');
        await clearSession(clinic.id, patient.id);
        return { handled: true, reply: `Gracias por confirmar, ${patient.name}. Nos vemos en su cita en ${clinic.name}.` };
      }
      if (message.trim() === '2') {
        await clearSession(clinic.id, patient.id);
        return { handled: true, reply: await startRescheduleFlow(clinic, patient, {}) };
      }
      return { handled: false };
    }

    default:
      return { handled: false };
  }
}
