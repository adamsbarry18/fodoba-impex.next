"use client"

import type { ReactNode } from "react"

interface VisibleTableColumnProps {
  id: string
  isVisible: (id: string) => boolean
  children: ReactNode
}

/** Affiche un en-tête ou une cellule uniquement si la colonne est visible. */
export function VisibleTableColumn({ id, isVisible, children }: VisibleTableColumnProps) {
  if (!isVisible(id)) return null
  return <>{children}</>
}
