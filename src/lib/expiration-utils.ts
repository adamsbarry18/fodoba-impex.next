export const EXPIRATION_WARNING_DAYS = 30

export type ExpirationStatus = "none" | "ok" | "warning" | "expired"

export function parseExpirationDate(value?: string): Date | null {
  if (!value?.trim()) return null

  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return null

  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function getDaysUntilExpiration(
  expirationDate?: string,
  referenceDate = new Date()
): number | null {
  const expiration = parseExpirationDate(expirationDate)
  if (!expiration) return null

  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  )
  const exp = new Date(
    expiration.getFullYear(),
    expiration.getMonth(),
    expiration.getDate()
  )

  const diffMs = exp.getTime() - ref.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function getExpirationStatus(expirationDate?: string): ExpirationStatus {
  const days = getDaysUntilExpiration(expirationDate)
  if (days === null) return "none"
  if (days < 0) return "expired"
  if (days < EXPIRATION_WARNING_DAYS) return "warning"
  return "ok"
}

export function isExpirationUrgent(expirationDate?: string): boolean {
  const status = getExpirationStatus(expirationDate)
  return status === "warning" || status === "expired"
}

export function shouldNotifyExpiration(expirationDate?: string): boolean {
  return isExpirationUrgent(expirationDate)
}
