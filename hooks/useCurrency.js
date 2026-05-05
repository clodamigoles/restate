import { useState, useCallback, useEffect } from 'react';
import {
  CURRENCIES,
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  convertPrice,
  formatPrice,
  formatPriceShort,
} from '@/lib/currencies';
import { DEFAULT_LOCALE } from '@/lib/i18n';

const STORAGE_KEY = 'maxo-currency';

/**
 * Hook pour gerer la devise courante.
 *
 * @param {string} [locale] - locale pour le formatage (defaut: 'fr')
 * @returns {{
 *   currency: string,
 *   setCurrency: (code: string) => void,
 *   format: (cents: number, fromCurrency?: string) => string,
 *   formatShort: (cents: number, fromCurrency?: string) => string,
 *   convert: (cents: number, fromCurrency?: string) => number,
 *   currencies: Object,
 *   currencyCodes: string[]
 * }}
 */
export function useCurrency(locale = DEFAULT_LOCALE) {
  const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY);

  // Initialiser depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_CURRENCIES.includes(stored)) {
      setCurrencyState(stored);
    }
  }, []);

  const setCurrency = useCallback((code) => {
    if (!SUPPORTED_CURRENCIES.includes(code)) return;
    setCurrencyState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  // Formater un montant (convertit depuis la devise source vers la devise courante)
  const format = useCallback(
    (cents, fromCurrency = 'EUR') => {
      const converted = convertPrice(cents, fromCurrency, currency);
      return formatPrice(converted, currency, locale);
    },
    [currency, locale]
  );

  // Version courte
  const formatS = useCallback(
    (cents, fromCurrency = 'EUR') => {
      const converted = convertPrice(cents, fromCurrency, currency);
      return formatPriceShort(converted, currency, locale);
    },
    [currency, locale]
  );

  // Conversion brute (retourne des centimes)
  const convert = useCallback(
    (cents, fromCurrency = 'EUR') => convertPrice(cents, fromCurrency, currency),
    [currency]
  );

  return {
    currency,
    setCurrency,
    format,
    formatShort: formatS,
    convert,
    currencies: CURRENCIES,
    currencyCodes: SUPPORTED_CURRENCIES,
  };
}
