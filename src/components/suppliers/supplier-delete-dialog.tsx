"use client"

import { useEffect, useRef, useState } from "react"
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
  const onOpenChangeRef = useRef(onOpenChange)

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  }, [onOpenChange])

  useEffect(() => {
    if (!open || !supplier) {
      setBlockers([])
      setChecking(false)
      return
    }

    let cancelled = false
    setChecking(true)
    setBlockers([])

    SupplierService.getDeleteBlockers(supplier.id)
      .then((result) => {
        if (!cancelled) setBlockers(result)
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(t("suppliers.deleteCheckError"))
          onOpenChangeRef.current(false)
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, supplier?.id, t])

  const handleDelete = async () => {
    if (!supplier || blockers.length > 0 || checking) return

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

  const isBlocked = !checking && blockers.length > 0
  const canDelete = !checking && blockers.length === 0

  const dialogTitle = checking
    ? t("suppliers.confirmDeleteTitle")
    : isBlocked
      ? t("suppliers.deleteBlocked.title")
      : t("suppliers.confirmDeleteTitle")

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {checking ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("suppliers.deleteChecking")}
              </span>
            ) : isBlocked ? (
              t("suppliers.deleteBlocked.desc", { name: supplier?.name ?? "" })
            ) : (
              t("suppliers.confirmDeleteDesc", { name: supplier?.name ?? "" })
            )}
          </AlertDialogDescription>
          {isBlocked && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {blockers.map((blocker) => (
                <li key={blocker}>{t(getSupplierDeleteBlockerMessageKey(blocker))}</li>
              ))}
            </ul>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl" disabled={deleting}>
            {canDelete ? t("common.cancel") : t("common.close")}
          </AlertDialogCancel>
          {canDelete && (
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting || checking}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
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
