"use client"

import type { Sale } from "@/lib/types"
import {
  getSaleClientDisplayName,
  isRegisteredSaleClient,
} from "@/lib/sale-client-utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { useT } from "@/i18n/context"
import { cn } from "@/lib/utils"

type SaleClientInfoProps = {
  sale: Pick<Sale, "clientId" | "clientName" | "clientPhone" | "clientType">
  walkInLabel?: string
  showType?: boolean
  showPhone?: boolean
  nameClassName?: string
  className?: string
}

export function SaleClientInfo({
  sale,
  walkInLabel,
  showType = true,
  showPhone = true,
  nameClassName,
  className,
}: SaleClientInfoProps) {
  const t = useT()
  const resolvedWalkIn = walkInLabel ?? t("pos.walkInClient")
  const registered = isRegisteredSaleClient(sale)
  const displayName = getSaleClientDisplayName(sale, resolvedWalkIn)

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn("text-xs font-medium", nameClassName)}>{displayName}</span>
        {registered && showType && sale.clientType ? (
          <StatusBadge
            preset="clientType"
            value={sale.clientType}
            className="text-[9px] uppercase"
          />
        ) : null}
      </div>
      {registered && showPhone && sale.clientPhone ? (
        <p className="text-[10px] text-muted-foreground">{sale.clientPhone}</p>
      ) : null}
    </div>
  )
}
