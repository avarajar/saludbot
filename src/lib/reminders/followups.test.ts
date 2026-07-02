import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/whatsapp/templates', () => ({
  sendBusinessMessage: vi.fn().mockResolvedValue('SM_1'),
}));

vi.mock('./followup-queries', () => ({
  getCompletedAppointmentsForDate: vi.fn(),
  getRecallServices: vi.fn(),
  getPatientsDueForRecall: vi.fn(),
  insertFollowupLog: vi.fn(),
  markFollowupFailed: vi.fn(),
  updatePatientLastVisit: vi.fn(),
  getClinicsByIds: vi.fn(),
  getPatientsByIds: vi.fn(),
}));

import { processFollowups } from './followups';
import { sendBusinessMessage } from '@/lib/whatsapp/templates';
import * as fq from './followup-queries';

const clinic = { id: 'c1', name: 'Clinica X', whatsapp_number: '+5730012', timezone: 'America/Bogota' };
const patient = { id: 'p1', clinic_id: 'c1', name: 'Maria', phone: '+5730098' };

describe('processFollowups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fq.getClinicsByIds).mockResolvedValue([clinic] as never);
    vi.mocked(fq.getPatientsByIds).mockResolvedValue([patient] as never);
    vi.mocked(fq.getRecallServices).mockResolvedValue([]);
    vi.mocked(fq.getCompletedAppointmentsForDate).mockResolvedValue([]);
    vi.mocked(sendBusinessMessage).mockResolvedValue('SM_1');
  });

  it('envia post-visita por cada cita completada de ayer y actualiza last_visit_at', async () => {
    vi.mocked(fq.getCompletedAppointmentsForDate).mockResolvedValue([
      { id: 'a1', clinic_id: 'c1', patient_id: 'p1', service: 'Limpieza dental', date: '2026-06-30' },
    ] as never);
    vi.mocked(fq.insertFollowupLog).mockResolvedValue({ duplicate: false });

    const result = await processFollowups();
    expect(result.postVisitSent).toBe(1);
    expect(sendBusinessMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'post_visit', to: '+5730098' }));
    expect(fq.updatePatientLastVisit).toHaveBeenCalledWith('p1', expect.any(String));
  });

  it('no repite post-visita si ya hay log (duplicate)', async () => {
    vi.mocked(fq.getCompletedAppointmentsForDate).mockResolvedValue([
      { id: 'a1', clinic_id: 'c1', patient_id: 'p1', service: 'Limpieza dental', date: '2026-06-30' },
    ] as never);
    vi.mocked(fq.insertFollowupLog).mockResolvedValue({ duplicate: true });

    const result = await processFollowups();
    expect(result.postVisitSent).toBe(0);
    expect(sendBusinessMessage).not.toHaveBeenCalled();
  });

  it('envia recall a pacientes vencidos y lo registra', async () => {
    vi.mocked(fq.getRecallServices).mockResolvedValue([
      { id: 's1', clinic_id: 'c1', name: 'Limpieza dental', follow_up_days: 180 },
    ] as never);
    vi.mocked(fq.getPatientsDueForRecall).mockResolvedValue([patient] as never);
    vi.mocked(fq.insertFollowupLog).mockResolvedValue({ duplicate: false });

    const result = await processFollowups();
    expect(result.recallSent).toBe(1);
    expect(sendBusinessMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'recall' }));
  });

  it('no repite recall si ya hay log (duplicate)', async () => {
    vi.mocked(fq.getRecallServices).mockResolvedValue([
      { id: 's1', clinic_id: 'c1', name: 'Limpieza dental', follow_up_days: 180 },
    ] as never);
    vi.mocked(fq.getPatientsDueForRecall).mockResolvedValue([patient] as never);
    vi.mocked(fq.insertFollowupLog).mockResolvedValue({ duplicate: true });

    const result = await processFollowups();
    expect(result.recallSent).toBe(0);
    expect(sendBusinessMessage).not.toHaveBeenCalled();
  });

  it('marca como fallido y cuenta error si el envio post-visita falla, sin lanzar', async () => {
    vi.mocked(fq.getCompletedAppointmentsForDate).mockResolvedValue([
      { id: 'a1', clinic_id: 'c1', patient_id: 'p1', service: 'Limpieza dental', date: '2026-06-30' },
    ] as never);
    vi.mocked(fq.insertFollowupLog).mockResolvedValue({ duplicate: false, id: 'log-a1' });
    vi.mocked(sendBusinessMessage).mockRejectedValueOnce(new Error('Twilio error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await processFollowups();

    expect(result.postVisitSent).toBe(0);
    expect(result.errors).toBe(1);
    expect(fq.markFollowupFailed).toHaveBeenCalledWith('log-a1');
    expect(fq.updatePatientLastVisit).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('marca como fallido y cuenta error si el envio de recall falla, sin lanzar', async () => {
    vi.mocked(fq.getRecallServices).mockResolvedValue([
      { id: 's1', clinic_id: 'c1', name: 'Limpieza dental', follow_up_days: 180 },
    ] as never);
    vi.mocked(fq.getPatientsDueForRecall).mockResolvedValue([patient] as never);
    vi.mocked(fq.insertFollowupLog).mockResolvedValue({ duplicate: false, id: 'log-recall-s1' });
    vi.mocked(sendBusinessMessage).mockRejectedValueOnce(new Error('Twilio error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await processFollowups();

    expect(result.recallSent).toBe(0);
    expect(result.errors).toBe(1);
    expect(fq.markFollowupFailed).toHaveBeenCalledWith('log-recall-s1');

    consoleErrorSpy.mockRestore();
  });

  it('un fallo de recall del servicio A solo marca la fila de log de A, no la de otro servicio B', async () => {
    // Dos servicios de recall, cada uno con su propio paciente y su propia fila de log.
    // El fallo de envio para el servicio A no debe tocar la fila de log del servicio B
    // (bug anterior: markFollowupFailed sin logId actualizaba TODAS las filas de recall
    // del paciente, incluyendo servicios que ya habian sido enviados con exito).
    const patientB = { id: 'p2', clinic_id: 'c1', name: 'Carlos', phone: '+5730099' };
    vi.mocked(fq.getRecallServices).mockResolvedValue([
      { id: 's1', clinic_id: 'c1', name: 'Limpieza dental', follow_up_days: 180 },
      { id: 's2', clinic_id: 'c1', name: 'Blanqueamiento', follow_up_days: 90 },
    ] as never);
    vi.mocked(fq.getPatientsDueForRecall).mockImplementation((async (service: { id: string }) => {
      return service.id === 's1' ? [patient] : [patientB];
    }) as never);
    vi.mocked(fq.insertFollowupLog).mockImplementation((async (log: { service_id: string }) => {
      return log.service_id === 's1'
        ? { duplicate: false, id: 'log-service-a' }
        : { duplicate: false, id: 'log-service-b' };
    }) as never);
    // El envio del servicio A falla; el del servicio B tiene exito.
    vi.mocked(sendBusinessMessage).mockRejectedValueOnce(new Error('Twilio error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await processFollowups();

    expect(result.recallSent).toBe(1);
    expect(result.errors).toBe(1);
    expect(fq.markFollowupFailed).toHaveBeenCalledTimes(1);
    expect(fq.markFollowupFailed).toHaveBeenCalledWith('log-service-a');
    expect(fq.markFollowupFailed).not.toHaveBeenCalledWith('log-service-b');

    consoleErrorSpy.mockRestore();
  });

  it('si el insert de recall retorna duplicate, no envia mensaje ni incrementa recallSent', async () => {
    vi.mocked(fq.getRecallServices).mockResolvedValue([
      { id: 's1', clinic_id: 'c1', name: 'Limpieza dental', follow_up_days: 180 },
    ] as never);
    vi.mocked(fq.getPatientsDueForRecall).mockResolvedValue([patient] as never);
    // Simula la carrera cerrada por el indice unico parcial: la corrida
    // concurrente ya inserto la fila para el mismo dia-Bogota, esta pierde
    // con 23505 -> insertFollowupLog mapea a duplicate.
    vi.mocked(fq.insertFollowupLog).mockResolvedValue({ duplicate: true });

    const result = await processFollowups();

    expect(result.recallSent).toBe(0);
    expect(result.errors).toBe(0);
    expect(sendBusinessMessage).not.toHaveBeenCalled();
    expect(fq.markFollowupFailed).not.toHaveBeenCalled();
  });

  it('omite servicios de recall sin pacientes vencidos', async () => {
    vi.mocked(fq.getRecallServices).mockResolvedValue([
      { id: 's1', clinic_id: 'c1', name: 'Limpieza dental', follow_up_days: 180 },
    ] as never);
    vi.mocked(fq.getPatientsDueForRecall).mockResolvedValue([]);

    const result = await processFollowups();

    expect(result.recallSent).toBe(0);
    expect(fq.insertFollowupLog).not.toHaveBeenCalled();
  });

  it('omite citas cuando falta la clinica o el paciente', async () => {
    vi.mocked(fq.getCompletedAppointmentsForDate).mockResolvedValue([
      { id: 'a1', clinic_id: 'unknown', patient_id: 'p1', service: 'Limpieza dental', date: '2026-06-30' },
    ] as never);

    const result = await processFollowups();

    expect(result.postVisitSent).toBe(0);
    expect(fq.insertFollowupLog).not.toHaveBeenCalled();
  });
});
