import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getClinicByPhone: vi.fn(),
  getPatientByPhone: vi.fn(),
  createPatient: vi.fn(),
  updatePatient: vi.fn(),
  getClinicServices: vi.fn().mockResolvedValue([]),
  getRecentConversations: vi.fn().mockResolvedValue([]),
  logConversation: vi.fn(),
  insertInboundConversation: vi.fn(),
  updateConversationIntent: vi.fn(),
}));
vi.mock('@/lib/whatsapp/client', () => ({
  sendMessage: vi.fn().mockResolvedValue('SM_out'),
  validateWebhook: vi.fn().mockReturnValue(true),
}));
vi.mock('@/lib/ai/classifier', () => ({ classifyIntent: vi.fn() }));
vi.mock('@/lib/ai/responder', () => ({ generateResponse: vi.fn() }));
vi.mock('@/lib/whatsapp/handlers', () => ({
  handleSchedule: vi.fn(),
  handleConfirm: vi.fn(),
  handleCancel: vi.fn(),
  handleReschedule: vi.fn(),
  handleInfoServices: vi.fn(),
  handleInfoHours: vi.fn(),
  handleGreeting: vi.fn(),
  handleEscalate: vi.fn(),
}));
vi.mock('@/lib/db/sessions', () => ({
  getActiveSession: vi.fn().mockResolvedValue(null),
  clearSession: vi.fn(),
}));
vi.mock('@/lib/whatsapp/flow', () => ({
  continueSession: vi.fn(),
}));

import { POST } from './route';
import {
  getClinicByPhone,
  getPatientByPhone,
  insertInboundConversation,
  updateConversationIntent,
  updatePatient,
  logConversation,
  getRecentConversations,
} from '@/lib/db/queries';
import { classifyIntent } from '@/lib/ai/classifier';
import { sendMessage, validateWebhook } from '@/lib/whatsapp/client';
import { handleGreeting, handleInfoHours } from '@/lib/whatsapp/handlers';
import { getActiveSession, clearSession } from '@/lib/db/sessions';
import { continueSession } from '@/lib/whatsapp/flow';

function twilioRequest(overrides: Record<string, string> = {}): NextRequest {
  const form = new URLSearchParams({
    From: 'whatsapp:+573009876543',
    To: 'whatsapp:+573001234567',
    Body: 'Hola',
    MessageSid: 'SM123',
    ...overrides,
  });
  return new NextRequest('https://example.com/api/webhooks/whatsapp', {
    method: 'POST',
    body: form.toString(),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  });
}

const clinic = {
  id: 'c1',
  name: 'Clinica X',
  whatsapp_number: '+573001234567',
  phone: '+573001111111',
  address: 'Calle 1',
  owner_name: 'Dr X',
  business_hours: {},
};
const patient = { id: 'p1', clinic_id: 'c1', name: 'Maria', phone: '+573009876543' };

describe('webhook idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClinicByPhone).mockResolvedValue(clinic as never);
    vi.mocked(getPatientByPhone).mockResolvedValue(patient as never);
    vi.mocked(getActiveSession).mockResolvedValue(null);
    vi.mocked(getRecentConversations).mockResolvedValue([]);
  });

  it('ignora un MessageSid duplicado sin clasificar ni responder', async () => {
    vi.mocked(insertInboundConversation).mockResolvedValue({
      conversation: null,
      duplicate: true,
    });

    const res = await POST(twilioRequest());

    expect(res.status).toBe(200);
    expect(classifyIntent).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('procesa un mensaje nuevo: registra el inbound antes de clasificar y actualiza el intent', async () => {
    const inboundRow = {
      id: 'conv-1',
      clinic_id: 'c1',
      patient_id: 'p1',
      whatsapp_message_id: 'SM123',
      direction: 'inbound' as const,
      message: 'Hola',
      intent: null,
      created_at: '2026-01-01T00:00:00Z',
    };
    vi.mocked(insertInboundConversation).mockResolvedValue({
      conversation: inboundRow,
      duplicate: false,
    });
    vi.mocked(classifyIntent).mockResolvedValue({
      intent: 'greeting',
      entities: {},
    } as never);

    const res = await POST(twilioRequest());

    expect(res.status).toBe(200);
    expect(insertInboundConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        clinic_id: 'c1',
        patient_id: 'p1',
        whatsapp_message_id: 'SM123',
        message: 'Hola',
        intent: null,
      }),
    );
    expect(classifyIntent).toHaveBeenCalled();
    expect(updateConversationIntent).toHaveBeenCalledWith('conv-1', 'greeting');
    expect(sendMessage).toHaveBeenCalled();
  });
});

