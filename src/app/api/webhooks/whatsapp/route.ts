import { NextRequest, NextResponse } from 'next/server';
import type { ConversationIntent } from '@/types';
import {
  getClinicByPhone,
  getPatientByPhone,
  createPatient,
  getClinicServices,
  logConversation,
} from '@/lib/db/queries';
import { sendMessage, validateWebhook } from '@/lib/whatsapp/client';
import { classifyIntent } from '@/lib/ai/classifier';
import { generateResponse } from '@/lib/ai/responder';
import {
  handleSchedule,
  handleConfirm,
  handleCancel,
  handleReschedule,
  handleInfoServices,
  handleInfoHours,
  handleGreeting,
  handleEscalate,
} from '@/lib/whatsapp/handlers';

/**
 * POST /api/webhooks/whatsapp
 * Twilio sends incoming WhatsApp messages here.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params = Object.fromEntries(formData.entries()) as Record<
      string,
      string
    >;

    const from = params.From?.replace('whatsapp:', '') || '';
    const body = params.Body || '';
    const messageSid = params.MessageSid || '';
    const to = params.To?.replace('whatsapp:', '') || '';

    // ── Validate webhook signature ────────────────────────────────────────
    const signature = request.headers.get('x-twilio-signature') || '';
    const webhookUrl = process.env.TWILIO_WEBHOOK_URL || '';

    if (webhookUrl && !validateWebhook(signature, webhookUrl, params)) {
      return twimlResponse('');
    }

    // ── Look up clinic by Twilio number ───────────────────────────────────
    const clinic = await getClinicByPhone(to);

    if (!clinic) {
      console.error(`No clinic found for WhatsApp number: ${to}`);
      return twimlResponse('');
    }

    // ── Look up or create patient ─────────────────────────────────────────
    let patient = await getPatientByPhone(clinic.id, from);

    if (!patient) {
      patient = await createPatient({
        clinic_id: clinic.id,
        name: '',
        phone: from,
        email: null,
        document_id: null,
        notes: null,
      });
    }

    // ── Classify intent ───────────────────────────────────────────────────
    const services = await getClinicServices(clinic.id);
    const classification = await classifyIntent(body, {
      patientName: patient.name || undefined,
      clinicName: clinic.name,
      clinicServices: services.map((s) => s.name),
    });

    // Update patient name if extracted and not yet set
    if (classification.entities.patient_name && !patient.name) {
      patient.name = classification.entities.patient_name;
    }

    // ── Log inbound conversation ──────────────────────────────────────────
    await logConversation({
      clinic_id: clinic.id,
      patient_id: patient.id,
      whatsapp_message_id: messageSid,
      direction: 'inbound',
      message: body,
      intent: classification.intent,
    });

    // ── Route to handler ──────────────────────────────────────────────────
    let responseMessage: string;

    switch (classification.intent) {
      case 'schedule':
        responseMessage = await handleSchedule(
          clinic,
          patient,
          classification.entities,
          services,
        );
        break;

      case 'confirm':
        responseMessage = await handleConfirm(
          clinic,
          patient,
          classification.entities,
        );
        break;

      case 'cancel':
        responseMessage = await handleCancel(
          clinic,
          patient,
          classification.entities,
        );
        break;

      case 'reschedule':
        responseMessage = await handleReschedule(
          clinic,
          patient,
          classification.entities,
        );
        break;

      case 'info_services':
        responseMessage = await handleInfoServices(clinic);
        break;

      case 'info_hours':
        responseMessage = await handleInfoHours(clinic);
        break;

      case 'info_location':
        responseMessage = await generateResponse('info_location', {
          clinicName: clinic.name,
          patientName: patient.name || undefined,
          clinicAddress: clinic.address,
        });
        break;

      case 'greeting':
        responseMessage = await handleGreeting(clinic, patient);
        break;

      case 'escalate':
        responseMessage = await handleEscalate(clinic, patient, body);
        break;

      default:
        responseMessage = await generateResponse('other', {
          clinicName: clinic.name,
          patientName: patient.name || undefined,
        });
        break;
    }

    // ── Send response via Twilio ──────────────────────────────────────────
    await sendMessage(from, responseMessage);

    // ── Log outbound conversation ─────────────────────────────────────────
    await logConversation({
      clinic_id: clinic.id,
      patient_id: patient.id,
      whatsapp_message_id: '',
      direction: 'outbound',
      message: responseMessage,
      intent: classification.intent,
    });

    // Return empty TwiML so Twilio doesn't send a duplicate reply
    return twimlResponse('');
  } catch (error) {
    console.error('Webhook processing error:', error);

    // Always return 200 to Twilio to prevent retries
    return twimlResponse(
      'Disculpe, tenemos dificultades tecnicas. Por favor intentelo de nuevo en unos minutos.',
    );
  }
}

/**
 * Build a TwiML XML response.
 */
function twimlResponse(message: string): NextResponse {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

/**
 * Escape special XML characters in message text.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
