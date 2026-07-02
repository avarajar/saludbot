import { TZDate } from '@date-fns/tz';
import { format, subDays } from 'date-fns';
import { sendBusinessMessage } from '@/lib/whatsapp/templates';
import {
  getCompletedAppointmentsForDate, getRecallServices, getPatientsDueForRecall,
  insertFollowupLog, markFollowupFailed, updatePatientLastVisit,
  getClinicsByIds, getPatientsByIds,
} from './followup-queries';

const TIMEZONE = 'America/Bogota';

export async function processFollowups(): Promise<{
  postVisitSent: number;
  recallSent: number;
  errors: number;
}> {
  const summary = { postVisitSent: 0, recallSent: 0, errors: 0 };

  // ── Post-visita: citas completadas de ayer ─────────────────────────────
  const yesterday = format(subDays(TZDate.tz(TIMEZONE), 1), 'yyyy-MM-dd');
  const completed = await getCompletedAppointmentsForDate(yesterday);

  if (completed.length > 0) {
    const clinics = await getClinicsByIds([...new Set(completed.map((a) => a.clinic_id))]);
    const patients = await getPatientsByIds([...new Set(completed.map((a) => a.patient_id))]);
    const clinicMap = new Map(clinics.map((c) => [c.id, c]));
    const patientMap = new Map(patients.map((p) => [p.id, p]));

    for (const appointment of completed) {
      const clinic = clinicMap.get(appointment.clinic_id);
      const patient = patientMap.get(appointment.patient_id);
      if (!clinic || !patient) continue;

      // Claim por índice único: un solo post_visit por cita.
      const { duplicate } = await insertFollowupLog({
        clinic_id: clinic.id, patient_id: patient.id,
        appointment_id: appointment.id, type: 'post_visit',
      });
      if (duplicate) continue;

      try {
        await sendBusinessMessage({
          type: 'post_visit',
          to: patient.phone,
          from: clinic.whatsapp_number,
          variables: { '1': patient.name, '2': clinic.name },
          fallbackText: `Hola ${patient.name}, gracias por su visita a ${clinic.name}. ¿Como le fue? Su opinion nos ayuda a mejorar.`,
        });
        await updatePatientLastVisit(patient.id, new Date().toISOString());
        summary.postVisitSent++;
      } catch (err) {
        console.error(`Post-visit followup failed for appointment ${appointment.id}:`, err);
        await markFollowupFailed(appointment.id, patient.id, 'post_visit');
        summary.errors++;
      }
    }
  }

  // ── Recall por servicio ────────────────────────────────────────────────
  const services = await getRecallServices();
  for (const service of services) {
    const due = await getPatientsDueForRecall(service);
    if (due.length === 0) continue;
    const [clinic] = await getClinicsByIds([service.clinic_id]);
    if (!clinic) continue;

    for (const patient of due) {
      const { duplicate } = await insertFollowupLog({
        clinic_id: clinic.id, patient_id: patient.id,
        service_id: service.id, type: 'recall',
      });
      if (duplicate) continue;

      try {
        await sendBusinessMessage({
          type: 'recall',
          to: patient.phone,
          from: clinic.whatsapp_number,
          variables: { '1': patient.name, '2': clinic.name, '3': service.name },
          fallbackText: `Hola ${patient.name}, en ${clinic.name} le recordamos que ya es momento de su proximo ${service.name}. Responda este mensaje y le agendamos con gusto.`,
        });
        summary.recallSent++;
      } catch (err) {
        console.error(`Recall followup failed for patient ${patient.id}:`, err);
        await markFollowupFailed(null, patient.id, 'recall');
        summary.errors++;
      }
    }
  }

  return summary;
}
