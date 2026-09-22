import { GLITCH_CHANCE } from './constants';

const CORRUPT_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

export const corruptText = (text) => {
  return text
    .split('')
    .map((char) => {
      if (Math.random() < 0.15) {
        return CORRUPT_CHARS[Math.floor(Math.random() * CORRUPT_CHARS.length)];
      }
      return char;
    })
    .join('');
};

/**
 * Creates a history-writer that applies glitch corruption and plays
 * contextual sounds, then appends through the provided addHistory.
 */
export const createGlitchedWriter = (addHistory, playError, playAchievement) => {
  return (entry) => {
    const isGlitched = Math.random() < GLITCH_CHANCE;
    const finalEntry = {
      ...entry,
      glitch: isGlitched,
      text: isGlitched ? corruptText(entry.text) : entry.text,
    };

    if (finalEntry.type === 'error') playError();
    else if (finalEntry.type === 'achievement') playAchievement();

    addHistory(finalEntry);
  };
};
