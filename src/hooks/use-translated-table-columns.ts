"use client"

import { useMemo } from "react"
import { useT } from "@/i18n/context"
import { useTableColumns } from "@/hooks/use-table-columns"
import type { TableColumnDef } from "@/lib/table-columns"

/** Applique des clés i18n aux labels de colonnes avant useTableColumns. */
export function useTranslatedTableColumns(
  tableKey: string,
  columns: TableColumnDef[],
  labelKeys: Record<string, string>
) {
  const t = useT()

  const translatedColumns = useMemo(
    () =>
      columns.map((col) => ({
        ...col,
        label: labelKeys[col.id] ? t(labelKeys[col.id]) : col.label,
      })),
    [columns, labelKeys, t]
  )

  return useTableColumns(tableKey, translatedColumns)
}
