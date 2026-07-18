import type { BadgeProps } from "@/components/ui/badge"

export type BadgeTone = NonNullable<BadgeProps["variant"]>

type PresetEntry = { tone: BadgeTone; label?: string }

const CATEGORY_TONES: BadgeTone[] = [
  "info",
  "violet",
  "warning",
  "cyan",
  "rose",
  "orange",
  "success",
  "slate",
]

/** Couleur stable et reproductible à partir d'une chaîne (ex. nom de catégorie). */
export function toneFromString(value: string): BadgeTone {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CATEGORY_TONES[Math.abs(hash) % CATEGORY_TONES.length]!
}

export function resolvePreset(
  preset: keyof typeof BADGE_PRESETS,
  value: string
): PresetEntry | undefined {
  const group = BADGE_PRESETS[preset] as Record<string, PresetEntry>
  return group[value]
}

export const BADGE_PRESETS = {
  clientStatus: {
    actif: { tone: "success", label: "badges.clientStatus.actif" },
    suspendu: { tone: "destructive", label: "badges.clientStatus.suspendu" },
    vip: { tone: "violet", label: "badges.clientStatus.vip" },
  },
  clientType: {
    particulier: { tone: "info", label: "badges.clientType.particulier" },
    grossiste: { tone: "warning", label: "badges.clientType.grossiste" },
  },
  supplierType: {
    local: { tone: "slate", label: "badges.supplierType.local" },
    import: { tone: "cyan", label: "badges.supplierType.import" },
  },
  purchaseStatus: {
    DRAFT: { tone: "slate", label: "badges.purchaseStatus.DRAFT" },
    ORDERED: { tone: "info", label: "badges.purchaseStatus.ORDERED" },
    RECEIVED: { tone: "success", label: "badges.purchaseStatus.RECEIVED" },
    CANCELLED: { tone: "destructive", label: "badges.purchaseStatus.CANCELLED" },
  },
  saleStatus: {
    COMPLETED: { tone: "success", label: "badges.saleStatus.COMPLETED" },
    CANCELLED: { tone: "destructive", label: "badges.saleStatus.CANCELLED" },
    REFUNDED: { tone: "warning", label: "badges.saleStatus.REFUNDED" },
  },
  salePayment: {
    complete: { tone: "success", label: "badges.salePayment.complete" },
    partial: { tone: "destructive", label: "badges.salePayment.partial" },
  },
  cashSessionStatus: {
    OPEN: { tone: "primary-soft", label: "badges.cashSessionStatus.OPEN" },
    CLOSED: { tone: "slate", label: "badges.cashSessionStatus.CLOSED" },
  },
  cashVariance: {
    conforme: { tone: "success", label: "badges.cashVariance.conforme" },
    variance: { tone: "destructive", label: "badges.cashVariance.variance" },
  },
  activeState: {
    active: { tone: "success", label: "badges.activeState.active" },
    inactive: { tone: "destructive", label: "badges.activeState.inactive" },
  },
  paymentMethod: {
    CASH: { tone: "success", label: "badges.paymentMethod.CASH" },
    ORANGE_MONEY: { tone: "orange", label: "badges.paymentMethod.ORANGE_MONEY" },
    MOBILE_MONEY: { tone: "orange", label: "badges.paymentMethod.MOBILE_MONEY" },
    CARD: { tone: "info", label: "badges.paymentMethod.CARD" },
    TRANSFER: { tone: "violet", label: "badges.paymentMethod.TRANSFER" },
    OTHER: { tone: "slate", label: "badges.paymentMethod.OTHER" },
    CREDIT: { tone: "warning", label: "badges.paymentMethod.CREDIT" },
  },
  stockDelta: {
    positive: { tone: "success" },
    negative: { tone: "destructive" },
  },
  stockMovement: {
    PURCHASE: { tone: "success", label: "badges.stockMovement.PURCHASE" },
    SALE: { tone: "warning", label: "badges.stockMovement.SALE" },
    TRANSFER_IN: { tone: "info", label: "badges.stockMovement.TRANSFER_IN" },
    TRANSFER_OUT: { tone: "cyan", label: "badges.stockMovement.TRANSFER_OUT" },
    RETURN: { tone: "violet", label: "badges.stockMovement.RETURN" },
    CORRECTION: { tone: "slate", label: "badges.stockMovement.CORRECTION" },
  },
  auditAction: {
    CREATE_USER: { tone: "success", label: "badges.auditAction.CREATE_USER" },
    UPDATE_USER: { tone: "info", label: "badges.auditAction.UPDATE_USER" },
    ACTIVATE_USER: { tone: "success", label: "badges.auditAction.ACTIVATE_USER" },
    SUSPEND_USER: { tone: "destructive", label: "badges.auditAction.SUSPEND_USER" },
    UPDATE_EXCHANGE_RATE: { tone: "warning", label: "badges.auditAction.UPDATE_EXCHANGE_RATE" },
    CREATE_STORE: { tone: "success", label: "badges.auditAction.CREATE_STORE" },
    UPDATE_STORE: { tone: "info", label: "badges.auditAction.UPDATE_STORE" },
    ACTIVATE_STORE: { tone: "success", label: "badges.auditAction.ACTIVATE_STORE" },
    SUSPEND_STORE: { tone: "destructive", label: "badges.auditAction.SUSPEND_STORE" },
  },
  userRole: {
    admin: { tone: "violet", label: "badges.userRole.admin" },
    manager: { tone: "info", label: "badges.userRole.manager" },
    seller: { tone: "success", label: "badges.userRole.seller" },
  },
  notificationType: {
    STOCK_ALERT: { tone: "destructive", label: "badges.notificationType.STOCK_ALERT" },
    SALE: { tone: "success", label: "badges.notificationType.SALE" },
    PURCHASE: { tone: "info", label: "badges.notificationType.PURCHASE" },
    INFO: { tone: "cyan", label: "badges.notificationType.INFO" },
  },
} as const satisfies Record<string, Record<string, PresetEntry>>
