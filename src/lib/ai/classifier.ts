import Anthropic from '@anthropic-ai/sdk';
import type { ConversationIntent } from '@/types';

const anthropic = new Anthropic();

export interface ClassificationResult {
  intent: ConversationIntent;
  confidence: number;
  entities: Record<string, string>;
}

interface ClassificationContext {
  patientName?: string;
  clinicName?: string;
  clinicServices?: string[];
}

const VALID_INTENTS: ConversationIntent[] = [
  'schedule',
  'reschedule',
  'cancel',
  'confirm',
  'info_services',
  'info_hours',
  'info_location',
  'greeting',
  'escalate',
  'other',
];

/**
 * Classify the intent of an incoming patient WhatsApp message using Claude.
 * The prompt is in Spanish because patients write in Spanish.
 */
export async function classifyIntent(
  message: string,
  context?: ClassificationContext,
): Promise<ClassificationResult> {
  const servicesHint = context?.clinicServices?.length
    ? `Servicios que ofrece la clinica: ${context.clinicServices.join(', ')}.`
    : '';

  const contextHint = [
    context?.patientName ? `Nombre del paciente: ${context.patientName}.` : '',
    context?.clinicName ? `Nombre de la clinica: ${context.clinicName}.` : '',
    servicesHint,
  ]
    .filter(Boolean)
    .join('\n');

  const systemPrompt = `Eres un clasificador de intenciones para un chatbot de WhatsApp de una clinica de salud en Colombia.

Tu tarea es analizar el mensaje del paciente y devolver un JSON con:
- "intent": una de las siguientes intenciones: ${VALID_INTENTS.join(', ')}
- "confidence": un numero entre 0 y 1 indicando que tan seguro estas
- "entities": un objeto con entidades extraidas del mensaje. Las posibles entidades son:
  - "date": fecha mencionada (formato YYYY-MM-DD si es posible)
  - "time": hora mencionada (formato HH:MM si es posible)
  - "service_type": tipo de servicio o procedimiento mencionado
  - "patient_name": nombre del paciente si lo menciona

Guia de intenciones:
- schedule: el paciente quiere agendar/pedir/solicitar una cita nueva
- reschedule: el paciente quiere cambiar/mover una cita existente
- cancel: el paciente quiere cancelar una cita
- confirm: el paciente confirma asistencia a una cita (si, confirmo, ahi estare, etc.)
- info_services: pregunta por servicios, tratamientos, precios
- info_hours: pregunta por horario de atencion
- info_location: pregunta por direccion o como llegar
- greeting: saludo inicial (hola, buenos dias, buenas, etc.)
- escalate: el paciente pide hablar con un humano, tiene una queja, o es una urgencia medica
- other: no encaja en ninguna de las anteriores

${contextHint}

IMPORTANTE: Responde UNICAMENTE con el JSON, sin texto adicional ni backticks.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const parsed = JSON.parse(text) as ClassificationResult;

    // Validate intent is one of the known values
    if (!VALID_INTENTS.includes(parsed.intent)) {
      parsed.intent = 'other';
    }

    // Clamp confidence
    parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));

    // Ensure entities is an object
    if (!parsed.entities || typeof parsed.entities !== 'object') {
      parsed.entities = {};
    }

    return parsed;
  } catch (error) {
    console.error('Error classifying intent:', error);
    return {
      intent: 'other',
      confidence: 0,
      entities: {},
    };
  }
}
