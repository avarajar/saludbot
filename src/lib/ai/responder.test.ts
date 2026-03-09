import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

import { generateResponse, type ResponseContext } from './responder';

function anthropicResponse(text: string) {
  return {
    content: [{ type: 'text', text }],
  };
}

const baseContext: ResponseContext = {
  clinicName: 'Clinica Dental Sonrisa',
  patientName: 'Maria Lopez',
};

describe('generateResponse', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('generates a response for a greeting intent', async () => {
    const responseText =
      'Hola Maria Lopez, bienvenida a Clinica Dental Sonrisa. ¿En que le podemos ayudar?';

    mockCreate.mockResolvedValueOnce(anthropicResponse(responseText));

    const result = await generateResponse('greeting', baseContext);

    expect(result).toBe(responseText);
  });

  it('generates a response for a schedule intent with available slots', async () => {
    const responseText =
      'Con mucho gusto le agendo su cita. Tenemos disponibilidad el lunes 10 de marzo a las 10:00 AM.';

    mockCreate.mockResolvedValueOnce(anthropicResponse(responseText));

    const result = await generateResponse('schedule', {
      ...baseContext,
      availableSlots: ['2026-03-10 a las 10:00', '2026-03-10 a las 14:00'],
      services: ['Limpieza dental ($80.000)', 'Blanqueamiento ($250.000)'],
    });

    expect(result).toBe(responseText);
  });

  it('generates a response for a confirm intent with appointment details', async () => {
    const responseText =
      'Perfecto, su cita queda confirmada para el lunes 10 de marzo a las 10:00 AM. La esperamos.';

    mockCreate.mockResolvedValueOnce(anthropicResponse(responseText));

    const result = await generateResponse('confirm', {
      ...baseContext,
      appointmentDetails: {
        date: '2026-03-10',
        time: '10:00',
        service: 'Limpieza dental',
        status: 'confirmed',
      },
    });

    expect(result).toBe(responseText);
  });

  it('generates a response for a cancel intent', async () => {
    const responseText =
      'Su cita ha sido cancelada. Si desea reagendar, con mucho gusto le ayudamos.';

    mockCreate.mockResolvedValueOnce(anthropicResponse(responseText));

    const result = await generateResponse('cancel', {
      ...baseContext,
      appointmentDetails: {
        date: '2026-03-10',
        time: '10:00',
        service: 'Limpieza dental',
        status: 'cancelled',
      },
    });

    expect(result).toBe(responseText);
  });

  it('generates a response for an escalate intent', async () => {
    const responseText =
      'Entiendo. Un miembro de nuestro equipo se comunicara con usted lo antes posible.';

    mockCreate.mockResolvedValueOnce(anthropicResponse(responseText));

    const result = await generateResponse('escalate', baseContext);

    expect(result).toBe(responseText);
  });

  it('generates a response for info_services', async () => {
    const responseText =
      'En Clinica Dental Sonrisa ofrecemos: Limpieza, Blanqueamiento, Ortodoncia.';

    mockCreate.mockResolvedValueOnce(anthropicResponse(responseText));

    const result = await generateResponse('info_services', {
      ...baseContext,
      services: ['Limpieza', 'Blanqueamiento', 'Ortodoncia'],
    });

    expect(result).toBe(responseText);
  });

  it('generates a response for info_hours', async () => {
    const responseText =
      'Nuestro horario es Lunes a Viernes de 8:00 AM a 6:00 PM.';

    mockCreate.mockResolvedValueOnce(anthropicResponse(responseText));

    const result = await generateResponse('info_hours', {
      ...baseContext,
      clinicHours: 'Lunes a Viernes 8:00 AM - 6:00 PM',
    });

    expect(result).toBe(responseText);
  });

  it('generates a response for info_location', async () => {
    const responseText = 'Estamos ubicados en Calle 80 #45-23, Bogota.';

    mockCreate.mockResolvedValueOnce(anthropicResponse(responseText));

    const result = await generateResponse('info_location', {
      ...baseContext,
      clinicAddress: 'Calle 80 #45-23, Bogota',
    });

    expect(result).toBe(responseText);
  });

  it('trims whitespace from the response', async () => {
    mockCreate.mockResolvedValueOnce(
      anthropicResponse('  Hola Maria.  '),
    );

    const result = await generateResponse('greeting', baseContext);

    expect(result).toBe('Hola Maria.');
  });

  it('returns a graceful fallback message on API error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));

    const result = await generateResponse('greeting', baseContext);

    expect(result).toContain('dificultades tecnicas');
    expect(result).toContain('Clinica Dental Sonrisa');
  });

  it('includes patient name in the fallback message when available', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));

    const result = await generateResponse('greeting', baseContext);

    expect(result).toContain('Maria Lopez');
  });

  it('returns a fallback without patient name when not provided', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));

    const result = await generateResponse('greeting', {
      clinicName: 'Clinica Dental Sonrisa',
    });

    expect(result).toContain('Hola');
    expect(result).toContain('Clinica Dental Sonrisa');
    expect(result).not.toContain('undefined');
  });

  it('handles unknown intent by falling back to "other" behavior', async () => {
    const responseText = 'Disculpe, no entendi. ¿En que le puedo ayudar?';

    mockCreate.mockResolvedValueOnce(anthropicResponse(responseText));

    const result = await generateResponse('unknown_intent', baseContext);

    expect(result).toBe(responseText);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('passes clinic and patient context in the system prompt', async () => {
    mockCreate.mockResolvedValueOnce(anthropicResponse('Hola'));

    await generateResponse('greeting', {
      clinicName: 'Mi Clinica',
      patientName: 'Juan',
      services: ['Consulta'],
      clinicAddress: 'Calle 10',
      clinicHours: '8 AM - 5 PM',
    });

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain('Mi Clinica');
    expect(callArgs.system).toContain('Juan');
    expect(callArgs.system).toContain('Consulta');
    expect(callArgs.system).toContain('Calle 10');
    expect(callArgs.system).toContain('8 AM - 5 PM');
  });

  it('includes the intent description in the user message', async () => {
    mockCreate.mockResolvedValueOnce(anthropicResponse('Respuesta'));

    await generateResponse('schedule', baseContext);

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages[0].content;
    expect(userMessage).toContain('schedule');
    expect(userMessage).toContain('agendar');
  });
});
