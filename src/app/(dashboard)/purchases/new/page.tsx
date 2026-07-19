"use client"

import { Truck } from "lucide-react"
import { PurchaseOrderForm } from "@/components/purchases/purchase-order-form"
import { useStore } from "@/lib/contexts/StoreContext"
import { useT } from "@/i18n/context"

export default function NewPurchasePage() {
  const { activeStore } = useStore()
  const t = useT()

  if (!activeStore) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <Truck className="h-10 w-10 opacity-30" />
        <p>{t("purchases.form.selectStore")}</p>
      </div>
    )
  }

  return (
    <PurchaseOrderForm
      mode="create"
      title={t("purchases.form.title")}
      subtitle={t("purchases.form.subtitle", { store: activeStore.name })}
      backHref="/purchases"
      returnPath="/purchases/new"
    />
  )
}
