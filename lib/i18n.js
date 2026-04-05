// ─── Locales supportees ────────────────────────────────────────
export const SUPPORTED_LOCALES = ['fr', 'en', 'de', 'es', 'it', 'pt', 'nl'];
export const DEFAULT_LOCALE = 'fr';

// ─── Schema Mongoose reutilisable pour champs multilingues ─────
// Usage dans les models : title: localizedStringSchema(true)  -> fr required
//                         rules:  localizedStringSchema(false) -> tout optionnel
// Note : pas de dependance mongoose — ce sont de simples objets de config
export function localizedStringSchema(frRequired = false) {
  const schema = {};
  for (const locale of SUPPORTED_LOCALES) {
    schema[locale] = {
      type: String,
      default: '',
      ...(locale === 'fr' && frRequired ? { required: [true, 'Le champ en francais est requis'] } : {}),
    };
  }
  return schema;
}

// ─── Helpers ───────────────────────────────────────────────────

/**
 * Extrait la valeur localisee d'un champ i18n avec fallback sur fr.
 * Gere aussi les anciens champs String simples (retrocompatibilite).
 *
 * @param {Object|String} field - { fr: "Bonjour", en: "Hello" } ou "Bonjour"
 * @param {string} locale - 'en', 'fr', etc.
 * @returns {string}
 */
export function getLocalizedField(field, locale = DEFAULT_LOCALE) {
  if (!field) return '';
  // Retrocompatibilite : si c'est une string simple
  if (typeof field === 'string') return field;
  // Chercher dans la locale demandee, puis fallback fr, puis premiere valeur non vide
  return field[locale] || field[DEFAULT_LOCALE] || Object.values(field).find((v) => v) || '';
}

/**
 * Met a jour une locale dans un champ i18n.
 *
 * @param {Object} field - l'objet i18n existant
 * @param {string} locale - la locale a modifier
 * @param {string} value - la nouvelle valeur
 * @returns {Object} l'objet mis a jour
 */
export function setLocalizedField(field, locale, value) {
  const obj = typeof field === 'object' && field !== null ? { ...field } : {};
  obj[locale] = value;
  return obj;
}

/**
 * Cree un nouvel objet i18n avec uniquement la valeur fr remplie.
 *
 * @param {string} frValue - la valeur en francais
 * @returns {Object} { fr: frValue, en: '', de: '', ... }
 */
export function createLocalizedField(frValue = '') {
  const obj = {};
  for (const locale of SUPPORTED_LOCALES) {
    obj[locale] = locale === 'fr' ? frValue : '';
  }
  return obj;
}

/**
 * Detecte la locale du navigateur parmi les locales supportees.
 * Cote serveur, retourne 'fr'.
 *
 * @returns {string}
 */
export function detectBrowserLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const browserLang = navigator.language?.split('-')[0]?.toLowerCase();
  if (browserLang && SUPPORTED_LOCALES.includes(browserLang)) {
    return browserLang;
  }

  // Chercher dans les langues preferees
  const languages = navigator.languages || [];
  for (const lang of languages) {
    const code = lang.split('-')[0].toLowerCase();
    if (SUPPORTED_LOCALES.includes(code)) return code;
  }

  return DEFAULT_LOCALE;
}
