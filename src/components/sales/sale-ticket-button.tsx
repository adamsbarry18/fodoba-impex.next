"use client"

import { Button } from "@/components/ui/button"
import { Loader2, Printer } from "lucide-react"
import type { Sale, Store } from "@/lib/types"
import { useSaleTicket } from "@/hooks/use-sale-ticket"
import { cn } from "@/lib/utils"

type SaleTicketButtonProps = {
  sale: Sale
  stores?: Store[]
  showLabel?: boolean
  size?: "sm" | "default" | "icon"
  variant?: "outline" | "ghost" | "default" | "link"
  className?: string
}

export function SaleTicketButton({
  sale,
  stores,
  showLabel = true,
  size = "sm",
  variant = "outline",
  className,
}: SaleTicketButtonProps) {
  const { printTicket, printingId } = useSaleTicket(stores)
  const isPrinting = printingId === sale.id

  return (
    <Button
      type="button"
      variant={variant}
      size={size === "icon" ? "icon" : size}
      className={cn(
        size !== "icon" && "rounded-lg text-xs font-semibold",
        size === "icon" && "h-8 w-8 rounded-lg",
        className
      )}
      onClick={() => printTicket(sale)}
      disabled={isPrinting}
      title="Télécharger le ticket"
    >
      {isPrinting ? (
        <Loader2 className={cn("animate-spin", showLabel ? "mr-1.5 h-3.5 w-3.5" : "h-4 w-4")} />
      ) : (
        <Printer className={cn(showLabel ? "mr-1.5 h-3.5 w-3.5" : "h-4 w-4")} />
      )}
      {showLabel && size !== "icon" ? "Ticket" : null}
      {size === "icon" && <span className="sr-only">Télécharger le ticket</span>}
    </Button>
  )
}
