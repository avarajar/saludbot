import Anthropic from '@anthropic-ai/sdk';
import type { ConversationIntent } from '@/types';

const anthropic = new Anthropic();

export interface ResponseContext {
  clinicName: string;
  patientName?: string;
  availableSlots?: string[];
  services?: string[];
  appointmentDetails?: {
    date?: string;
    time?: string;
    service?: string;
    status?: string;
  };
  clinicAddress?: string;
  clinicHours?: string;
  ownerName?: string;
}

/**
 * Generate a natural, warm WhatsApp response in Colombian Spanish.
 * Uses "usted" form and Colombian expressions.
 */
export async function generateResponse(
  intent: ConversationIntent | string,
  context: ResponseContext,
): Promise<string> {
  const systemPrompt = `Eres un asistente virtual de WhatsApp para "${context.clinicName}", una clinica de salud en Colombia.

REGLAS DE COMUNICACION:
- Habla en espanol colombiano, usa el "usted" (nunca tutees).
- Se calido, profesional y amable. Usa expresiones colombianas naturales como "con mucho gusto", "quedo atento/a", "que pena", "claro que si".
- Las respuestas deben ser CONCISAS, idealmente menos de 300 caracteres. Esto es WhatsApp, no un correo.
- No uses emojis excesivos. Maximo 1-2 por mensaje.
- Cuando sea relevante, personaliza con el nombre del paciente.
- Siempre muestrate dispuesto/a a ayudar.

CONTEXTO:
${context.patientName ? `Paciente: ${context.patientName}` : 'Paciente: nuevo'}
${context.services?.length ? `Servicios: ${context.services.join(', ')}` : ''}
${context.availableSlots?.length ? `Horarios disponibles: ${context.availableSlots.join(', ')}` : ''}
${context.appointmentDetails ? `Cita: ${JSON.stringify(context.appointmentDetails)}` : ''}
${context.clinicAddress ? `Direccion: ${context.clinicAddress}` : ''}
${context.clinicHours ? `Horario: ${context.clinicHours}` : ''}

Genera UNICAMENTE el mensaje de respuesta, sin explicaciones adicionales.`;

  const intentDescriptions: Record<string, string> = {
    schedule:
      'El paciente quiere agendar una cita. Ofrece los horarios disponibles si los hay, o pide informacion para buscar disponibilidad.',
    reschedule:
      'El paciente quiere cambiar su cita. Muestra los nuevos horarios disponibles.',
    cancel:
      'El paciente quiere cancelar su cita. Confirma la cancelacion y ofrecele reagendar.',
    confirm:
      'El paciente confirma su asistencia a la cita. Agradece y recuerda los detalles.',
    info_services:
      'El paciente pregunta por servicios. Lista los servicios disponibles.',
    info_hours: 'El paciente pregunta por el horario de atencion.',
    info_location: 'El paciente pregunta por la ubicacion o como llegar.',
    greeting:
      'El paciente saluda. Dale la bienvenida y ofrece un menu breve de opciones (agendar cita, consultar servicios, etc.).',
    escalate:
      'El paciente necesita hablar con un humano o tiene una urgencia. Dile que un miembro del equipo se comunicara pronto.',
    other:
      'Mensaje no clasificado. Responde amablemente pidiendo mas informacion sobre lo que necesita.',
  };

  const intentInstruction =
    intentDescriptions[intent] || intentDescriptions['other'];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Intencion detectada: ${intent}\nInstruccion: ${intentInstruction}`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return text.trim();
  } catch (error) {
    console.error('Error generating response:', error);

    // Graceful fallback message
    const name = context.patientName
      ? `, ${context.patientName}`
      : '';
    return `Hola${name}. En este momento tenemos dificultades tecnicas. Por favor intentelo de nuevo en unos minutos o comuniquese directamente con ${context.clinicName}. Disculpe las molestias.`;
  }
}
