import { TZDate } from '@date-fns/tz';
import {
  differenceInHours,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { supabaseAdmin as getSupabase } from '@/lib/db/supabase';
import { setSession } from '@/lib/db/sessions';
import { sendBusinessMessage } from '@/lib/whatsapp/templates';
import type { BusinessMessageType } from '@/lib/whatsapp/templates';
import type {
  Appointment,
  Clinic,
  Patient,
  ReminderType,
} from '@/types';

const TIMEZONE = 'America/Bogota';

/**
 * Generates a reminder message in Colombian Spanish using "usted" form.
 */
export function generateReminderMessage(
  type: ReminderType,
  appointment: Appointment,
  clinic: Clinic,
  patient: Patient,
): string {
  const appointmentDate = TZDate.tz(
    TIMEZONE,
    `${appointment.date}T${appointment.start_time}:00`,
  );

  const formattedDate = format(appointmentDate, "EEEE d 'de' MMMM", {
    locale: es,
  });
  const formattedTime = format(appointmentDate, 'h:mm a', { locale: es });

  switch (type) {
    case '48h':
      return (
        `Hola ${patient.name}, le recordamos que tiene una cita en ${clinic.name} ` +
        `el ${formattedDate} a las ${formattedTime}. ` +
        `Responda 1 para confirmar o 2 para reagendar.`
      );

    case '24h':
      return (
        `Hola ${patient.name}, mañana tiene su cita en ${clinic.name} ` +
        `a las ${formattedTime}. ` +
        `¿Nos confirma su asistencia? Responda 1 para confirmar.`
      );

    case '2h':
      return (
        `${patient.name}, su cita en ${clinic.name} es en 2 horas ` +
        `(${formattedTime}). ¡Lo/La esperamos!`
      );
  }
}

/**
 * Processes all pending reminders.
 *
 * For each scheduled/confirmed appointment it checks whether 48h, 24h, or 2h
 * reminders are due and sends the appropriate WhatsApp message.
 *
 * Returns a summary with the count of reminders sent per type.
 */
export async function processReminders(): Promise<{
  sent48h: number;
  sent24h: number;
  sent2h: number;
  errors: number;
}> {
  const supabase = getSupabase();
  const now = TZDate.tz(TIMEZONE);

  const summary = { sent48h: 0, sent24h: 0, sent2h: 0, errors: 0 };

  // Fetch upcoming appointments that still need reminders
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*')
    .in('status', ['scheduled', 'confirmed'])
    .or(
      'reminder_48h_sent.eq.false,reminder_24h_sent.eq.false,reminder_2h_sent.eq.false',
    )
    .gte('date', format(now, 'yyyy-MM-dd'))
    .order('date', { ascending: true });

  if (appointmentsError) {
    throw new Error(`Failed to fetch appointments: ${appointmentsError.message}`);
  }

  if (!appointments || appointments.length === 0) {
    return summary;
  }

  // Collect unique clinic and patient IDs to batch-fetch
  const clinicIds = [...new Set(appointments.map((a: Appointment) => a.clinic_id))];
  const patientIds = [...new Set(appointments.map((a: Appointment) => a.patient_id))];

  const [{ data: clinics }, { data: patients }] = await Promise.all([
    supabase.from('clinics').select('*').in('id', clinicIds),
    supabase.from('patients').select('*').in('id', patientIds),
  ]);

  const clinicMap = new Map((clinics ?? []).map((c: Clinic) => [c.id, c]));
  const patientMap = new Map((patients ?? []).map((p: Patient) => [p.id, p]));

  for (const appointment of appointments as Appointment[]) {
    const clinic = clinicMap.get(appointment.clinic_id);
    const patient = patientMap.get(appointment.patient_id);

    if (!clinic || !patient) {
      continue;
    }

    const appointmentDateTime = TZDate.tz(
      TIMEZONE,
      `${appointment.date}T${appointment.start_time}:00`,
    );

    const hoursUntil = differenceInHours(appointmentDateTime, now);

    // Determine which reminders to send
    const remindersToSend: { type: ReminderType; flag: keyof Appointment }[] = [];

    if (!appointment.reminder_48h_sent && hoursUntil <= 48 && hoursUntil > 24) {
      remindersToSend.push({ type: '48h', flag: 'reminder_48h_sent' });
    }
    if (!appointment.reminder_24h_sent && hoursUntil <= 24 && hoursUntil > 2) {
      remindersToSend.push({ type: '24h', flag: 'reminder_24h_sent' });
    }
    if (!appointment.reminder_2h_sent && hoursUntil <= 2 && hoursUntil > 0) {
      remindersToSend.push({ type: '2h', flag: 'reminder_2h_sent' });
    }

    for (const reminder of remindersToSend) {
      // Atomic claim: only proceed if the flag was still false. This prevents
      // duplicate sends when the cron overlaps with a concurrent run.
      const { data: claimed, error: claimError } = await supabase
        .from('appointments')
        .update({ [reminder.flag]: true })
        .eq('id', appointment.id)
        .eq(reminder.flag, false)
        .select('id');

      if (claimError || !claimed || claimed.length === 0) {
        continue;
      }

      try {
        const message = generateReminderMessage(
          reminder.type,
          appointment,
          clinic,
          patient,
        );

        const templateType = ('reminder_' + reminder.type) as BusinessMessageType;
        await sendBusinessMessage({
          type: templateType,
          to: patient.phone,
          from: clinic.whatsapp_number,
          variables: {
            '1': patient.name,
            '2': clinic.name,
            '3': format(appointmentDateTime, "EEEE d 'de' MMMM", { locale: es }),
            '4': format(appointmentDateTime, 'h:mm a', { locale: es }),
          },
          fallbackText: message,
        });

        if (reminder.type === '48h' || reminder.type === '24h') {
          // La respuesta "1"/"2" del paciente se interpreta contra esta sesion.
          // Se envuelve en su propio try/catch: el recordatorio YA se envio,
          // asi que un fallo aqui no debe revertir el claim ni marcar el
          // recordatorio como fallido (eso duplicaria el envio en el proximo
          // cron run).
          try {
            await setSession(
              appointment.clinic_id,
              appointment.patient_id,
              'awaiting_reminder_reply',
              { appointment_id: appointment.id },
              24 * 60,
            );
          } catch (sessionErr) {
            console.error(
              `Failed to set awaiting_reminder_reply session for appointment ${appointment.id}:`,
              sessionErr,
            );
          }
        }

        // Log the reminder
        await supabase.from('reminder_logs').insert({
          appointment_id: appointment.id,
          type: reminder.type,
          sent_at: new Date().toISOString(),
          status: 'sent',
        });

        switch (reminder.type) {
          case '48h':
            summary.sent48h++;
            break;
          case '24h':
            summary.sent24h++;
            break;
          case '2h':
            summary.sent2h++;
            break;
        }
      } catch (err) {
        console.error(
          `Failed to send ${reminder.type} reminder for appointment ${appointment.id}:`,
          err,
        );

        // Revert the claim so the next cron run retries the send.
        await supabase
          .from('appointments')
          .update({ [reminder.flag]: false })
          .eq('id', appointment.id);

        // Log the failed attempt
        await supabase.from('reminder_logs').insert({
          appointment_id: appointment.id,
          type: reminder.type,
          sent_at: new Date().toISOString(),
          status: 'failed',
        });

        summary.errors++;
      }
    }
  }

  return summary;
}
