import type { LucideIcon } from "lucide-react"
import { CircleDollarSign, Coins, DollarSign, Euro } from "lucide-react"
import type { CurrencyCode } from "@/lib/types"
import type { BadgeTone } from "@/lib/badge-tones"

export type CurrencyMeta = {
  code: CurrencyCode
  label: string
  symbol: string
  tone: BadgeTone
  icon: LucideIcon
  decimals: number
}

/** Devise de stockage / comptable (montants Firestore). */
export const STORAGE_CURRENCY: CurrencyCode = "FCFA"

export const DEFAULT_RATES: Record<CurrencyCode, number> = {
  FCFA: 1,
  GNF: 0.065,
  USD: 600,
  EUR: 655.957,
}

export const CURRENCY_ORDER: CurrencyCode[] = ["FCFA", "GNF", "USD", "EUR"]

/** @deprecated Préférer editableCurrencies(referenceCurrency) */
export const EDITABLE_CURRENCIES: CurrencyCode[] = ["GNF", "USD", "EUR"]

export const CURRENCY_META: Record<CurrencyCode, CurrencyMeta> = {
  FCFA: {
    code: "FCFA",
    label: "Franc CFA",
    symbol: "FCFA",
    tone: "primary-soft",
    icon: CircleDollarSign,
    decimals: 0,
  },
  GNF: {
    code: "GNF",
    label: "Franc guinéen",
    symbol: "GNF",
    tone: "warning",
    icon: Coins,
    decimals: 4,
  },
  USD: {
    code: "USD",
    label: "Dollar US",
    symbol: "$",
    tone: "success",
    icon: DollarSign,
    decimals: 2,
  },
  EUR: {
    code: "EUR",
    label: "Euro",
    symbol: "€",
    tone: "info",
    icon: Euro,
    decimals: 3,
  },
}

export function isValidCurrencyCode(code: string): code is CurrencyCode {
  return (CURRENCY_ORDER as string[]).includes(code)
}

export function isReferenceCurrency(
  code: CurrencyCode,
  reference: CurrencyCode
): boolean {
  return code === reference
}

/**
 * Taux « 1 unité de `from` = X unités de `to` », via les taux stockés vers FCFA.
 */
export function rateBetween(
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Record<CurrencyCode, number>
): number {
  if (from === to) return 1
  const fromToFcfa = rates[from] ?? DEFAULT_RATES[from] ?? 1
  const toToFcfa = rates[to] ?? DEFAULT_RATES[to] ?? 1
  if (toToFcfa === 0) return 0
  return fromToFcfa / toToFcfa
}

/** Convertit un montant FCFA (stockage) vers la devise de référence d’affichage. */
export function storageToReference(
  amountFcfa: number,
  reference: CurrencyCode,
  rates: Record<CurrencyCode, number>
): number {
  if (reference === STORAGE_CURRENCY) return amountFcfa
  const rate = rates[reference] ?? DEFAULT_RATES[reference] ?? 1
  if (rate === 0) return 0
  return amountFcfa / rate
}

/** Convertit un montant en devise de référence vers FCFA (stockage). */
export function referenceToStorage(
  amountRef: number,
  reference: CurrencyCode,
  rates: Record<CurrencyCode, number>
): number {
  if (reference === STORAGE_CURRENCY) return amountRef
  const rate = rates[reference] ?? DEFAULT_RATES[reference] ?? 1
  return amountRef * rate
}

/**
 * Convertit un montant d’une devise vers FCFA (stockage).
 * `rates[code]` = valeur de 1 unité en FCFA.
 */
export function toStorage(
  amount: number,
  from: CurrencyCode,
  rates: Record<CurrencyCode, number>
): number {
  if (from === STORAGE_CURRENCY) return amount
  return amount * (rates[from] ?? DEFAULT_RATES[from] ?? 1)
}

/**
 * Convertit un montant FCFA vers une autre devise.
 */
export function fromStorage(
  amountFcfa: number,
  to: CurrencyCode,
  rates: Record<CurrencyCode, number>
): number {
  if (to === STORAGE_CURRENCY) return amountFcfa
  const rate = rates[to] ?? DEFAULT_RATES[to] ?? 1
  if (rate === 0) return 0
  return amountFcfa / rate
}

/**
 * À partir d’un taux affiché « 1 code = x reference », calcule le rateToRef (vers FCFA).
 */
export function displayedRateToStorageRate(
  code: CurrencyCode,
  displayedRateVsRef: number,
  reference: CurrencyCode,
  rates: Record<CurrencyCode, number>
): number {
  if (code === STORAGE_CURRENCY) {
    // 1 FCFA = displayedRateVsRef REF → rate(REF) = 1 / displayedRateVsRef
    if (displayedRateVsRef <= 0) return rates[reference] ?? DEFAULT_RATES[reference]
    return 1 / displayedRateVsRef
  }
  if (reference === STORAGE_CURRENCY) {
    return displayedRateVsRef
  }
  const refToFcfa = rates[reference] ?? DEFAULT_RATES[reference] ?? 1
  return displayedRateVsRef * refToFcfa
}

export function editableCurrencies(reference: CurrencyCode): CurrencyCode[] {
  return CURRENCY_ORDER.filter((code) => code !== reference)
}

export function formatRate(value: number, code: CurrencyCode): string {
  const decimals = CURRENCY_META[code].decimals
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function validateRate(value: number): string | null {
  if (!Number.isFinite(value)) return "Saisissez un nombre valide."
  if (value <= 0) return "Le taux doit être strictement positif."
  if (value > 1_000_000) return "Le taux semble trop élevé. Vérifiez la valeur."
  return null
}

export type AppCurrencySettings = {
  referenceCurrency: CurrencyCode
  updatedAt?: unknown
  updatedBy?: string
}

export const DEFAULT_APP_SETTINGS: AppCurrencySettings = {
  referenceCurrency: STORAGE_CURRENCY,
}
