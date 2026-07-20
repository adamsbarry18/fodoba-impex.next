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
  const tRef = useRef(t)
  const onOpenChangeRef = useRef(onOpenChange)
  const onDeletedRef = useRef(onDeleted)

  useEffect(() => {
    tRef.current = t
  }, [t])

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  }, [onOpenChange])

  useEffect(() => {
    onDeletedRef.current = onDeleted
  }, [onDeleted])

  useEffect(() => {
    if (open) return
    setBlockers([])
    setChecking(false)
    setDeleting(false)
  }, [open])

  useEffect(() => {
    if (!open || !supplier?.id) return

    let cancelled = false
    setChecking(true)

    SupplierService.getDeleteBlockers(supplier.id)
      .then((result) => {
        if (!cancelled) setBlockers(result)
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(tRef.current("suppliers.deleteCheckError"))
          onOpenChangeRef.current(false)
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, supplier?.id])

  const handleDelete = async () => {
    if (!supplier || blockers.length > 0 || checking) return

    setDeleting(true)
    try {
      await SupplierService.deleteSupplier(supplier.id)
      toast.success(t("suppliers.deleteSuccess"))
      onOpenChange(false)
      onDeletedRef.current?.()
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
      <AlertDialogContent
        className="rounded-2xl"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {checking ? (
              t("suppliers.deleteChecking")
            ) : isBlocked ? (
              t("suppliers.deleteBlocked.desc", { name: supplier?.name ?? "" })
            ) : (
              t("suppliers.confirmDeleteDesc", { name: supplier?.name ?? "" })
            )}
          </AlertDialogDescription>
          {checking && (
            <div className="flex justify-center pt-1">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
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
