import type { Product } from "@/lib/types"

export const PRODUCT_UNITS = [
  { value: "Kg", label: "Kilogramme (Kg)" },
  { value: "Litre", label: "Litre (L)" },
  { value: "Pièce", label: "Pièce (Pce)" },
  { value: "Sac", label: "Sac" },
  { value: "Carton", label: "Carton" },
  { value: "Bouteille", label: "Bouteille" },
] as const

export type StockFilter = "all" | "low" | "out"

export function isLowStock(stock: number, threshold: number): boolean {
  return stock > 0 && stock <= threshold
}

export function isOutOfStock(stock: number): boolean {
  return stock <= 0
}

export function getStockStatus(
  stock: number,
  threshold: number
): "ok" | "low" | "out" {
  if (isOutOfStock(stock)) return "out"
  if (isLowStock(stock, threshold)) return "low"
  return "ok"
}

export function estimateStockValue(
  products: Product[],
  stocks: Record<string, number>
): number {
  return products.reduce((acc, p) => {
    const qty = stocks[p.id] ?? 0
    return acc + qty * p.sellingPriceFCFA
  }, 0)
}

export function countLowStock(
  products: Product[],
  stocks: Record<string, number>
): number {
  return products.filter((p) => isLowStock(stocks[p.id] ?? 0, p.lowStockThreshold)).length
}

export function countOutOfStock(
  products: Product[],
  stocks: Record<string, number>
): number {
  return products.filter((p) => isOutOfStock(stocks[p.id] ?? 0)).length
}
