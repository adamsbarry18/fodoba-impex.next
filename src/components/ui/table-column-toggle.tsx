"use client"

import { Columns3, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TableColumnDef } from "@/lib/table-columns"
import { cn } from "@/lib/utils"

interface TableColumnToggleProps {
  columns: TableColumnDef[]
  isVisible: (id: string) => boolean
  onToggle: (id: string) => void
  onReset: () => void
  className?: string
}

export function TableColumnToggle({
  columns,
  isVisible,
  onToggle,
  onReset,
  className,
}: TableColumnToggleProps) {
  const toggleable = columns.filter((col) => !col.locked)
  if (toggleable.length === 0) return null

  const hiddenCount = toggleable.filter((col) => !isVisible(col.id)).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 gap-1.5 rounded-lg text-xs font-semibold", className)}
          aria-label="Personnaliser les colonnes du tableau"
        >
          <Columns3 className="h-3.5 w-3.5" />
          Colonnes
          {hiddenCount > 0 ? (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              {toggleable.length - hiddenCount}/{toggleable.length}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl p-2">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Colonnes affichées
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {toggleable.map((col) => (
          <DropdownMenuItem
            key={col.id}
            className="rounded-lg text-xs"
            onSelect={(e) => {
              e.preventDefault()
              onToggle(col.id)
            }}
          >
            <Checkbox
              checked={isVisible(col.id)}
              className="mr-2"
              aria-hidden
              tabIndex={-1}
            />
            {col.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-lg text-xs text-muted-foreground"
          onSelect={(e) => {
            e.preventDefault()
            onReset()
          }}
        >
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          Réinitialiser
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
