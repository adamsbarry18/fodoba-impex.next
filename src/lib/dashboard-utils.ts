import type { Sale, Client, Supplier, CashSession } from "@/lib/types"
import {
  format,
  startOfDay,
  endOfDay,
  isWithinInterval,
  subDays,
  subMonths,
  eachMonthOfInterval,
} from "date-fns"
import { fr } from "date-fns/locale"

export type DashboardTimeRange = "24h" | "7d" | "30d" | "3m" | "12m"

export const DASHBOARD_TIME_RANGES: { value: DashboardTimeRange; label: string }[] = [
  { value: "24h", label: "Dernières 24 h" },
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "3m", label: "3 derniers mois" },
  { value: "12m", label: "12 derniers mois" },
]

export function toSaleDate(ts: Sale["timestamp"]): Date {
  return ts?.toDate ? ts.toDate() : new Date(ts)
}

export function getRangeInterval(timeRange: DashboardTimeRange, now = new Date()) {
  let startDate: Date
  switch (timeRange) {
    case "24h":
      startDate = subDays(now, 1)
      break
    case "7d":
      startDate = subDays(now, 7)
      break
    case "30d":
      startDate = subDays(now, 30)
      break
    case "3m":
      startDate = subMonths(now, 3)
      break
    case "12m":
      startDate = subMonths(now, 12)
      break
    default:
      startDate = subDays(now, 7)
  }
  return { start: startOfDay(startDate), end: endOfDay(now) }
}

export function filterSalesByRange(
  sales: Sale[],
  timeRange: DashboardTimeRange,
  now = new Date()
): Sale[] {
  const interval = getRangeInterval(timeRange, now)
  return sales.filter((s) => isWithinInterval(toSaleDate(s.timestamp), interval))
}

export function buildDashboardChartData(
  sales: Sale[],
  timeRange: DashboardTimeRange,
  now = new Date()
): { name: string; sales: number }[] {
  const interval = getRangeInterval(timeRange, now)

  if (timeRange === "12m" || timeRange === "3m") {
    const months = eachMonthOfInterval(interval)
    return months.map((m) => {
      const monthSales = sales
        .filter((s) => format(toSaleDate(s.timestamp), "yyyy-MM") === format(m, "yyyy-MM"))
        .reduce((acc, s) => acc + s.total, 0)
      return { name: format(m, "MMM", { locale: fr }), sales: monthSales }
    })
  }

  const daysCount = timeRange === "24h" ? 1 : timeRange === "7d" ? 7 : 30
  return Array.from({ length: daysCount }, (_, i) => {
    const date = subDays(now, daysCount - 1 - i)
    const daySales = sales
      .filter(
        (s) => format(toSaleDate(s.timestamp), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      )
      .reduce((acc, s) => acc + s.total, 0)
    return { name: format(date, "EEE", { locale: fr }), sales: daySales }
  })
}

export function getDashboardStats(
  sales: Sale[],
  clients: Client[],
  suppliers: Supplier[],
  timeRange: DashboardTimeRange,
  cashSession: CashSession | null
) {
  const filteredSales = filterSalesByRange(sales, timeRange)
  const periodRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0)
  const totalClientDebt = clients.reduce((acc, c) => acc + (c.currentDebt || 0), 0)
  const totalSupplierDebt = suppliers.reduce((acc, s) => acc + (s.currentDebt || 0), 0)
  const cashTotal = cashSession
    ? Object.values(cashSession.expectedBalances).reduce((a, b) => a + b, 0)
    : 0
  const cashCash = cashSession?.expectedBalances?.CASH || 0

  return {
    periodRevenue,
    salesCount: filteredSales.length,
    totalClientDebt,
    totalSupplierDebt,
    cashTotal,
    cashCash,
    chartData: buildDashboardChartData(sales, timeRange),
    isCashOpen: !!cashSession,
  }
}
