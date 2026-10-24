import { describe, expect, it } from 'vitest';
import { getTranslator, TRANSLATION_KEYS } from './i18n';

describe('localization dictionaries', () => {
  it('provides a non-empty string for every UI translation key in both languages', () => {
    for (const language of ['en', 'ar'] as const) {
      const t = getTranslator(language);
      for (const key of TRANSLATION_KEYS) {
        expect(t(key), `${language}:${key}`).toBeTruthy();
      }
    }
  });
});
