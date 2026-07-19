"use client"

import { useEffect, useState } from "react"
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
import { Loader2, AlertTriangle } from "lucide-react"
import { SupplierService } from "@/services/supplier.service"
import type { Supplier } from "@/lib/types"
import {
  getSupplierDeleteBlockerMessageKey,
  type SupplierDeleteBlocker,
} from "@/lib/supplier-utils"
import { toast } from "sonner"
import { useT } from "@/i18n/context"

interface SupplierDeleteDialogProps {
  supplier: Supplier | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function SupplierDeleteDialog({
  supplier,
  open,
  onOpenChange,
  onDeleted,
}: SupplierDeleteDialogProps) {
  const t = useT()
  const [blockers, setBlockers] = useState<SupplierDeleteBlocker[]>([])
  const [checking, setChecking] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!open || !supplier) {
      setBlockers([])
      return
    }

    let cancelled = false
    setChecking(true)

    SupplierService.getDeleteBlockers(supplier.id)
      .then((result) => {
        if (!cancelled) setBlockers(result)
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(t("suppliers.deleteCheckError"))
          onOpenChange(false)
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, supplier, onOpenChange, t])

  const handleDelete = async () => {
    if (!supplier || blockers.length > 0) return

    setDeleting(true)
    try {
      await SupplierService.deleteSupplier(supplier.id)
      toast.success(t("suppliers.deleteSuccess"))
      onOpenChange(false)
      onDeleted?.()
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("SUPPLIER_DELETE_BLOCKED:")
      ) {
        const parsed = error.message
          .replace("SUPPLIER_DELETE_BLOCKED:", "")
          .split(",")
          .filter(Boolean) as SupplierDeleteBlocker[]
        setBlockers(parsed)
        toast.error(t("suppliers.deleteBlocked.title"))
      } else {
        toast.error(t("suppliers.deleteError"))
      }
    } finally {
      setDeleting(false)
    }
  }

  const canDelete = !checking && blockers.length === 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {canDelete
              ? t("suppliers.confirmDeleteTitle")
              : t("suppliers.deleteBlocked.title")}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              {checking ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("suppliers.deleteChecking")}
                </div>
              ) : canDelete ? (
                <p>{t("suppliers.confirmDeleteDesc", { name: supplier?.name ?? "" })}</p>
              ) : (
                <>
                  <p>{t("suppliers.deleteBlocked.desc", { name: supplier?.name ?? "" })}</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {blockers.map((blocker) => (
                      <li key={blocker}>{t(getSupplierDeleteBlockerMessageKey(blocker))}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl" disabled={deleting}>
            {canDelete ? t("common.cancel") : t("common.close")}
          </AlertDialogCancel>
          {canDelete && (
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting || checking}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="mr-2 h-4 w-4" />
              )}
              {t("common.delete")}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
