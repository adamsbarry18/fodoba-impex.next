import type { Client, Sale } from "@/lib/types"

export type SaleClientSnapshot = Pick<
  Sale,
  "clientId" | "clientName" | "clientPhone" | "clientType"
>

export function isRegisteredSaleClient(
  sale: Pick<Sale, "clientId">
): boolean {
  return Boolean(sale.clientId && sale.clientId !== "none")
}

export function getSaleClientDisplayName(
  sale: Pick<Sale, "clientId" | "clientName">,
  walkInLabel: string
): string {
  if (isRegisteredSaleClient(sale) && sale.clientName) {
    return sale.clientName
  }
  return walkInLabel
}

export function getSaleClientTypeLabel(
  clientType: Sale["clientType"],
  labels: { particulier: string; grossiste: string }
): string | null {
  if (clientType === "particulier") return labels.particulier
  if (clientType === "grossiste") return labels.grossiste
  return null
}

export function buildSaleClientSnapshot(client: Client): SaleClientSnapshot {
  return {
    clientId: client.id,
    clientName: client.name,
    clientPhone: client.phone,
    clientType: client.type,
  }
}

export type SaleClientReceiptLabels = {
  walkIn: string
  client: string
  phone: string
  seller: string
}

export function buildSaleClientReceiptLines(
  sale: Pick<Sale, "clientId" | "clientName" | "clientPhone" | "clientType" | "sellerName">,
  labels: SaleClientReceiptLabels & {
    clientTypeParticulier: string
    clientTypeGrossiste: string
  }
): string[] {
  const lines: string[] = []

  lines.push(
    `${labels.client}: ${getSaleClientDisplayName(sale, labels.walkIn)}`
  )

  if (isRegisteredSaleClient(sale)) {
    if (sale.clientPhone) {
      lines.push(`${labels.phone}: ${sale.clientPhone}`)
    }
    const typeLabel = getSaleClientTypeLabel(sale.clientType, {
      particulier: labels.clientTypeParticulier,
      grossiste: labels.clientTypeGrossiste,
    })
    if (typeLabel) {
      lines.push(typeLabel)
    }
  }

  lines.push(`${labels.seller}: ${sale.sellerName}`)

  return lines
}
