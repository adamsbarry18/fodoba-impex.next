"use client"

import { cn } from "@/lib/utils"
import {
  getDaysUntilExpiration,
  getExpirationStatus,
  parseExpirationDate,
} from "@/lib/expiration-utils"
import { format } from "date-fns"
import { useT, useLocale } from "@/i18n/context"
import { getDateLocale } from "@/i18n/get-date-locale"
import { useMemo } from "react"

interface ProductExpirationDisplayProps {
  expirationDate?: string
  showDate?: boolean
  className?: string
}

export function ProductExpirationDisplay({
  expirationDate,
  showDate = false,
  className,
}: ProductExpirationDisplayProps) {
  const t = useT()
  const { locale } = useLocale()
  const dateLocale = useMemo(() => getDateLocale(locale), [locale])

  const status = getExpirationStatus(expirationDate)
  const days = getDaysUntilExpiration(expirationDate)
  const parsed = parseExpirationDate(expirationDate)

  if (status === "none" || days === null) {
    return <span className={cn("text-xs text-muted-foreground", className)}>-</span>
  }

  let label: string
  if (days < 0) {
    label = t("inventory.expiration.expiredDaysAgo", { count: Math.abs(days) })
  } else if (days === 0) {
    label = t("inventory.expiration.expiresToday")
  } else {
    label = t("inventory.expiration.daysRemaining", { count: days })
  }

  const urgent = status === "warning" || status === "expired"

  return (
    <div className={cn("space-y-0.5", className)}>
      <span
        className={cn(
          "text-xs font-semibold",
          urgent ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
      {showDate && parsed && (
        <span className={cn("block text-[10px]", urgent ? "text-destructive/80" : "text-muted-foreground")}>
          {format(parsed, "dd/MM/yyyy", { locale: dateLocale })}
        </span>
      )}
    </div>
  )
}
