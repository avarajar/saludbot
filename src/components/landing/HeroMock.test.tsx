import { describe, expect, it } from 'vitest';
import { HERO_CHAT, heroChatState } from './HeroMock';

describe('heroChatState', () => {
  it('starts empty with no typing indicator', () => {
    const s = heroChatState(0);
    expect(s.messages).toHaveLength(0);
    expect(s.typing).toBe(false);
    expect(s.confirmed).toBe(false);
  });

  it('shows the typing indicator only before bot messages', () => {
    expect(heroChatState(1).typing).toBe(true); // next is the bot's slot offer
    expect(heroChatState(2).typing).toBe(false); // next is the patient
  });

  it('waits longer before bot messages than patient messages', () => {
    expect(heroChatState(1).nextDelay).toBeGreaterThan(heroChatState(2).nextDelay);
  });

  it('marks the 9:00 row confirmed once the patient replies "1"', () => {
    const replyIndex = HERO_CHAT.findIndex((m) => m.me && m.text === '1');
    expect(heroChatState(replyIndex).confirmed).toBe(false);
    expect(heroChatState(replyIndex + 1).confirmed).toBe(true);
  });

  it('holds the full conversation during the pause ticks', () => {
    const s = heroChatState(HERO_CHAT.length + 2);
    expect(s.messages).toHaveLength(HERO_CHAT.length);
    expect(s.typing).toBe(false);
  });
});
