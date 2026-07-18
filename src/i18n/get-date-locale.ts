import { fr } from "date-fns/locale"
import { enUS } from "date-fns/locale"
import { pt } from "date-fns/locale"
import type { Locale as DateFnsLocale } from "date-fns"
import type { Locale } from "@/i18n/config"

const DATE_LOCALE_MAP: Record<Locale, DateFnsLocale> = {
  fr,
  en: enUS,
  pt,
}

/**
 * Returns the date-fns locale object for a given app locale.
 */
export function getDateLocale(locale: Locale): DateFnsLocale {
  return DATE_LOCALE_MAP[locale] ?? fr
}
