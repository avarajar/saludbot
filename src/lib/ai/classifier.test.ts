import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures these are available in the vi.mock factory
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

import { classifyIntent, type ClassificationResult } from './classifier';

function anthropicResponse(text: string) {
  return {
    content: [{ type: 'text', text }],
  };
}

describe('classifyIntent', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns a valid classification for a scheduling message', async () => {
    const result: ClassificationResult = {
      intent: 'schedule',
      confidence: 0.95,
      entities: { date: '2026-03-10', service_type: 'limpieza dental' },
    };

    mockCreate.mockResolvedValueOnce(anthropicResponse(JSON.stringify(result)));

    const classification = await classifyIntent('Quiero agendar una cita para limpieza dental el 10 de marzo');

    expect(classification.intent).toBe('schedule');
    expect(classification.confidence).toBeGreaterThanOrEqual(0);
    expect(classification.confidence).toBeLessThanOrEqual(1);
    expect(classification.entities).toHaveProperty('date');
    expect(classification.entities).toHaveProperty('service_type');
  });

  it('returns a valid classification for a greeting', async () => {
    mockCreate.mockResolvedValueOnce(
      anthropicResponse(JSON.stringify({
        intent: 'greeting',
        confidence: 0.99,
        entities: {},
      })),
    );

    const classification = await classifyIntent('Hola, buenos dias');

    expect(classification.intent).toBe('greeting');
    expect(classification.confidence).toBe(0.99);
    expect(classification.entities).toEqual({});
  });

  it('returns a valid classification for a confirm intent', async () => {
    mockCreate.mockResolvedValueOnce(
      anthropicResponse(JSON.stringify({
        intent: 'confirm',
        confidence: 0.92,
        entities: {},
      })),
    );

    const classification = await classifyIntent('Si, confirmo mi cita');

    expect(classification.intent).toBe('confirm');
  });

  it('returns a valid classification for a cancel intent', async () => {
    mockCreate.mockResolvedValueOnce(
      anthropicResponse(JSON.stringify({
        intent: 'cancel',
        confidence: 0.88,
        entities: {},
      })),
    );

    const classification = await classifyIntent('Necesito cancelar mi cita');

    expect(classification.intent).toBe('cancel');
  });

  it('falls back to "other" when the API returns an invalid intent', async () => {
    mockCreate.mockResolvedValueOnce(
      anthropicResponse(JSON.stringify({
        intent: 'invalid_intent_xyz',
        confidence: 0.8,
        entities: {},
      })),
    );

    const classification = await classifyIntent('algo raro');

    expect(classification.intent).toBe('other');
  });

  it('clamps confidence to [0, 1] range', async () => {
    mockCreate.mockResolvedValueOnce(
      anthropicResponse(JSON.stringify({
        intent: 'greeting',
        confidence: 5.0,
        entities: {},
      })),
    );

    const classification = await classifyIntent('Hola');

    expect(classification.confidence).toBe(1);
  });

  it('clamps negative confidence to 0', async () => {
    mockCreate.mockResolvedValueOnce(
      anthropicResponse(JSON.stringify({
        intent: 'greeting',
        confidence: -0.5,
        entities: {},
      })),
    );

    const classification = await classifyIntent('Hola');

    expect(classification.confidence).toBe(0);
  });

  it('defaults entities to an empty object when missing', async () => {
    mockCreate.mockResolvedValueOnce(
      anthropicResponse(JSON.stringify({
        intent: 'greeting',
        confidence: 0.9,
      })),
    );

    const classification = await classifyIntent('Buenos dias');

    expect(classification.entities).toEqual({});
  });

  it('defaults entities to an empty object when entities is not an object', async () => {
    mockCreate.mockResolvedValueOnce(
      anthropicResponse(JSON.stringify({
        intent: 'greeting',
        confidence: 0.9,
        entities: 'not-an-object',
      })),
    );

    const classification = await classifyIntent('Buenos dias');

    expect(classification.entities).toEqual({});
  });

  it('extracts entities like date and time', async () => {
    mockCreate.mockResolvedValueOnce(
      anthropicResponse(JSON.stringify({
        intent: 'schedule',
        confidence: 0.93,
        entities: {
          date: '2026-03-15',
          time: '10:30',
          service_type: 'consulta general',
          patient_name: 'Maria Lopez',
        },
      })),
    );

    const classification = await classifyIntent(
      'Quiero agendar una consulta general para el 15 de marzo a las 10:30, mi nombre es Maria Lopez',
    );

    expect(classification.entities.date).toBe('2026-03-15');
    expect(classification.entities.time).toBe('10:30');
    expect(classification.entities.service_type).toBe('consulta general');
    expect(classification.entities.patient_name).toBe('Maria Lopez');
  });

  it('returns fallback classification on API error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API rate limit exceeded'));

    const classification = await classifyIntent('Hola');

    expect(classification.intent).toBe('other');
    expect(classification.confidence).toBe(0);
    expect(classification.entities).toEqual({});
  });

  it('returns fallback classification when response is not valid JSON', async () => {
    mockCreate.mockResolvedValueOnce(
      anthropicResponse('This is not JSON'),
    );

    const classification = await classifyIntent('Hola');

    expect(classification.intent).toBe('other');
    expect(classification.confidence).toBe(0);
    expect(classification.entities).toEqual({});
  });

  it('passes context information to the API call', async () => {
    mockCreate.mockResolvedValueOnce(
      anthropicResponse(JSON.stringify({
        intent: 'schedule',
        confidence: 0.9,
        entities: {},
      })),
    );

    await classifyIntent('Quiero una cita', {
      patientName: 'Carlos',
      clinicName: 'Clinica Dental Sonrisa',
      clinicServices: ['Limpieza', 'Blanqueamiento'],
    });

    expect(mockCreate).toHaveBeenCalledOnce();
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain('Carlos');
    expect(callArgs.system).toContain('Clinica Dental Sonrisa');
    expect(callArgs.system).toContain('Limpieza');
    expect(callArgs.system).toContain('Blanqueamiento');
  });

  it('incluye el historial de conversacion en el system prompt', async () => {
    mockCreate.mockResolvedValueOnce(
      anthropicResponse(JSON.stringify({
        intent: 'confirm',
        confidence: 0.9,
        entities: {},
      })),
    );

    await classifyIntent('si, la primera', {
      clinicName: 'Clinica X',
      history: [
        { direction: 'inbound', message: 'quiero una cita' },
        { direction: 'outbound', message: 'Tenemos: 1. lunes 9am 2. martes 10am' },
      ],
    });
    const call = mockCreate.mock.calls[0][0];
    expect(call.system).toContain('quiero una cita');
    expect(call.system).toContain('Historial reciente');
  });

  it('sends the patient message as the user message to the API', async () => {
    mockCreate.mockResolvedValueOnce(
      anthropicResponse(JSON.stringify({
        intent: 'greeting',
        confidence: 0.9,
        entities: {},
      })),
    );

    await classifyIntent('Hola buenas tardes');

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].content).toBe('Hola buenas tardes');
  });
});
