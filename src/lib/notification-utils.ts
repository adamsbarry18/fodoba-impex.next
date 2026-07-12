import type { LucideIcon } from "lucide-react"
import { Package, ShoppingCart, Truck, Info } from "lucide-react"
import type { AppNotification, AppNotificationType } from "@/lib/types"
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns"
import { fr } from "date-fns/locale"

export type NotificationTab = "all" | "unread"

export const NOTIFICATION_TYPE_META: Record<
  AppNotificationType,
  { label: string; Icon: LucideIcon }
> = {
  STOCK_ALERT: { label: "Alerte stock", Icon: Package },
  SALE: { label: "Vente", Icon: ShoppingCart },
  PURCHASE: { label: "Achat", Icon: Truck },
  INFO: { label: "Information", Icon: Info },
}

export function toNotificationDate(ts: AppNotification["timestamp"]): Date | null {
  if (!ts) return null
  return ts.toDate ? ts.toDate() : new Date(ts)
}

export function formatNotificationTime(ts: AppNotification["timestamp"]): string {
  const date = toNotificationDate(ts)
  if (!date) return ""

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 60_000) return "À l'instant"

  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr })
  }

  if (isYesterday(date)) {
    return `Hier à ${format(date, "HH:mm", { locale: fr })}`
  }

  if (diffMs < 7 * 24 * 60 * 60 * 1000) {
    return format(date, "EEEE 'à' HH:mm", { locale: fr })
  }

  return format(date, "d MMM yyyy 'à' HH:mm", { locale: fr })
}

export function filterNotifications(
  notifications: AppNotification[],
  tab: NotificationTab
): AppNotification[] {
  if (tab === "unread") return notifications.filter((n) => !n.read)
  return notifications
}

export function countUnread(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.read).length
}