describe('signature validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateWebhook).mockReturnValue(true);
    vi.mocked(getClinicByPhone).mockResolvedValue(clinic as never);
    vi.mocked(getPatientByPhone).mockResolvedValue(patient as never);
    vi.mocked(insertInboundConversation).mockResolvedValue({ conversation: { id: 'conv1' } as never, duplicate: false });
    vi.mocked(getActiveSession).mockResolvedValue(null);
    vi.mocked(getRecentConversations).mockResolvedValue([]);
  });

  it('en produccion sin TWILIO_WEBHOOK_URL rechaza el mensaje', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TWILIO_WEBHOOK_URL', '');
    const res = await POST(twilioRequest());
    expect(res.status).toBe(200); // TwiML vacío, pero sin procesar
    expect(classifyIntent).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('en produccion con firma invalida rechaza el mensaje', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TWILIO_WEBHOOK_URL', 'https://example.com/api/webhooks/whatsapp');
    vi.mocked(validateWebhook).mockReturnValue(false);
    const res = await POST(twilioRequest());
    expect(classifyIntent).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('en produccion sin header de firma rechaza el mensaje', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TWILIO_WEBHOOK_URL', 'https://example.com/api/webhooks/whatsapp');
    const res = await POST(twilioRequest());
    expect(res.status).toBe(200); // TwiML vacío, pero sin procesar
    expect(classifyIntent).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});

describe('persistencia de nombre y SID saliente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateWebhook).mockReturnValue(true);
    vi.mocked(getClinicByPhone).mockResolvedValue(clinic as never);
    vi.mocked(getPatientByPhone).mockResolvedValue(patient as never);
    vi.mocked(sendMessage).mockResolvedValue('SM_out');
    vi.mocked(getActiveSession).mockResolvedValue(null);
    vi.mocked(getRecentConversations).mockResolvedValue([]);
  });

  it('persiste el nombre extraido cuando el paciente no tiene nombre', async () => {
    vi.mocked(getPatientByPhone).mockResolvedValue({ ...patient, name: '' } as never);
    vi.mocked(insertInboundConversation).mockResolvedValue({ conversation: { id: 'conv1' } as never, duplicate: false });
    vi.mocked(classifyIntent).mockResolvedValue({
      intent: 'greeting', confidence: 0.9,
      entities: { patient_name: 'Carlos Ruiz' },
    } as never);
    vi.mocked(updatePatient).mockResolvedValue({ ...patient, name: 'Carlos Ruiz' } as never);
    vi.mocked(handleGreeting).mockResolvedValue('Bienvenido');

    await POST(twilioRequest());
    expect(updatePatient).toHaveBeenCalledWith('p1', { name: 'Carlos Ruiz' });
  });

  it('guarda el SID del mensaje saliente en el log', async () => {
    vi.mocked(insertInboundConversation).mockResolvedValue({ conversation: { id: 'conv1' } as never, duplicate: false });
    vi.mocked(classifyIntent).mockResolvedValue({ intent: 'greeting', confidence: 0.9, entities: {} } as never);
    vi.mocked(handleGreeting).mockResolvedValue('Bienvenido');

    await POST(twilioRequest());
    expect(logConversation).toHaveBeenCalledWith(
      expect.objectContaining({ direction: 'outbound', whatsapp_message_id: 'SM_out' }),
    );
  });
});

