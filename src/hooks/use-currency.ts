
"use client"

import { useCurrency as useCurrencyContext } from "@/lib/contexts/CurrencyContext";

/**
 * Hook utilitaire pour le moteur multi-devises.
 */
export function useCurrency() {
  return useCurrencyContext();
}
