/**
 * Supported languages for the Hybridized platform
 * @constant
 */
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', locale: 'en-US' },
  { code: 'es', name: 'Español', flag: '🇪🇸', locale: 'es-ES' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', locale: 'fr-FR' },
] as const

/**
 * Type representing a supported language
 */
export type Language = typeof LANGUAGES[number]

/**
 * Union type of all language codes
 */
export type LanguageCode = Language['code']

/**
 * Default language
 */
export const DEFAULT_LANGUAGE = LANGUAGES[0]

/**
 * Get language by code
 */
export const getLanguageByCode = (code: string): Language | undefined => {
  return LANGUAGES.find(lang => lang.code === code)
}

/**
 * Check if a code is valid
 */
export const isValidLanguageCode = (code: string): code is LanguageCode => {
  return LANGUAGES.some(lang => lang.code === code)
}
