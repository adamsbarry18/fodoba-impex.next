import type { DocumentData } from "firebase/firestore"

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

/**
 * Supprime les clés `undefined` (y compris imbriquées) avant écriture Firestore.
 * Firestore rejette les valeurs `undefined` (contrairement à `null`).
 * Les sentinelles FieldValue (ex. serverTimestamp) sont conservées telles quelles.
 */
export function stripUndefined<T extends DocumentData>(obj: T): DocumentData {
  const result: DocumentData = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue
    if (isPlainObject(value)) {
      result[key] = stripUndefined(value as DocumentData)
    } else {
      result[key] = value
    }
  }
  return result
}
