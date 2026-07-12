import { CashSession, CashMovement } from "@/lib/types"

export const MOVEMENT_SOURCE_LABELS: Record<CashMovement["source"], string> = {
  SALE: "Vente",
  EXPENSE: "Dépense",
  PURCHASE_PAYMENT: "Paiement achat",
  CLIENT_PAYMENT: "Remboursement client",
  ADJUSTMENT: "Ajustement",
  FUND_ENTRY: "Alimentation caisse",
  FUND_WITHDRAWAL: "Retrait caisse",
}

export const FUND_OPERATION_TYPES = [
  {
    value: "IN" as const,
    label: "Alimentation",
    description: "Ajout de fonds dans une ligne de caisse",
    hint: "Apport de fonds de roulement, complément monnaie…",
  },
  {
    value: "OUT" as const,
    label: "Retrait",
    description: "Sortie exceptionnelle hors vente ou dépense",
    hint: "Versement banque, retrait sécurisé, correction…",
  },
] as const

export type FundOperationType = (typeof FUND_OPERATION_TYPES)[number]["value"]

export function getMovementStats(movements: CashMovement[]) {
  return movements.reduce(
    (acc, m) => {
      if (m.type === "IN") acc.totalIn += m.amount
      else acc.totalOut += m.amount
      acc.count += 1
      return acc
    },
    { totalIn: 0, totalOut: 0, count: 0 }
  )
}

export function getSessionTotals(session: CashSession) {
  const totalExpected = Object.values(session.expectedBalances).reduce((a, b) => a + b, 0)
  const totalActual = session.actualBalances
    ? Object.values(session.actualBalances).reduce((a, b) => a + b, 0)
    : totalExpected
  const totalVar = session.variances
    ? Object.values(session.variances).reduce((a, b) => a + b, 0)
    : 0
  return { totalExpected, totalActual, totalVar }
}

export function getCashAuditSummary(sessions: CashSession[]) {
  const totalVariance = sessions.reduce((acc, s) => {
    if (!s.variances) return acc
    return acc + Object.values(s.variances).reduce((sum, v) => sum + v, 0)
  }, 0)

  const closedSessions = sessions.filter((s) => s.status === "CLOSED")
  const conformSessions = closedSessions.filter((s) => {
    if (!s.variances) return true
    return Object.values(s.variances).every((v) => v === 0)
  })

  const denominator = closedSessions.length || sessions.length
  const reliabilityPercent =
    denominator > 0 ? Math.round((conformSessions.length / denominator) * 100) : 100

  return {
    totalVariance,
    reliabilityPercent,
    sessionCount: sessions.length,
    closedCount: closedSessions.length,
    conformCount: conformSessions.length,
  }
}
