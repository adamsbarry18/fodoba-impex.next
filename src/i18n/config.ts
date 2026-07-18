export const LOCALES = ["fr", "en", "pt"] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "fr"

export interface LocaleConfig {
  code: Locale
  name: string
  flag: string
}

export const LOCALE_CONFIGS: LocaleConfig[] = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
]

export const STORAGE_KEY = "fodoba-locale"
