// ─── Devises supportees ────────────────────────────────────────
// Pour ajouter une devise : ajouter une entree dans CURRENCIES
const CURRENCIES = {
  EUR: { symbol: '\u20ac', code: 'EUR', name: 'Euro', rate: 1, locale: 'fr-FR' },
  USD: { symbol: '$', code: 'USD', name: 'US Dollar', rate: 1.08, locale: 'en-US' },
  GBP: { symbol: '\u00a3', code: 'GBP', name: 'British Pound', rate: 0.86, locale: 'en-GB' },
  CHF: { symbol: 'CHF', code: 'CHF', name: 'Swiss Franc', rate: 0.97, locale: 'de-CH' },
};

export { CURRENCIES };

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCIES);
export const DEFAULT_CURRENCY = 'EUR';

/**
 * Ajouter une devise dynamiquement.
 * @param {{ code: string, symbol: string, name: string, rate: number, locale: string }} config
 */
export function addCurrency(config) {
  if (!config.code || !config.symbol || !config.rate) {
    throw new Error('Currency config requires code, symbol, and rate');
  }
  CURRENCIES[config.code] = config;
}

/**
 * Convertit un montant en centimes d'une devise vers une autre.
 * Les prix sont stockes en centimes EUR dans la BDD.
 *
 * @param {number} cents - montant en centimes (devise source)
 * @param {string} from - devise source (ex: 'EUR')
 * @param {string} to - devise cible (ex: 'USD')
 * @returns {number} montant en centimes (devise cible)
 */
export function convertPrice(cents, from = 'EUR', to = 'EUR') {
  if (from === to) return cents;

  const fromCurrency = CURRENCIES[from];
  const toCurrency = CURRENCIES[to];
  if (!fromCurrency || !toCurrency) return cents;

  // Convertir en EUR d'abord (devise de base), puis vers la cible
  const eurCents = cents / fromCurrency.rate;
  return Math.round(eurCents * toCurrency.rate);
}

/**
 * Formate un montant en centimes pour affichage.
 * Utilise Intl.NumberFormat pour le formatage localise.
 *
 * @param {number} cents - montant en centimes
 * @param {string} currency - code devise (ex: 'EUR')
 * @param {string} locale - locale d'affichage (ex: 'fr')
 * @returns {string} ex: "100,00 \u20ac" ou "$108.00"
 */
export function formatPrice(cents, currency = 'EUR', locale = 'fr') {
  const curr = CURRENCIES[currency];
  if (!curr) return `${(cents / 100).toFixed(2)} ${currency}`;

  const localeMap = {
    fr: 'fr-FR',
    en: 'en-US',
    de: 'de-DE',
    es: 'es-ES',
    it: 'it-IT',
    pt: 'pt-PT',
    nl: 'nl-NL',
  };

  const intlLocale = localeMap[locale] || curr.locale || 'fr-FR';

  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Version courte du formatage (sans decimales si entier).
 *
 * @param {number} cents - montant en centimes
 * @param {string} currency - code devise
 * @param {string} locale - locale d'affichage
 * @returns {string} ex: "100 \u20ac" ou "$108"
 */
export function formatPriceShort(cents, currency = 'EUR', locale = 'fr') {
  const curr = CURRENCIES[currency];
  if (!curr) return `${Math.round(cents / 100)} ${currency}`;

  const euros = cents / 100;
  const isInteger = Number.isInteger(euros);

  const localeMap = {
    fr: 'fr-FR',
    en: 'en-US',
    de: 'de-DE',
    es: 'es-ES',
    it: 'it-IT',
    pt: 'pt-PT',
    nl: 'nl-NL',
  };

  const intlLocale = localeMap[locale] || curr.locale || 'fr-FR';

  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: isInteger ? 0 : 2,
  }).format(euros);
}

/**
 * Retourne les infos d'une devise.
 * @param {string} code
 * @returns {{ symbol: string, code: string, name: string, rate: number, locale: string } | null}
 */
export function getCurrency(code) {
  return CURRENCIES[code] || null;
}
