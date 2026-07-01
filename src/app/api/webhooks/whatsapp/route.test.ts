import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getClinicByPhone: vi.fn(),
  getPatientByPhone: vi.fn(),
  createPatient: vi.fn(),
  updatePatient: vi.fn(),
  getClinicServices: vi.fn().mockResolvedValue([]),
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

import { POST } from './route';
import {
  getClinicByPhone,
  getPatientByPhone,
  insertInboundConversation,
  updateConversationIntent,
} from '@/lib/db/queries';
import { classifyIntent } from '@/lib/ai/classifier';
import { sendMessage, validateWebhook } from '@/lib/whatsapp/client';

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
    vi.mocked(getClinicByPhone).mockResolvedValue(clinic as never);
    vi.mocked(getPatientByPhone).mockResolvedValue(patient as never);
    vi.mocked(insertInboundConversation).mockResolvedValue({ conversation: { id: 'conv1' } as never, duplicate: false });
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
});
