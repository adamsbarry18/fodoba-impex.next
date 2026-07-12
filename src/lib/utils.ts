import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Montants lisibles en PDF (espaces ASCII, pas d'espaces insécables Unicode). */
export function formatPdfNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .formatToParts(value)
    .map((part) => {
      if (part.type === "group") return " "
      if (part.type === "decimal") return ","
      return part.value
    })
    .join("")
}