describe('sesiones activas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateWebhook).mockReturnValue(true);
    vi.mocked(getClinicByPhone).mockResolvedValue(clinic as never);
    vi.mocked(getPatientByPhone).mockResolvedValue(patient as never);
    vi.mocked(sendMessage).mockResolvedValue('SM_out');
    vi.mocked(getActiveSession).mockResolvedValue(null);
    vi.mocked(getRecentConversations).mockResolvedValue([]);
  });

  it('con sesion activa, la respuesta se interpreta contra la sesion (no clasifica)', async () => {
    vi.mocked(insertInboundConversation).mockResolvedValue({ conversation: { id: 'conv1' } as never, duplicate: false });
    vi.mocked(getActiveSession).mockResolvedValue({ id: 'ses1', state: 'awaiting_slot', context: {} } as never);
    vi.mocked(continueSession).mockResolvedValue({ handled: true, reply: 'Cita agendada' });

    await POST(twilioRequest({ Body: '1' }));

    expect(continueSession).toHaveBeenCalled();
    expect(classifyIntent).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith('+573009876543', 'Cita agendada', clinic.whatsapp_number);
  });

  it('si la sesion no maneja la respuesta, se limpia y se clasifica normal', async () => {
    vi.mocked(insertInboundConversation).mockResolvedValue({ conversation: { id: 'conv1' } as never, duplicate: false });
    vi.mocked(getActiveSession).mockResolvedValue({ id: 'ses1', state: 'awaiting_slot', context: {} } as never);
    vi.mocked(continueSession).mockResolvedValue({ handled: false });
    vi.mocked(classifyIntent).mockResolvedValue({ intent: 'info_hours', confidence: 0.9, entities: {} });
    vi.mocked(handleInfoHours).mockResolvedValue('Horario: ...');

    await POST(twilioRequest({ Body: 'a que hora abren?' }));

    expect(clearSession).toHaveBeenCalled();
    expect(classifyIntent).toHaveBeenCalled();
  });
});

describe('historial de clasificación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateWebhook).mockReturnValue(true);
    vi.mocked(getClinicByPhone).mockResolvedValue(clinic as never);
    vi.mocked(getPatientByPhone).mockResolvedValue(patient as never);
    vi.mocked(sendMessage).mockResolvedValue('SM_out');
    vi.mocked(getActiveSession).mockResolvedValue(null);
  });

  it('excluye el mensaje actual del historial por id de fila, no por texto', async () => {
    vi.mocked(insertInboundConversation).mockResolvedValue({
      conversation: { id: 'conv1' } as never,
      duplicate: false,
    });
    vi.mocked(getRecentConversations).mockResolvedValue([
      {
        id: 'old-1',
        clinic_id: 'c1',
        patient_id: 'p1',
        whatsapp_message_id: 'SMold',
        direction: 'inbound',
        message: '1',
        intent: null,
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'conv1',
        clinic_id: 'c1',
        patient_id: 'p1',
        whatsapp_message_id: 'SM123',
        direction: 'inbound',
        message: '1',
        intent: null,
        created_at: '2026-01-01T00:00:01Z',
      },
    ] as never);
    vi.mocked(classifyIntent).mockResolvedValue({
      intent: 'greeting',
      entities: {},
    } as never);
    vi.mocked(handleGreeting).mockResolvedValue('Bienvenido');

    await POST(twilioRequest({ Body: '1' }));

    expect(classifyIntent).toHaveBeenCalled();
    const options = vi.mocked(classifyIntent).mock.calls[0][1] as {
      history: { direction: string; message: string }[];
    };
    expect(options.history).toHaveLength(1);
    expect(options.history[0]).toEqual({ direction: 'inbound', message: '1' });
  });
});
