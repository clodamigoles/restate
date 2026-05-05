import { useState, useCallback, useEffect } from 'react';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  getLocalizedField,
  detectBrowserLocale,
} from '@/lib/i18n';

const STORAGE_KEY = 'maxo-locale';

/**
 * Hook pour gerer la locale courante.
 *
 * @returns {{
 *   locale: string,
 *   setLocale: (locale: string) => void,
 *   t: (field: Object|string) => string,
 *   locales: string[]
 * }}
 */
export function useLocale() {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);

  // Initialiser depuis localStorage ou detection navigateur
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored)) {
      setLocaleState(stored);
    } else {
      const detected = detectBrowserLocale();
      setLocaleState(detected);
      localStorage.setItem(STORAGE_KEY, detected);
    }
  }, []);

  const setLocale = useCallback((newLocale) => {
    if (!SUPPORTED_LOCALES.includes(newLocale)) return;
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  // Raccourci pour extraire un champ localise
  const t = useCallback(
    (field) => getLocalizedField(field, locale),
    [locale]
  );

  return {
    locale,
    setLocale,
    t,
    locales: SUPPORTED_LOCALES,
  };
}
