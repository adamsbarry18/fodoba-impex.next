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
  prenom: string
  nom: string
}): string {
  return `${user.prenom} ${user.nom}`.trim()
}

export function getUserInitials(user: {
  prenom: string
  nom: string
}): string {
  const prenom = user.prenom?.charAt(0) ?? ""
  const nom = user.nom?.charAt(0) ?? ""
  return `${prenom}${nom}`.toUpperCase() || "?"
}

export function getUserAvatarSeed(user: {
  uid?: string
  email?: string
  prenom?: string
  nom?: string
}): string {
  return user.uid || user.email || `${user.prenom ?? ""}${user.nom ?? ""}` || "user"
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
