"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Purchase } from "@/lib/types"
import { formatPurchaseRef } from "@/lib/purchase-utils"
import { useT } from "@/i18n/context"

type PurchaseReceptionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: Purchase | null
  processing: boolean
  onConfirm: () => void
}

export function PurchaseReceptionDialog({
  open,
  onOpenChange,
  purchase,
  processing,
  onConfirm,
}: PurchaseReceptionDialogProps) {
  const t = useT()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("purchases.receptionConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("purchases.receptionConfirmDesc", {
              ref: purchase ? formatPurchaseRef(purchase.id) : "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl" disabled={processing}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn("rounded-xl bg-emerald-600 hover:bg-emerald-700")}
            disabled={processing}
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Package className="mr-2 h-4 w-4" />
            )}
            {t("common.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
