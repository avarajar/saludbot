import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock twilio SDK — vi.mock factories are hoisted, so we cannot reference
// variables declared outside. Use vi.hoisted() to create the mocks.
const { mockMessagesCreate, mockValidateRequest } = vi.hoisted(() => {
  return {
    mockMessagesCreate: vi.fn(),
    mockValidateRequest: vi.fn(),
  };
});

vi.mock('twilio', () => {
  const twilioFn = vi.fn(() => ({
    messages: { create: mockMessagesCreate },
  }));
  (twilioFn as unknown as Record<string, unknown>).validateRequest = mockValidateRequest;
  return { default: twilioFn };
});

// Set up env vars before importing the module
vi.stubEnv('TWILIO_ACCOUNT_SID', 'AC_test_account_sid');
vi.stubEnv('TWILIO_AUTH_TOKEN', 'test_auth_token_123');
vi.stubEnv('TWILIO_WHATSAPP_NUMBER', '+14155238886');

import { sendMessage, sendTemplateMessage, validateWebhook } from './client';

describe('sendMessage', () => {
  beforeEach(() => {
    mockMessagesCreate.mockReset();
  });

  it('sends a WhatsApp message with correct from/to format', async () => {
    mockMessagesCreate.mockResolvedValueOnce({ sid: 'SM_test_123' });

    const sid = await sendMessage('+573009876543', 'Hola, su cita es manana');

    expect(mockMessagesCreate).toHaveBeenCalledWith({
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+573009876543',
      body: 'Hola, su cita es manana',
    });
    expect(sid).toBe('SM_test_123');
  });

  it('returns the message SID from Twilio', async () => {
    mockMessagesCreate.mockResolvedValueOnce({ sid: 'SM_abc_456' });

    const sid = await sendMessage('+573001112233', 'Test message');

    expect(sid).toBe('SM_abc_456');
  });

  it('propagates errors from Twilio', async () => {
    mockMessagesCreate.mockRejectedValueOnce(new Error('Invalid phone number'));

    await expect(sendMessage('+invalid', 'test')).rejects.toThrow('Invalid phone number');
  });

  it('prepends "whatsapp:" to both from and to numbers', async () => {
    mockMessagesCreate.mockResolvedValueOnce({ sid: 'SM_test' });

    await sendMessage('+573005551234', 'Mensaje');

    const callArgs = mockMessagesCreate.mock.calls[0][0];
    expect(callArgs.from).toMatch(/^whatsapp:\+/);
    expect(callArgs.to).toMatch(/^whatsapp:\+/);
  });
});

describe('sendTemplateMessage', () => {
  beforeEach(() => {
    mockMessagesCreate.mockReset();
  });

  it('sends a template message with contentSid and contentVariables', async () => {
    mockMessagesCreate.mockResolvedValueOnce({ sid: 'SM_template_123' });

    const sid = await sendTemplateMessage(
      '+573009876543',
      'HX_template_sid',
      { '1': 'Maria', '2': '10 de marzo', '3': '10:00 AM' },
    );

    expect(mockMessagesCreate).toHaveBeenCalledWith({
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+573009876543',
      contentSid: 'HX_template_sid',
      contentVariables: JSON.stringify({
        '1': 'Maria',
        '2': '10 de marzo',
        '3': '10:00 AM',
      }),
    });
    expect(sid).toBe('SM_template_123');
  });

  it('serializes content variables as JSON', async () => {
    mockMessagesCreate.mockResolvedValueOnce({ sid: 'SM_test' });

    await sendTemplateMessage('+573001112233', 'HX_tmpl', { name: 'Carlos' });

    const callArgs = mockMessagesCreate.mock.calls[0][0];
    expect(callArgs.contentVariables).toBe('{"name":"Carlos"}');
  });
});

describe('validateWebhook', () => {
  beforeEach(() => {
    mockValidateRequest.mockReset();
  });

  it('returns true for a valid Twilio signature', () => {
    mockValidateRequest.mockReturnValueOnce(true);

    const isValid = validateWebhook(
      'valid-signature',
      'https://example.com/api/webhooks/whatsapp',
      { Body: 'Hello', From: '+573009876543' },
    );

    expect(isValid).toBe(true);
    expect(mockValidateRequest).toHaveBeenCalledWith(
      'test_auth_token_123',
      'valid-signature',
      'https://example.com/api/webhooks/whatsapp',
      { Body: 'Hello', From: '+573009876543' },
    );
  });

  it('returns false for an invalid Twilio signature', () => {
    mockValidateRequest.mockReturnValueOnce(false);

    const isValid = validateWebhook(
      'invalid-signature',
      'https://example.com/api/webhooks/whatsapp',
      { Body: 'Hello' },
    );

    expect(isValid).toBe(false);
  });

  it('passes the auth token from environment to validateRequest', () => {
    mockValidateRequest.mockReturnValueOnce(true);

    validateWebhook('sig', 'https://example.com', {});

    expect(mockValidateRequest).toHaveBeenCalledWith(
      'test_auth_token_123',
      'sig',
      'https://example.com',
      {},
    );
  });
});
