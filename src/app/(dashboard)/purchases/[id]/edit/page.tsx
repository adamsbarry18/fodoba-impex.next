"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, Truck } from "lucide-react"
import { toast } from "sonner"
import { PurchaseService } from "@/services/purchase.service"
import { PurchaseOrderForm } from "@/components/purchases/purchase-order-form"
import { canEditPurchase, formatPurchaseRef } from "@/lib/purchase-utils"
import { useStore } from "@/lib/contexts/StoreContext"
import { useT } from "@/i18n/context"
import type { Purchase } from "@/lib/types"

export default function EditPurchasePage() {
  const params = useParams()
  const router = useRouter()
  const { activeStore } = useStore()
  const t = useT()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const data = await PurchaseService.getPurchase(params.id as string)
        if (cancelled) return

        if (!data) {
          toast.error(t("purchases.notFound"))
          router.push("/purchases")
          return
        }

        if (!canEditPurchase(data.status)) {
          toast.error(t("purchases.notEditable"))
          router.push(`/purchases/${data.id}`)
          return
        }

        if (activeStore && data.storeId !== activeStore.id) {
          toast.error(t("purchases.wrongStore"))
          router.push("/purchases")
          return
        }

        setPurchase(data)
      } catch {
        if (!cancelled) toast.error(t("common.errorLoading"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [params.id, activeStore, router, t])

  if (!activeStore) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <Truck className="h-10 w-10 opacity-30" />
        <p>{t("purchases.form.selectStore")}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!purchase) return null

  const editPath = `/purchases/${purchase.id}/edit`

  return (
    <PurchaseOrderForm
      mode="edit"
      purchaseId={purchase.id}
      initialSupplierId={purchase.supplierId}
      initialItems={purchase.items}
      initialExpenses={purchase.expenses}
      initialNotes={purchase.notes ?? ""}
      initialStatus={purchase.status === "DRAFT" ? "DRAFT" : "ORDERED"}
      title={t("purchases.editTitle", { ref: formatPurchaseRef(purchase.id) })}
      subtitle={t("purchases.editSubtitle")}
      backHref={`/purchases/${purchase.id}`}
      returnPath={editPath}
    />
  )
}
