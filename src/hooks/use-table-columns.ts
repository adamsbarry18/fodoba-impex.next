"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  buildDefaultVisibility,
  readTableColumnVisibility,
  writeTableColumnVisibility,
  type TableColumnDef,
} from "@/lib/table-columns"

export function useTableColumns(tableKey: string, columns: TableColumnDef[]) {
  const columnSignature = columns.map((c) => `${c.id}:${c.defaultVisible ?? true}`).join("|")

  const [visibility, setVisibility] = useState<Record<string, boolean>>(() =>
    readTableColumnVisibility(tableKey, columns)
  )

  useEffect(() => {
    setVisibility(readTableColumnVisibility(tableKey, columns))
  }, [tableKey, columnSignature])

  const isVisible = useCallback(
    (id: string) => {
      const col = columns.find((c) => c.id === id)
      if (!col) return true
      if (col.locked) return true
      return visibility[id] ?? col.defaultVisible !== false
    },
    [columns, visibility]
  )

  const toggleColumn = useCallback(
    (id: string) => {
      const col = columns.find((c) => c.id === id)
      if (!col || col.locked) return

      setVisibility((prev) => {
        const next = {
          ...prev,
          [id]: !(prev[id] ?? col.defaultVisible !== false),
        }
        writeTableColumnVisibility(tableKey, next)
        return next
      })
    },
    [columns, tableKey]
  )

  const resetColumns = useCallback(() => {
    const defaults = buildDefaultVisibility(columns)
    setVisibility(defaults)
    writeTableColumnVisibility(tableKey, defaults)
  }, [columns, tableKey])

  const toggleableColumns = useMemo(
    () => columns.filter((col) => !col.locked),
    [columns]
  )

  const visibleColumnCount = useMemo(
    () => columns.filter((col) => isVisible(col.id)).length,
    [columns, isVisible]
  )

  return {
    columns,
    toggleableColumns,
    isVisible,
    toggleColumn,
    resetColumns,
    visibleColumnCount,
  }
}
