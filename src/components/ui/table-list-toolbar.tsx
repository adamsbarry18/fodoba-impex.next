import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TableListToolbarProps {
  summary?: ReactNode
  actions?: ReactNode
  className?: string
}

/** Barre légère au-dessus d'un tableau (résumé + actions comme le sélecteur de colonnes). */
export function TableListToolbar({ summary, actions, className }: TableListToolbarProps) {
  if (!summary && !actions) return null

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b bg-muted/20 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-6",
        className
      )}
    >
      <div className="text-xs text-muted-foreground">{summary}</div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}
