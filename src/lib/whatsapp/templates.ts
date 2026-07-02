import { sendMessage, sendTemplateMessage } from './client';

export type BusinessMessageType =
  | 'reminder_48h' | 'reminder_24h' | 'reminder_2h' | 'post_visit' | 'recall';

const ENV_KEYS: Record<BusinessMessageType, string> = {
  reminder_48h: 'TWILIO_TEMPLATE_REMINDER_48H',
  reminder_24h: 'TWILIO_TEMPLATE_REMINDER_24H',
  reminder_2h: 'TWILIO_TEMPLATE_REMINDER_2H',
  post_visit: 'TWILIO_TEMPLATE_POST_VISIT',
  recall: 'TWILIO_TEMPLATE_RECALL',
};

export function getTemplateSid(type: BusinessMessageType): string | null {
  const sid = process.env[ENV_KEYS[type]];
  return sid && sid.trim() !== '' ? sid : null;
}

/**
 * Mensajes iniciados por el negocio (recordatorios, follow-ups).
 * Fuera de la ventana de 24h de WhatsApp solo se entregan con plantilla
 * aprobada; sin SID configurado se usa texto libre (sandbox/desarrollo).
 */
export async function sendBusinessMessage(opts: {
  type: BusinessMessageType;
  to: string;
  from?: string;
  variables: Record<string, string>;
  fallbackText: string;
}): Promise<string> {
  const sid = getTemplateSid(opts.type);
  if (sid) {
    return sendTemplateMessage(opts.to, sid, opts.variables, opts.from);
  }
  return sendMessage(opts.to, opts.fallbackText, opts.from);
}
