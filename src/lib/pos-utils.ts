import type { SaleItem } from "@/lib/types"
import type { PosPaymentMode } from "@/lib/constants/payment-methods"
import type { LucideIcon } from "lucide-react"
import { Wallet, HandCoins, CreditCard, Split } from "lucide-react"

export function getCartItemCount(cart: SaleItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}

export function getCartSubtotal(cart: SaleItem[]): number {
  return cart.reduce((acc, item) => acc + item.total, 0)
}

export function applyCartDiscount(subtotal: number, discount: number): number {
  return Math.max(subtotal - discount, 0)
}

export const POS_PAYMENT_MODES: {
  id: PosPaymentMode
  labelKey: string
  shortLabelKey: string
  descriptionKey: string
  icon: LucideIcon
  tone: "success" | "warning" | "info" | "violet"
}[] = [
  {
    id: "comptant",
    labelKey: "pos.mode.comptant.label",
    shortLabelKey: "pos.mode.comptant.short",
    descriptionKey: "pos.mode.comptant.desc",
    icon: Wallet,
    tone: "success",
  },
  {
    id: "partiel",
    labelKey: "pos.mode.partiel.label",
    shortLabelKey: "pos.mode.partiel.short",
    descriptionKey: "pos.mode.partiel.desc",
    icon: HandCoins,
    tone: "warning",
  },
  {
    id: "credit",
    labelKey: "pos.mode.credit.label",
    shortLabelKey: "pos.mode.credit.short",
    descriptionKey: "pos.mode.credit.desc",
    icon: CreditCard,
    tone: "info",
  },
  {
    id: "fractionne",
    labelKey: "pos.mode.fractionne.label",
    shortLabelKey: "pos.mode.fractionne.short",
    descriptionKey: "pos.mode.fractionne.desc",
    icon: Split,
    tone: "violet",
  },
]

