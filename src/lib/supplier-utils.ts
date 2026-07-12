import type { CurrencyCode, Supplier } from "@/lib/types"

export type SupplierTypeFilter = "all" | Supplier["type"]
export type SupplierDebtFilter = "all" | "with_debt" | "clear"

export const SUPPLIER_CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: "FCFA", label: "FCFA (Référence)" },
  { value: "GNF", label: "GNF" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
]

export const SUPPLIER_TYPES = [
  {
    value: "local" as const,
    label: "Local",
    description: "Fournisseur sous-régional ou national",
  },
  {
    value: "import" as const,
    label: "Import",
    description: "Partenaire international, devises étrangères",
  },
] as const

export function countSuppliersWithDebt(suppliers: Supplier[]): number {
  return suppliers.filter((s) => s.currentDebt > 0).length
}

export function countImportSuppliers(suppliers: Supplier[]): number {
  return suppliers.filter((s) => s.type === "import").length
}

export function sumSupplierDebt(suppliers: Supplier[]): number {
  return suppliers.reduce((acc, s) => acc + s.currentDebt, 0)
}

export function filterSuppliers(
  suppliers: Supplier[],
  opts: {
    search?: string
    type?: SupplierTypeFilter
    currency?: CurrencyCode | "all"
    debt?: SupplierDebtFilter
  }
): Supplier[] {
  const term = (opts.search ?? "").trim().toLowerCase()
  return suppliers.filter((s) => {
    const matchesSearch =
      !term ||
      s.name.toLowerCase().includes(term) ||
      s.country.toLowerCase().includes(term) ||
      (s.city ?? "").toLowerCase().includes(term) ||
      (s.paymentTerms ?? "").toLowerCase().includes(term)

    const matchesType =
      !opts.type || opts.type === "all" || s.type === opts.type
    const matchesCurrency =
      !opts.currency || opts.currency === "all" || s.defaultCurrency === opts.currency

    let matchesDebt = true
    if (opts.debt === "with_debt") matchesDebt = s.currentDebt > 0
    else if (opts.debt === "clear") matchesDebt = s.currentDebt <= 0

    return matchesSearch && matchesType && matchesCurrency && matchesDebt
  })
}
