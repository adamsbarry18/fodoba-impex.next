import type { DocumentData } from "firebase/firestore"

/**
 * Supprime les clés `undefined` d'un objet avant écriture Firestore.
 * Firestore rejette les valeurs `undefined` (contrairement à `null`).
 */
export function stripUndefined<T extends DocumentData>(obj: T): DocumentData {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as DocumentData
}
