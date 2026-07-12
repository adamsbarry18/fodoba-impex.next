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
    actif: { tone: "success", label: "Actif" },
    suspendu: { tone: "destructive", label: "Suspendu" },
    vip: { tone: "violet", label: "VIP" },
  },
  clientType: {
    particulier: { tone: "info", label: "Particulier" },
    grossiste: { tone: "warning", label: "Grossiste" },
  },
  supplierType: {
    local: { tone: "slate", label: "Local" },
    import: { tone: "cyan", label: "Import" },
  },
  purchaseStatus: {
    DRAFT: { tone: "slate", label: "Brouillon" },
    ORDERED: { tone: "info", label: "Commandé" },
    RECEIVED: { tone: "success", label: "Reçu" },
    CANCELLED: { tone: "destructive", label: "Annulé" },
  },
  saleStatus: {
    COMPLETED: { tone: "success", label: "Terminée" },
    CANCELLED: { tone: "destructive", label: "Annulée" },
    REFUNDED: { tone: "warning", label: "Remboursée" },
  },
  salePayment: {
    complete: { tone: "success", label: "Complet" },
    partial: { tone: "destructive", label: "Partiel" },
  },
  cashSessionStatus: {
    OPEN: { tone: "primary-soft", label: "Ouverte" },
    CLOSED: { tone: "slate", label: "Clôturée" },
  },
  cashVariance: {
    conforme: { tone: "success", label: "Conforme" },
    variance: { tone: "destructive", label: "Écart" },
  },
  activeState: {
    active: { tone: "success", label: "Actif" },
    inactive: { tone: "destructive", label: "Inactif" },
  },
  paymentMethod: {
    CASH: { tone: "success", label: "Espèces" },
    ORANGE_MONEY: { tone: "orange", label: "Orange Money" },
    MOBILE_MONEY: { tone: "orange", label: "Mobile Money" },
    CARD: { tone: "info", label: "Carte bancaire" },
    TRANSFER: { tone: "violet", label: "Virement" },
    OTHER: { tone: "slate", label: "Autres" },
    CREDIT: { tone: "warning", label: "Crédit" },
  },
  stockDelta: {
    positive: { tone: "success" },
    negative: { tone: "destructive" },
  },
  stockMovement: {
    PURCHASE: { tone: "success", label: "Achat / Entrée" },
    SALE: { tone: "warning", label: "Vente" },
    TRANSFER_IN: { tone: "info", label: "Transfert (Entrée)" },
    TRANSFER_OUT: { tone: "cyan", label: "Transfert (Sortie)" },
    RETURN: { tone: "violet", label: "Retour client" },
    CORRECTION: { tone: "slate", label: "Correction inventaire" },
  },
  auditAction: {
    CREATE_USER: { tone: "success", label: "Création utilisateur" },
    UPDATE_USER: { tone: "info", label: "Modification profil" },
    ACTIVATE_USER: { tone: "success", label: "Activation compte" },
    SUSPEND_USER: { tone: "destructive", label: "Suspension compte" },
    UPDATE_EXCHANGE_RATE: { tone: "warning", label: "Taux de change" },
    CREATE_STORE: { tone: "success", label: "Création boutique" },
    UPDATE_STORE: { tone: "info", label: "Modification boutique" },
    ACTIVATE_STORE: { tone: "success", label: "Activation boutique" },
    SUSPEND_STORE: { tone: "destructive", label: "Suspension boutique" },
  },
  userRole: {
    admin: { tone: "violet", label: "Administrateur" },
    manager: { tone: "info", label: "Gérant" },
    seller: { tone: "success", label: "Vendeur" },
  },
  notificationType: {
    STOCK_ALERT: { tone: "destructive", label: "Alerte stock" },
    SALE: { tone: "success", label: "Vente" },
    PURCHASE: { tone: "info", label: "Achat" },
    INFO: { tone: "cyan", label: "Information" },
  },
} as const satisfies Record<string, Record<string, PresetEntry>>
