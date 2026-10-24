import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/site.js', import.meta.url), 'utf8');

function runPage({ savedSettings = null, browserLanguage = 'en-US', storageThrows = false } = {}) {
  const elements = ['en', 'ar'].map((language) => ({
    language,
    hidden: false,
    getAttribute(name) { return name === 'data-lang' ? this.language : null; },
  }));
  const buttons = ['en', 'ar'].map((language) => ({
    language,
    attributes: { 'data-set-lang': language },
    listeners: {},
    getAttribute(name) { return this.attributes[name] ?? null; },
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, handler) { this.listeners[name] = handler; },
    click() { this.listeners.click?.(); },
  }));
  const document = {
    title: 'initial title',
    documentElement: { lang: '', dir: '', dataset: {} },
    body: { dataset: { titleEn: 'English page', titleAr: 'صفحة عربية' } },
    querySelectorAll(selector) {
      if (selector === '[data-lang]') return elements;
      if (selector === '[data-set-lang]') return buttons;
      return [];
    },
  };
  let stored = savedSettings;
  const localStorage = {
    getItem() {
      if (storageThrows) throw new Error('Storage disabled');
      return stored === null ? null : JSON.stringify(stored);
    },
    setItem(_key, value) {
      if (storageThrows) throw new Error('Storage disabled');
      stored = JSON.parse(value);
    },
  };
  vm.runInNewContext(source, { document, navigator: { language: browserLanguage }, localStorage });
  return { document, elements, buttons, getSavedSettings: () => stored };
}

{
  const page = runPage({ savedSettings: { language: 'ar', theme: 'light', sound: false } });
  assert.equal(page.document.documentElement.lang, 'ar');
  assert.equal(page.document.documentElement.dir, 'rtl');
  assert.equal(page.document.title, 'صفحة عربية');
  assert.equal(page.elements[0].hidden, true);
  assert.equal(page.elements[1].hidden, false);
  assert.equal(page.buttons[1].attributes['aria-pressed'], 'true');
}

{
  const page = runPage({ savedSettings: { language: 'en', theme: 'light', sound: false } });
  page.buttons[1].click();
  assert.equal(page.document.documentElement.lang, 'ar');
  assert.equal(page.document.documentElement.dir, 'rtl');
  assert.equal(page.getSavedSettings().language, 'ar');
  assert.equal(page.getSavedSettings().theme, 'light');
  assert.equal(page.getSavedSettings().sound, false);
  page.buttons[0].click();
  assert.equal(page.getSavedSettings().language, 'en');
  assert.equal(page.document.documentElement.dir, 'ltr');
  assert.equal(page.buttons[0].attributes['aria-pressed'], 'true');
}

{
  const page = runPage({ browserLanguage: 'ar-EG' });
  assert.equal(page.document.documentElement.lang, 'ar');
  page.buttons[1].click();
  assert.doesNotThrow(() => page.buttons[0].click());
}

{
  const page = runPage({ storageThrows: true, browserLanguage: 'en-US' });
  assert.equal(page.document.documentElement.lang, 'en');
  assert.doesNotThrow(() => page.buttons[1].click());
  assert.equal(page.document.documentElement.lang, 'ar');
}

console.log('Public-page language tests passed (4 scenarios: restore, persist/merge, browser fallback, unavailable storage).');
