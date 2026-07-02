import type { Clinic, Patient, ClinicService, Appointment, BusinessHours } from '@/types';
import {
  getClinicServices,
  getUpcomingAppointment,
  updateAppointmentStatus,
} from '@/lib/db/queries';
import { sendMessage } from '@/lib/whatsapp/client';
import { generateResponse } from '@/lib/ai/responder';
import { startScheduleFlow, startRescheduleFlow } from './flow';

// ── Schedule ────────────────────────────────────────────────────────────────

export async function handleSchedule(
  clinic: Clinic,
  patient: Patient,
  entities: Record<string, string>,
  services: ClinicService[],
): Promise<string> {
  try {
    return await startScheduleFlow(clinic, patient, entities, services);
  } catch (error) {
    console.error('Error handling schedule:', error);
    return `Con mucho gusto le ayudo a agendar su cita en ${clinic.name}. En este momento no puedo consultar la disponibilidad, por favor intentelo de nuevo en unos minutos.`;
  }
}

// ── Confirm ─────────────────────────────────────────────────────────────────

export async function handleConfirm(
  clinic: Clinic,
  patient: Patient,
  entities: Record<string, string>,
): Promise<string> {
  try {
    const appointment = await getUpcomingAppointment(clinic.id, patient.id);

    if (!appointment) {
      return await generateResponse('other', {
        clinicName: clinic.name,
        patientName: patient.name,
      });
    }

    await updateAppointmentStatus(appointment.id, 'confirmed');

    return await generateResponse('confirm', {
      clinicName: clinic.name,
      patientName: patient.name,
      appointmentDetails: {
        date: appointment.date,
        time: appointment.start_time,
        service: appointment.service,
        status: 'confirmed',
      },
    });
  } catch (error) {
    console.error('Error handling confirm:', error);
    return `Gracias por confirmar, ${patient.name || ''}. Hemos registrado su confirmacion. Nos vemos pronto en ${clinic.name}.`;
  }
}

// ── Cancel ───────────────────────────────────────────────────────────────────

export async function handleCancel(
  clinic: Clinic,
  patient: Patient,
  entities: Record<string, string>,
): Promise<string> {
  try {
    const appointment = await getUpcomingAppointment(clinic.id, patient.id);

    if (!appointment) {
      return await generateResponse('other', {
        clinicName: clinic.name,
        patientName: patient.name,
      });
    }

    await updateAppointmentStatus(appointment.id, 'cancelled');

    return await generateResponse('cancel', {
      clinicName: clinic.name,
      patientName: patient.name,
      appointmentDetails: {
        date: appointment.date,
        time: appointment.start_time,
        service: appointment.service,
        status: 'cancelled',
      },
    });
  } catch (error) {
    console.error('Error handling cancel:', error);
    return `Hemos cancelado su cita. Si desea reagendar, con mucho gusto le ayudamos. Escribanos cuando guste.`;
  }
}

// ── Reschedule ──────────────────────────────────────────────────────────────

export async function handleReschedule(
  clinic: Clinic,
  patient: Patient,
  entities: Record<string, string>,
): Promise<string> {
  try {
    return await startRescheduleFlow(clinic, patient, entities);
  } catch (error) {
    console.error('Error handling reschedule:', error);
    return `Que pena, en este momento no puedo consultar los horarios disponibles. Por favor intentelo de nuevo en unos minutos o comuniquese con ${clinic.name}.`;
  }
}

// ── Info: Services ──────────────────────────────────────────────────────────

export async function handleInfoServices(clinic: Clinic): Promise<string> {
  try {
    const services = await getClinicServices(clinic.id);

    const serviceList = services
      .filter((s) => s.active)
      .map((s) =>
        s.price
          ? `${s.name} - $${s.price.toLocaleString('es-CO')}`
          : s.name,
      );

    return await generateResponse('info_services', {
      clinicName: clinic.name,
      services: serviceList,
    });
  } catch (error) {
    console.error('Error handling info_services:', error);
    return `En ${clinic.name} contamos con varios servicios. Para mas informacion, por favor comuniquese con nosotros directamente.`;
  }
}

// ── Info: Hours ─────────────────────────────────────────────────────────────

const DAY_NAMES: Record<keyof BusinessHours, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miercoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sabado',
  sunday: 'Domingo',
};

function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr || '00';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute} ${suffix}`;
}

function formatBusinessHours(hours: BusinessHours): string {
  const days = Object.keys(DAY_NAMES) as (keyof BusinessHours)[];
  const lines: string[] = [];

  for (const day of days) {
    const dayHours = hours[day];
    const label = DAY_NAMES[day];
    if (dayHours) {
      lines.push(`${label}: ${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}`);
    } else {
      lines.push(`${label}: Cerrado`);
    }
  }

  return lines.join('\n');
}

export async function handleInfoHours(clinic: Clinic): Promise<string> {
  try {
    const hoursText = formatBusinessHours(clinic.business_hours);

    return await generateResponse('info_hours', {
      clinicName: clinic.name,
      clinicAddress: clinic.address,
      clinicHours: hoursText,
    });
  } catch (error) {
    console.error('Error handling info_hours:', error);
    return `${clinic.name} - Comuniquese con nosotros para conocer nuestro horario de atencion.`;
  }
}

// ── Greeting ────────────────────────────────────────────────────────────────

export async function handleGreeting(
  clinic: Clinic,
  patient: Patient,
): Promise<string> {
  try {
    const services = await getClinicServices(clinic.id);

    return await generateResponse('greeting', {
      clinicName: clinic.name,
      patientName: patient.name,
      services: services
        .filter((s) => s.active)
        .map((s) => s.name)
        .slice(0, 5),
    });
  } catch (error) {
    console.error('Error handling greeting:', error);
    return `Bienvenido/a a ${clinic.name}. ¿En que le podemos ayudar hoy? Puede agendar una cita, consultar servicios o preguntar por nuestros horarios.`;
  }
}

// ── Escalate ────────────────────────────────────────────────────────────────

export async function handleEscalate(
  clinic: Clinic,
  patient: Patient,
  message: string,
): Promise<string> {
  try {
    // Notify the clinic owner via WhatsApp
    const ownerNotification = `Atencion ${clinic.owner_name}: El paciente ${patient.name || patient.phone} solicita atencion directa.\n\nMensaje: "${message}"\n\nTelefono: ${patient.phone}`;

    await sendMessage(clinic.phone, ownerNotification, clinic.whatsapp_number);

    return await generateResponse('escalate', {
      clinicName: clinic.name,
      patientName: patient.name,
      ownerName: clinic.owner_name,
    });
  } catch (error) {
    console.error('Error handling escalate:', error);
    return `Entendemos su solicitud. Un miembro de nuestro equipo en ${clinic.name} se comunicara con usted a la mayor brevedad. Gracias por su paciencia.`;
  }
}
