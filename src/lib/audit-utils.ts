import type { LucideIcon } from "lucide-react"
import {
  UserPlus,
  UserPen,
  UserCheck,
  UserX,
  Coins,
  ShieldAlert,
  Store,
} from "lucide-react"
import type { AuditAction, AuditCategory } from "@/lib/types"
import type { BadgeTone } from "@/lib/badge-tones"

export type AuditActionConfig = {
  label: string
  tone: BadgeTone
  category: AuditCategory
  icon: LucideIcon
}

export const AUDIT_ACTION_CONFIG: Record<string, AuditActionConfig> = {
  CREATE_USER: {
    label: "Création utilisateur",
    tone: "success",
    category: "user",
    icon: UserPlus,
  },
  UPDATE_USER: {
    label: "Modification profil",
    tone: "info",
    category: "user",
    icon: UserPen,
  },
  ACTIVATE_USER: {
    label: "Activation compte",
    tone: "success",
    category: "user",
    icon: UserCheck,
  },
  SUSPEND_USER: {
    label: "Suspension compte",
    tone: "destructive",
    category: "user",
    icon: UserX,
  },
  UPDATE_EXCHANGE_RATE: {
    label: "Taux de change",
    tone: "warning",
    category: "currency",
    icon: Coins,
  },
  CREATE_STORE: {
    label: "Création boutique",
    tone: "success",
    category: "system",
    icon: Store,
  },
  UPDATE_STORE: {
    label: "Modification boutique",
    tone: "info",
    category: "system",
    icon: Store,
  },
  ACTIVATE_STORE: {
    label: "Activation boutique",
    tone: "success",
    category: "system",
    icon: Store,
  },
  SUSPEND_STORE: {
    label: "Suspension boutique",
    tone: "destructive",
    category: "system",
    icon: Store,
  },
}

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, string> = {
  user: "Utilisateurs & accès",
  currency: "Devises & taux",
  system: "Système",
}

export function getAuditActionConfig(action: AuditAction): AuditActionConfig {
  return (
    AUDIT_ACTION_CONFIG[action] ?? {
      label: action.replace(/_/g, " ").toLowerCase(),
      tone: "slate",
      category: "system",
      icon: ShieldAlert,
    }
  )
}

export function formatAuditPerformer(log: {
  performedBy: string
  performedByName?: string
}): string {
  if (log.performedByName) return log.performedByName
  if (log.performedBy === "system") return "Système"
  return log.performedBy
}
