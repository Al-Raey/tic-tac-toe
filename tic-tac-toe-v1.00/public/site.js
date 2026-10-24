(() => {
  const validLanguage = (value) => value === 'ar' || value === 'en';
  const applyLanguage = (language) => {
    const current = validLanguage(language) ? language : 'en';
    document.documentElement.lang = current;
    document.documentElement.dir = current === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-lang]').forEach((element) => {
      element.hidden = element.getAttribute('data-lang') !== current;
    });
    document.querySelectorAll('[data-set-lang]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-set-lang') === current));
    });
    const title = document.body.dataset[current === 'ar' ? 'titleAr' : 'titleEn'];
    if (title) document.title = title;
  };

  // Keep public HTML pages and the React application on the same preference.
  // Merge the language into a valid settings object so other preferences survive.
  const persistLanguage = (language) => {
    if (!validLanguage(language)) return;
    try {
      const raw = localStorage.getItem('ttu.settings.v1');
      const parsed = raw ? JSON.parse(raw) : {};
      const settings = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      localStorage.setItem('ttu.settings.v1', JSON.stringify({ ...settings, language }));
    } catch { /* Preferences are optional when storage is disabled or blocked. */ }
  };

  let language = navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en';
  try {
    const savedSettings = JSON.parse(localStorage.getItem('ttu.settings.v1') || '{}');
    if (validLanguage(savedSettings.language)) language = savedSettings.language;
  } catch { /* localStorage may be disabled or contain malformed data. */ }
  if (!validLanguage(language) && navigator.language.toLowerCase().startsWith('ar')) language = 'ar';
  applyLanguage(language);

  document.querySelectorAll('[data-set-lang]').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.getAttribute('data-set-lang');
      if (!validLanguage(selected)) return;
      applyLanguage(selected);
      persistLanguage(selected);
    });
  });
})();
