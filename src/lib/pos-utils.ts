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
  label: string
  shortLabel: string
  description: string
  icon: LucideIcon
  tone: "success" | "warning" | "info" | "violet"
}[] = [
  {
    id: "comptant",
    label: "Comptant",
    shortLabel: "Intégral",
    description: "Encaissement total en un seul mode",
    icon: Wallet,
    tone: "success",
  },
  {
    id: "partiel",
    label: "Partiel",
    shortLabel: "Acompte + crédit",
    description: "Partie encaissée, solde en dette client",
    icon: HandCoins,
    tone: "warning",
  },
  {
    id: "credit",
    label: "Crédit",
    shortLabel: "100 % crédit",
    description: "Aucun encaissement - dette client",
    icon: CreditCard,
    tone: "info",
  },
  {
    id: "fractionne",
    label: "Fractionné",
    shortLabel: "Multi-modes",
    description: "Répartition sur plusieurs lignes de caisse",
    icon: Split,
    tone: "violet",
  },
]
