"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { PrintService } from "@/services/print.service"
import { StoreService } from "@/services/store.service"
import type { Sale, Store } from "@/lib/types"
import { useT } from "@/i18n/context"

export function useSaleTicket(stores?: Store[]) {
  const t = useT()
  const [printingId, setPrintingId] = useState<string | null>(null)

  const printTicket = useCallback(
    async (sale: Sale) => {
      setPrintingId(sale.id)
      try {
        let store = stores?.find((s) => s.id === sale.storeId) ?? null
        if (!store) {
          store = await StoreService.getStore(sale.storeId)
        }
        if (!store) {
          toast.error(t("pos.ticket.storeNotFound"))
          return
        }
        await PrintService.generateThermalTicket(sale, store)
        toast.success(t("pos.ticket.downloadSuccess"))
      } catch {
        toast.error(t("pos.ticket.downloadError"))
      } finally {
        setPrintingId(null)
      }
    },
    [stores, t]
  )

  return { printTicket, printingId, isPrinting: printingId !== null }
}
