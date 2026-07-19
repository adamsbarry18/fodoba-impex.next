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

  useEffect(() => {
    if (!open || !client) {
      setBlockers([])
      return
    }

    let cancelled = false
    setChecking(true)

    ClientService.getDeleteBlockers(client.id)
      .then((result) => {
        if (!cancelled) setBlockers(result)
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(t("clients.deleteCheckError"))
          onOpenChange(false)
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, client, onOpenChange, t])

  const handleDelete = async () => {
    if (!client || blockers.length > 0) return

    setDeleting(true)
    try {
      await ClientService.deleteClient(client.id)
      toast.success(t("clients.deleteSuccess"))
      onOpenChange(false)
      onDeleted?.()
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

  const canDelete = !checking && blockers.length === 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {canDelete
              ? t("clients.confirmDeleteTitle")
              : t("clients.deleteBlocked.title")}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              {checking ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("clients.deleteChecking")}
                </div>
              ) : canDelete ? (
                <p>{t("clients.confirmDeleteDesc", { name: client?.name ?? "" })}</p>
              ) : (
                <>
                  <p>{t("clients.deleteBlocked.desc", { name: client?.name ?? "" })}</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {blockers.map((blocker) => (
                      <li key={blocker}>{t(getClientDeleteBlockerMessageKey(blocker))}</li>
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
