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
import { ClientService } from "@/services/client.service"
import type { Client } from "@/lib/types"
import {
  getClientDeleteBlockerMessageKey,
  type ClientDeleteBlocker,
} from "@/lib/client-utils"
import { toast } from "sonner"
import { useT } from "@/i18n/context"

interface ClientDeleteDialogProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function ClientDeleteDialog({
  client,
  open,
  onOpenChange,
  onDeleted,
}: ClientDeleteDialogProps) {
  const t = useT()
  const [blockers, setBlockers] = useState<ClientDeleteBlocker[]>([])
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
    if (!open || !client?.id) return

    let cancelled = false
    setChecking(true)

    ClientService.getDeleteBlockers(client.id)
      .then((result) => {
        if (!cancelled) setBlockers(result)
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(tRef.current("clients.deleteCheckError"))
          onOpenChangeRef.current(false)
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, client?.id])

  const handleDelete = async () => {
    if (!client || blockers.length > 0 || checking) return

    setDeleting(true)
    try {
      await ClientService.deleteClient(client.id)
      toast.success(t("clients.deleteSuccess"))
      onOpenChange(false)
      onDeletedRef.current?.()
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("CLIENT_DELETE_BLOCKED:")
      ) {
        const parsed = error.message
          .replace("CLIENT_DELETE_BLOCKED:", "")
          .split(",")
          .filter(Boolean) as ClientDeleteBlocker[]
        setBlockers(parsed)
        toast.error(t("clients.deleteBlocked.title"))
      } else {
        toast.error(t("clients.deleteError"))
      }
    } finally {
      setDeleting(false)
    }
  }

  const isBlocked = !checking && blockers.length > 0
  const canDelete = !checking && blockers.length === 0

  const dialogTitle = checking
    ? t("clients.confirmDeleteTitle")
    : isBlocked
      ? t("clients.deleteBlocked.title")
      : t("clients.confirmDeleteTitle")

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {checking ? (
              t("clients.deleteChecking")
            ) : isBlocked ? (
              t("clients.deleteBlocked.desc", { name: client?.name ?? "" })
            ) : (
              t("clients.confirmDeleteDesc", { name: client?.name ?? "" })
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
                <li key={blocker}>{t(getClientDeleteBlockerMessageKey(blocker))}</li>
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
