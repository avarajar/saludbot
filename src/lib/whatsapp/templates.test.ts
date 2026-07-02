import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/whatsapp/client', () => ({
  sendMessage: vi.fn().mockResolvedValue('SM_text'),
  sendTemplateMessage: vi.fn().mockResolvedValue('SM_template'),
}));

import { getTemplateSid, sendBusinessMessage } from './templates';
import { sendMessage, sendTemplateMessage } from '@/lib/whatsapp/client';

describe('templates', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it('usa la plantilla cuando hay Content SID configurado', async () => {
    vi.stubEnv('TWILIO_TEMPLATE_REMINDER_48H', 'HX_abc123');
    const sid = await sendBusinessMessage({
      type: 'reminder_48h', to: '+573001112233', from: '+573009998877',
      variables: { '1': 'Maria', '2': 'Clinica X' },
      fallbackText: 'Hola Maria...',
    });
    expect(sid).toBe('SM_template');
    expect(sendTemplateMessage).toHaveBeenCalledWith(
      '+573001112233', 'HX_abc123', { '1': 'Maria', '2': 'Clinica X' }, '+573009998877',
    );
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('cae a texto libre cuando no hay SID', async () => {
    vi.stubEnv('TWILIO_TEMPLATE_REMINDER_48H', '');
    const sid = await sendBusinessMessage({
      type: 'reminder_48h', to: '+573001112233',
      variables: {}, fallbackText: 'Hola Maria...',
    });
    expect(sid).toBe('SM_text');
    expect(sendMessage).toHaveBeenCalledWith('+573001112233', 'Hola Maria...', undefined);
  });

  it('getTemplateSid retorna null si no esta configurado', () => {
    vi.stubEnv('TWILIO_TEMPLATE_RECALL', '');
    expect(getTemplateSid('recall')).toBeNull();
  });
});
