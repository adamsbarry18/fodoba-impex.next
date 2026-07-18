"use client"

import { useCallback } from "react"
import { useT } from "@/i18n/context"
import { getPaymentMethodLabel } from "@/lib/constants/payment-methods"

export function usePaymentMethodLabel() {
  const t = useT()

  return useCallback(
    (method: string) => {
      const key = getPaymentMethodLabel(method)
      return key.includes(".") ? t(key) : key
    },
    [t]
  )
}
