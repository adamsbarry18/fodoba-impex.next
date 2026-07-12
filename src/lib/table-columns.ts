export interface TableColumnDef {
  id: string
  label: string
  /** Visible par défaut. `false` pour masquer au premier affichage. */
  defaultVisible?: boolean
  /** Colonne toujours affichée (nom, actions…). */
  locked?: boolean
}

export function getDefaultColumnVisibility(col: TableColumnDef): boolean {
  return col.defaultVisible !== false
}

const STORAGE_PREFIX = "tableColumns:"

export function getTableColumnsStorageKey(tableKey: string): string {
  return `${STORAGE_PREFIX}${tableKey}`
}

export function readTableColumnVisibility(
  tableKey: string,
  columns: TableColumnDef[]
): Record<string, boolean> {
  if (typeof window === "undefined") {
    return buildDefaultVisibility(columns)
  }

  const raw = localStorage.getItem(getTableColumnsStorageKey(tableKey))
  let stored: Record<string, boolean> = {}

  if (raw) {
    try {
      stored = JSON.parse(raw) as Record<string, boolean>
    } catch {
      stored = {}
    }
  }

  const result: Record<string, boolean> = {}
  for (const col of columns) {
    if (col.locked) continue
    result[col.id] =
      col.id in stored ? Boolean(stored[col.id]) : getDefaultColumnVisibility(col)
  }
  return result
}

export function writeTableColumnVisibility(
  tableKey: string,
  visibility: Record<string, boolean>
): void {
  if (typeof window === "undefined") return
  localStorage.setItem(getTableColumnsStorageKey(tableKey), JSON.stringify(visibility))
}

export function buildDefaultVisibility(columns: TableColumnDef[]): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const col of columns) {
    if (!col.locked) {
      result[col.id] = getDefaultColumnVisibility(col)
    }
  }
  return result
}
