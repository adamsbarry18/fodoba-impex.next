import { z } from "zod"
import type { CurrencyCode } from "@/lib/types"
import type { LandedCostOutput } from "@/lib/calculations"

export const PURCHASE_CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "CNY", label: "CNY (¥)" },
] as const

export const TARGET_CURRENCIES = [
  { value: "FCFA", label: "FCFA (référence)" },
  { value: "GNF", label: "GNF" },
] as const

export const LandedCostFormSchema = z.object({
  purchasePrice: z.coerce.number().min(0.01, "Prix unitaire requis"),
  purchaseCurrency: z.string().min(1),
  transportFees: z.coerce.number().min(0),
  customsDutyPercentage: z.coerce.number().min(0).max(100),
  otherFees: z.coerce.number().min(0),
  targetCurrency: z.string().min(1),
  exchangeRateToTargetCurrency: z.coerce.number().min(0.0001, "Taux invalide"),
})

export type LandedCostFormValues = z.infer<typeof LandedCostFormSchema>

export function suggestExchangeRate(
  purchaseCurrency: string,
  targetCurrency: string,
  rates: Record<CurrencyCode, number>
): number | null {
  const foreign = purchaseCurrency as CurrencyCode
  if (!(foreign in rates) && purchaseCurrency !== "CNY") return null

  if (targetCurrency === "FCFA") {
    if (purchaseCurrency === "CNY") return null
    return rates[foreign] ?? null
  }

  if (targetCurrency === "GNF") {
    if (purchaseCurrency === "CNY") return null
    const toFcfa = rates[foreign]
    const gnfRate = rates.GNF
    if (!toFcfa || !gnfRate) return null
    return toFcfa / gnfRate
  }

  return null
}

export function getCostBreakdownRows(
  result: LandedCostOutput,
  customsPercent: number
) {
  return [
    { label: "Prix d'achat de base", value: result.costBreakdown.purchasePrice, additive: false },
    { label: "Transport & logistique", value: result.costBreakdown.transportFees, additive: true },
    {
      label: `Droits de douane (${customsPercent} %)`,
      value: result.costBreakdown.customsDuty,
      additive: true,
    },
    { label: "Autres frais de dossier", value: result.costBreakdown.otherFees, additive: true },
  ]
}

export const LANDED_COST_DEFAULTS: LandedCostFormValues = {
  purchasePrice: 10,
  purchaseCurrency: "USD",
  transportFees: 2,
  customsDutyPercentage: 5,
  otherFees: 0.5,
  targetCurrency: "FCFA",
  exchangeRateToTargetCurrency: 600,
}
