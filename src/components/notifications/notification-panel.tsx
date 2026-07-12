"use client"

import { useState } from "react"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { useStore } from "@/lib/contexts/StoreContext"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Bell,
  BellOff,
  Trash2,
  CheckCheck,
  Clock,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { AppNotification } from "@/lib/types"
import {
  NOTIFICATION_TYPE_META,
  filterNotifications,
  formatNotificationTime,
  type NotificationTab,
} from "@/lib/notification-utils"

interface NotificationPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationPanel({ open, onOpenChange }: NotificationPanelProps) {
  const { activeStore } = useStore()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications()

  const [activeTab, setActiveTab] = useState<NotificationTab>("all")
  const [markingAll, setMarkingAll] = useState(false)
  const [clearing, setClearing] = useState(false)

  const filtered = filterNotifications(notifications, activeTab)

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return
    setMarkingAll(true)
    try {
      await markAllAsRead()
      toast.success("Toutes les notifications ont été marquées comme lues.")
    } catch {
      toast.error("Impossible de marquer les notifications comme lues.")
    } finally {
      setMarkingAll(false)
    }
  }

  const handleClearAll = async () => {
    setClearing(true)
    try {
      await clearAll()
      toast.success("Historique des notifications effacé.")
    } catch {
      toast.error("Impossible d'effacer l'historique.")
    } finally {
      setClearing(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 border-l p-0 shadow-2xl sm:max-w-[420px]">
        <SheetHeader className="shrink-0 space-y-3 border-b bg-muted/20 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5 text-left">
                <SheetTitle className="text-lg font-bold tracking-tight">
                  Notifications
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {activeStore?.name
                    ? `Activité récente - ${activeStore.name}`
                    : "Activité récente de la boutique"}
                </SheetDescription>
              </div>
            </div>
            {unreadCount > 0 && (
              <StatusBadge tone="primary-soft" className="shrink-0 text-[10px]">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </StatusBadge>
            )}
          </div>

          {(notifications.length > 0 || unreadCount > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs font-semibold"
                  disabled={markingAll}
                  onClick={handleMarkAllAsRead}
                >
                  {markingAll ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Tout marquer lu
                </Button>
              )}
              {notifications.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg text-xs font-semibold text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Tout effacer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Effacer l&apos;historique ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action supprime définitivement les {notifications.length}{" "}
                        notification{notifications.length > 1 ? "s" : ""} affichées. Elle est
                        irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={clearing}
                        onClick={handleClearAll}
                      >
                        {clearing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Effacer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as NotificationTab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="shrink-0 border-b px-5 py-3">
            <TabsList className="grid h-10 w-full grid-cols-2 rounded-xl bg-muted/50 p-1">
              <TabsTrigger
                value="all"
                className="rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Toutes
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {notifications.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Non lues
                {unreadCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="p-3 pb-8">
              {filtered.length === 0 ? (
                <NotificationEmptyState tab={activeTab} />
              ) : (
                <div className="space-y-2">
                  {filtered.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

function NotificationEmptyState({ tab }: { tab: NotificationTab }) {
  const isUnreadTab = tab === "unread"

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
        {isUnreadTab ? (
          <CheckCheck className="h-7 w-7 text-muted-foreground/40" />
        ) : (
          <BellOff className="h-7 w-7 text-muted-foreground/40" />
        )}
      </div>
      <p className="text-sm font-semibold text-foreground">
        {isUnreadTab ? "Aucune notification non lue" : "Aucune notification"}
      </p>
      <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
        {isUnreadTab
          ? "Vous êtes à jour. Les nouvelles alertes apparaîtront ici."
          : "Les alertes stock, ventes et achats s'afficheront dans cet historique."}
      </p>
    </div>
  )
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: AppNotification
  onMarkAsRead: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)
  const meta = NOTIFICATION_TYPE_META[notification.type] ?? NOTIFICATION_TYPE_META.INFO
  const Icon = meta.Icon

  const handleClick = () => {
    if (!notification.read) {
      void onMarkAsRead(notification.id)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(true)
    try {
      await onDelete(notification.id)
      toast.success("Notification supprimée.")
    } catch {
      toast.error("Impossible de supprimer la notification.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
        notification.read
          ? "border-border/60 bg-card hover:bg-muted/40"
          : "border-primary/15 bg-primary/5 hover:bg-primary/10"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
          notification.read ? "border-border bg-muted/30" : "border-primary/20 bg-background"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            notification.type === "STOCK_ALERT" && "text-destructive",
            notification.type === "SALE" && "text-primary",
            notification.type === "PURCHASE" && "text-cyan-600",
            notification.type === "INFO" && "text-muted-foreground"
          )}
        />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5 pr-8">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge
            preset="notificationType"
            value={notification.type}
            className="text-[9px] uppercase"
          />
          {!notification.read && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          )}
        </div>
        <h4 className="text-sm font-bold leading-snug text-foreground">{notification.title}</h4>
        <p className="text-xs leading-relaxed text-muted-foreground">{notification.message}</p>
        <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground/80">
          <Clock className="h-3 w-3" />
          {formatNotificationTime(notification.timestamp)}
        </div>
      </div>

      <button
        type="button"
        aria-label="Supprimer la notification"
        disabled={deleting}
        className={cn(
          "absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground/40 transition-all",
          "opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100",
          "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        onClick={handleDelete}
      >
        {deleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}
