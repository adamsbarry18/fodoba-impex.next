"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { NextIntlClientProvider, useTranslations } from "next-intl"
import {
  type Locale,
  DEFAULT_LOCALE,
  LOCALES,
  STORAGE_KEY,
} from "@/i18n/config"
import { nestMessages } from "@/i18n/nest-messages"

/* ---------- lazy message loaders ---------- */

const MESSAGE_LOADERS: Record<Locale, () => Promise<ReturnType<typeof nestMessages>>> = {
  fr: () => import("@/i18n/messages/fr.json").then((m) => nestMessages(m.default)),
  en: () => import("@/i18n/messages/en.json").then((m) => nestMessages(m.default)),
  pt: () => import("@/i18n/messages/pt.json").then((m) => nestMessages(m.default)),
}

/* ---------- context ---------- */

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => { },
})

/* ---------- helpers ---------- */

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && LOCALES.includes(stored as Locale)) return stored as Locale
  return DEFAULT_LOCALE
}

/* ---------- provider ---------- */

interface I18nProviderProps {
  children: React.ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [messages, setMessages] = useState<ReturnType<typeof nestMessages> | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate locale from localStorage after mount
  useEffect(() => {
    const stored = readStoredLocale()
    setLocaleState(stored)
    setHydrated(true)
  }, [])

  // Load messages whenever locale changes
  useEffect(() => {
    if (!hydrated) return
    let cancelled = false
    MESSAGE_LOADERS[locale]().then((msgs) => {
      if (!cancelled) setMessages(msgs)
    })
    return () => {
      cancelled = true
    }
  }, [locale, hydrated])

  // Update <html lang> attribute
  useEffect(() => {
    if (hydrated) {
      document.documentElement.lang = locale
    }
  }, [locale, hydrated])

  const setLocale = useCallback((newLocale: Locale) => {
    if (!LOCALES.includes(newLocale)) return
    localStorage.setItem(STORAGE_KEY, newLocale)
    setLocaleState(newLocale)
  }, [])

  const ctxValue = useMemo<I18nContextValue>(
    () => ({ locale, setLocale }),
    [locale, setLocale]
  )

  // While loading messages or not yet hydrated, render nothing (avoids flicker)
  if (!hydrated || messages === null) return null

  return (
    <I18nContext.Provider value={ctxValue}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  )
}

/* ---------- hooks ---------- */

/**
 * Access locale + setLocale from any client component.
 */
export function useLocale(): I18nContextValue {
  return useContext(I18nContext)
}

/**
 * Convenience re-export of `useTranslations` from next-intl.
 * Usage: const t = useT()  →  t("common.save")
 */
export function useT() {
  return useTranslations()
}
