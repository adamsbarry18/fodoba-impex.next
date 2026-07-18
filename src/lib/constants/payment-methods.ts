import type { PaymentMethod } from "@/lib/types"
import frMessages from "@/i18n/messages/fr.json"
import { getNestedMessage, nestMessages } from "@/i18n/nest-messages"

const nestedFrMessages = nestMessages(frMessages)

export type PosPaymentMode = "comptant" | "partiel" | "credit" | "fractionne"

export const PAYMENT_METHOD_OPTIONS: {
  id: PaymentMethod
  label: string
}[] = [
  { id: "CASH", label: "payment.cash" },
  { id: "ORANGE_MONEY", label: "payment.orangeMoney" },
  { id: "MOBILE_MONEY", label: "payment.mobileMoney" },
  { id: "CARD", label: "payment.card" },
  { id: "TRANSFER", label: "payment.transfer" },
  { id: "OTHER", label: "payment.other" },
]

/** Modes standards (comptant, caisse, dépenses). */
export const POS_PAYMENT_METHODS = PAYMENT_METHOD_OPTIONS.filter((m) => m.id !== "OTHER")

/** Modes du paiement fractionné (inclut Autres). */
export const POS_FRACTIONAL_METHODS = PAYMENT_METHOD_OPTIONS

export const PAYMENT_METHOD_IDS = PAYMENT_METHOD_OPTIONS.map((m) => m.id)

/** Retourne la clé i18n du mode de paiement (à passer à `t()`). */
export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_OPTIONS.find((m) => m.id === method)?.label ?? method
}

/** Libellé FR pour exports PDF (hors composants React). */
export function getPaymentMethodLabelFr(method: string): string {
  const key = getPaymentMethodLabel(method)
  return getNestedMessage(nestedFrMessages, key) ?? method
}

export const EMPTY_PAYMENT_AMOUNTS = (): Record<PaymentMethod, string> => ({
  CASH: "",
  ORANGE_MONEY: "",
  MOBILE_MONEY: "",
  CARD: "",
  TRANSFER: "",
  OTHER: "",
})

export function buildSalePayments(
  mode: PosPaymentMode,
  total: number,
  amounts: Record<PaymentMethod, string>,
  comptantMethod: PaymentMethod
): { payments: { method: PaymentMethod; amount: number }[]; debtAmount: number } {
  if (mode === "credit") {
    return { payments: [], debtAmount: total }
  }

  if (mode === "partiel") {
    const paid = Math.min(Math.max(0, Number(amounts[comptantMethod]) || 0), total)
    const payments =
      paid > 0 ? [{ method: comptantMethod, amount: paid }] : []
    return { payments, debtAmount: Math.max(0, total - paid) }
  }

  const methodList = mode === "fractionne" ? POS_FRACTIONAL_METHODS : POS_PAYMENT_METHODS

  const entries =
    mode === "comptant"
      ? [{ method: comptantMethod, amount: Number(amounts[comptantMethod]) || total }]
      : methodList
          .map(({ id }) => ({
            method: id,
            amount: Number(amounts[id]) || 0,
          }))
          .filter((e) => e.amount > 0)

  let remaining = total
  const payments: { method: PaymentMethod; amount: number }[] = []

  for (const entry of entries) {
    const applied = Math.min(entry.amount, remaining)
    if (applied > 0) {
      payments.push({ method: entry.method, amount: applied })
      remaining -= applied
    }
  }

  return { payments, debtAmount: Math.max(0, remaining) }
}
