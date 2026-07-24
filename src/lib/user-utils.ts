import type { LucideIcon } from "lucide-react"
import { Shield, Store, UserRound } from "lucide-react"
import type { Role } from "@/lib/types"
import type { BadgeTone } from "@/lib/badge-tones"

export type RoleMeta = {
  value: Role
  label: string
  shortLabel: string
  description: string
  tone: BadgeTone
  icon: LucideIcon
}

export const ROLE_ORDER: Role[] = ["admin", "manager", "seller"]

export const ROLE_META: Record<Role, RoleMeta> = {
  admin: {
    value: "admin",
    label: "Administrateur",
    shortLabel: "Admin",
    description: "Accès total : boutiques, utilisateurs, devises et rapports consolidés.",
    tone: "violet",
    icon: Shield,
  },
  manager: {
    value: "manager",
    label: "Gérant",
    shortLabel: "Gérant",
    description: "Gestion des boutiques assignées : stock, achats, caisse et rapports locaux.",
    tone: "info",
    icon: Store,
  },
  seller: {
    value: "seller",
    label: "Vendeur",
    shortLabel: "Vendeur",
    description: "Caisse, ventes et consultation du stock des boutiques autorisées.",
    tone: "success",
    icon: UserRound,
  },
}

export function getRoleMeta(role: Role): RoleMeta {
  return ROLE_META[role]
}

export function getUserDisplayName(user: {
  firstName: string
  lastName: string
}): string {
  return `${user.firstName} ${user.lastName}`.trim()
}

/**
 * Déduit un prénom à partir de l'email Auth (ex. mamadou@gmail.com → Mamadou).
 */
export function extractFirstNameFromEmail(email: string): string {
  const localPart = email.split("@")[0]?.trim() ?? ""
  const token = localPart.split(/[._+\-]/).find((part) => part.length > 0) ?? localPart
  if (!token) return "Admin"
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
}

export function getUserInitials(user: {
  firstName: string
  lastName: string
}): string {
  const firstInitial = user.firstName?.charAt(0) ?? ""
  const lastInitial = user.lastName?.charAt(0) ?? ""
  return `${firstInitial}${lastInitial}`.toUpperCase() || "?"
}

export function getUserAvatarSeed(user: {
  uid?: string
  email?: string
  firstName?: string
  lastName?: string
}): string {
  return user.uid || user.email || `${user.firstName ?? ""}${user.lastName ?? ""}` || "user"
}

/** Couleur d'avatar stable et distincte par utilisateur (dérivée du seed). */
export function getUserAvatarStyle(seed: string): {
  backgroundColor: string
  color: string
} {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360
  const saturation = 58 + (Math.abs(hash >> 8) % 18)
  const lightness = 40 + (Math.abs(hash >> 16) % 14)

  return {
    backgroundColor: `hsl(${hue} ${saturation}% ${lightness}%)`,
    color: "#ffffff",
  }
}
