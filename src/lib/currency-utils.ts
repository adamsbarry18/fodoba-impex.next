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
  editable: boolean
  decimals: number
}

export const DEFAULT_RATES: Record<CurrencyCode, number> = {
  FCFA: 1,
  GNF: 0.065,
  USD: 600,
  EUR: 655.957,
}

export const CURRENCY_ORDER: CurrencyCode[] = ["FCFA", "GNF", "USD", "EUR"]

export const EDITABLE_CURRENCIES: CurrencyCode[] = ["GNF", "USD", "EUR"]

export const CURRENCY_META: Record<CurrencyCode, CurrencyMeta> = {
  FCFA: {
    code: "FCFA",
    label: "Franc CFA",
    symbol: "FCFA",
    tone: "primary-soft",
    icon: CircleDollarSign,
    editable: false,
    decimals: 0,
  },
  GNF: {
    code: "GNF",
    label: "Franc guinéen",
    symbol: "GNF",
    tone: "warning",
    icon: Coins,
    editable: true,
    decimals: 4,
  },
  USD: {
    code: "USD",
    label: "Dollar US",
    symbol: "$",
    tone: "success",
    icon: DollarSign,
    editable: true,
    decimals: 2,
  },
  EUR: {
    code: "EUR",
    label: "Euro",
    symbol: "€",
    tone: "info",
    icon: Euro,
    editable: true,
    decimals: 3,
  },
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
