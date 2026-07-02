import { NextRequest, NextResponse } from 'next/server';
import type { ConversationIntent } from '@/types';
import {
  getPatientByPhone,
  createPatient,
  updatePatient,
  getClinicServices,
  getRecentConversations,
  logConversation,
  insertInboundConversation,
  updateConversationIntent,
} from '@/lib/db/queries';
import { resolveClinic, saveRoutingSession } from '@/lib/db/routing';
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
import { getActiveSession, clearSession } from '@/lib/db/sessions';
import { continueSession } from '@/lib/whatsapp/flow';

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
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      // Fail-closed: sin URL configurada o firma invalida, no se procesa.
      if (!webhookUrl || !signature || !validateWebhook(signature, webhookUrl, params)) {
        console.error('Twilio signature validation failed');
        return twimlResponse('');
      }
    } else if (webhookUrl && !validateWebhook(signature, webhookUrl, params)) {
      return twimlResponse('');
    }

    // ── Resolve clinic for the (possibly shared) Twilio number ──────────────
    const resolution = await resolveClinic(to, from, body);

    if (resolution.status === 'none') {
      console.error(`No clinic resolved for message to ${to} from ${from}`);
      return twimlResponse('');
    }

    if (resolution.status === 'ambiguous') {
      await saveRoutingSession(from, resolution.candidates.map((c) => c.id));

      if (resolution.candidates.length > 5) {
        // Demasiadas clinicas para listar con numeros: se le pide el nombre
        // en vez de dejarlo sin respuesta. popRoutingChoice ya sabe resolver
        // por nombre/slug contra la sesion de routing guardada arriba.
        return twimlResponse(
          'Hola, este numero atiende varias clinicas. Por favor escribanos el nombre de la clinica que busca.',
        );
      }

      const list = resolution.candidates.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
      return twimlResponse(
        `Hola, ¿con cual clinica desea comunicarse?\n${list}\nResponda con el numero.`,
      );
    }

    const clinic = resolution.clinic;

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

    // ── Log inbound conversation (idempotent on whatsapp_message_id) ───────
    const { conversation: inbound, duplicate } = await insertInboundConversation({
      clinic_id: clinic.id,
      patient_id: patient.id,
      whatsapp_message_id: messageSid,
      message: body,
      intent: null,
    });

    if (duplicate) {
      // Already processed this MessageSid (Twilio retry) — do not
      // reclassify or respond again.
      return twimlResponse('');
    }

    // ── Sesion activa: interpretar contra el estado pendiente ──────────────
    const services = await getClinicServices(clinic.id);
    const session = await getActiveSession(clinic.id, patient.id);

    if (session && session.state !== 'idle') {
      const result = await continueSession({ session, message: body, clinic, patient, services });
      if (result.handled && result.reply) {
        const sid = await sendMessage(from, result.reply, clinic.whatsapp_number);
        await logConversation({
          clinic_id: clinic.id,
          patient_id: patient.id,
          whatsapp_message_id: sid,
          direction: 'outbound',
          message: result.reply,
          intent: null,
        });
        return twimlResponse('');
      }
      // La respuesta no corresponde al flujo pendiente: abandonarlo.
      await clearSession(clinic.id, patient.id);
    }

    // ── Clasificar con historial ────────────────────────────────────────────
    const history = await getRecentConversations(clinic.id, patient.id, 6);
    const classification = await classifyIntent(body, {
      patientName: patient.name || undefined,
      clinicName: clinic.name,
      clinicServices: services.map((s) => s.name),
      history: history
        .filter((h) => h.id !== inbound?.id)
        .map((h) => ({ direction: h.direction, message: h.message })),
    });

    // Update patient name if extracted and not yet set
    if (classification.entities.patient_name && !patient.name) {
      patient = await updatePatient(patient.id, {
        name: classification.entities.patient_name,
      });
    }

    if (inbound) {
      await updateConversationIntent(inbound.id, classification.intent);
    }

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
    const outboundSid = await sendMessage(from, responseMessage, clinic.whatsapp_number);

    // ── Log outbound conversation ─────────────────────────────────────────
    await logConversation({
      clinic_id: clinic.id,
      patient_id: patient.id,
      whatsapp_message_id: outboundSid,
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
