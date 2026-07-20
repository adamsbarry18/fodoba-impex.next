import { format } from "date-fns"
import type { Sale, Store } from "@/lib/types"
import { getSaleClientDisplayName, isRegisteredSaleClient } from "@/lib/sale-client-utils"

type SalesCsvLabels = {
  walkIn: string
  headers: {
    date: string
    ref: string
    client: string
    phone: string
    clientType: string
    seller: string
    store: string
    total: string
    status: string
    payment: string
  }
  paymentComplete: string
  paymentPartial: string
  clientTypeParticulier: string
  clientTypeGrossiste: string
}

function escapeCsv(value: string | number): string {
  const str = String(value ?? "")
  if (/[",;\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatSaleTimestamp(sale: Sale): string {
  if (!sale.timestamp?.toDate) return "-"
  return format(sale.timestamp.toDate(), "yyyy-MM-dd HH:mm")
}

function getClientTypeLabel(
  sale: Sale,
  labels: Pick<SalesCsvLabels, "clientTypeParticulier" | "clientTypeGrossiste">
): string {
  if (!isRegisteredSaleClient(sale)) return "-"
  if (sale.clientType === "grossiste") return labels.clientTypeGrossiste
  if (sale.clientType === "particulier") return labels.clientTypeParticulier
  return "-"
}

export function downloadSalesCsv(
  sales: Sale[],
  stores: Store[],
  labels: SalesCsvLabels
) {
  const storeById = new Map(stores.map((store) => [store.id, store]))
  const headerRow = [
    labels.headers.date,
    labels.headers.ref,
    labels.headers.client,
    labels.headers.phone,
    labels.headers.clientType,
    labels.headers.seller,
    labels.headers.store,
    labels.headers.total,
    labels.headers.status,
    labels.headers.payment,
  ]

  const rows = sales.map((sale) => [
    formatSaleTimestamp(sale),
    sale.id.slice(-6).toUpperCase(),
    getSaleClientDisplayName(sale, labels.walkIn),
    isRegisteredSaleClient(sale) ? sale.clientPhone || "-" : "-",
    getClientTypeLabel(sale, labels),
    sale.sellerName,
    storeById.get(sale.storeId)?.name || sale.storeId,
    String(sale.total),
    sale.status,
    sale.debtAmount > 0 ? labels.paymentPartial : labels.paymentComplete,
  ])

  const csv = [headerRow, ...rows]
    .map((row) => row.map(escapeCsv).join(";"))
    .join("\n")

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `Rapport_Ventes_${format(new Date(), "yyyyMMdd")}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export type { SalesCsvLabels }
