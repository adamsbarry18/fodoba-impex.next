"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { PrintService } from "@/services/print.service"
import { StoreService } from "@/services/store.service"
import type { Sale, Store } from "@/lib/types"

export function useSaleTicket(stores?: Store[]) {
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
          toast.error("Boutique introuvable pour ce ticket")
          return
        }
        await PrintService.generateThermalTicket(sale, store)
        toast.success("Ticket téléchargé")
      } catch {
        toast.error("Erreur lors de la génération du ticket")
      } finally {
        setPrintingId(null)
      }
    },
    [stores]
  )

  return { printTicket, printingId, isPrinting: printingId !== null }
}
