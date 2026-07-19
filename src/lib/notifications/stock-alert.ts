export type StockAlertLevel = "out" | "low"

/**
 * Déclenche une alerte uniquement lors d'un franchissement de seuil
 * (évite le spam à chaque mouvement tant que le stock reste bas).
 */
export function getStockAlertLevel(
  previousStock: number,
  newStock: number,
  threshold: number
): StockAlertLevel | null {
  if (previousStock > 0 && newStock <= 0) return "out"
  if (
    threshold > 0 &&
    previousStock > threshold &&
    newStock > 0 &&
    newStock <= threshold
  ) {
    return "low"
  }
  return null
}
