import type { Store } from "@/lib/types"
import type { BadgeTone } from "@/lib/badge-tones"

export const STORE_CODE_HINT = "FI-B1"
export const STORE_CODE_EXAMPLE = "FI-B2"

/** Format attendu : préfixe + tiret + identifiant (ex. FI-B1). */
export const STORE_CODE_REGEX = /^[A-Z]{2}-[A-Z0-9]{1,6}$/i

export function normalizeStoreCode(code: string): string {
  return code.trim().toUpperCase()
}

export function getStoreInitials(store: Pick<Store, "name" | "code">): string {
  const fromCode = store.code.replace(/[^A-Z0-9]/gi, "").slice(0, 2)
  if (fromCode.length >= 2) return fromCode.toUpperCase()
  return store.name.slice(0, 2).toUpperCase() || "?"
}

export function validateStoreCodeFormat(code: string): string | null {
  const normalized = normalizeStoreCode(code)
  if (normalized.length < 2) return "Le code est requis."
  if (!STORE_CODE_REGEX.test(normalized)) {
    return `Format attendu : ${STORE_CODE_HINT} (lettres, chiffres, tiret).`
  }
  return null
}

export function getStoreStatusTone(active: boolean): BadgeTone {
  return active ? "success" : "destructive"
}

export function formatStoreCreatedAt(createdAt: Store["createdAt"]): Date | null {
  if (!createdAt) return null
  return createdAt.toDate ? createdAt.toDate() : new Date(createdAt)
}
