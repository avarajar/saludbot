import twilio from 'twilio';

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  return twilio(accountSid, authToken);
}

function getWhatsappNumber() {
  return process.env.TWILIO_WHATSAPP_NUMBER!;
}

function getAuthToken() {
  return process.env.TWILIO_AUTH_TOKEN!;
}

/**
 * Send a free-form WhatsApp message via Twilio.
 *
 * `from` is the sender number without the `whatsapp:` prefix. When omitted,
 * falls back to the global `TWILIO_WHATSAPP_NUMBER` env var.
 */
export async function sendMessage(
  to: string,
  body: string,
  from?: string,
): Promise<string> {
  const client = getTwilioClient();
  const sender = from || getWhatsappNumber();
  const message = await client.messages.create({
    from: `whatsapp:${sender}`,
    to: `whatsapp:${to}`,
    body,
  });
  return message.sid;
}

/**
 * Send a pre-approved WhatsApp template message via Twilio Content API.
 *
 * `from` is the sender number without the `whatsapp:` prefix. When omitted,
 * falls back to the global `TWILIO_WHATSAPP_NUMBER` env var.
 */
export async function sendTemplateMessage(
  to: string,
  templateSid: string,
  variables: Record<string, string>,
  from?: string,
): Promise<string> {
  const client = getTwilioClient();
  const sender = from || getWhatsappNumber();
  const message = await client.messages.create({
    from: `whatsapp:${sender}`,
    to: `whatsapp:${to}`,
    contentSid: templateSid,
    contentVariables: JSON.stringify(variables),
  });
  return message.sid;
}

/**
 * Validate that an incoming request truly comes from Twilio
 * by checking the X-Twilio-Signature header.
 */
export function validateWebhook(
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  return twilio.validateRequest(getAuthToken(), signature, url, params);
}
