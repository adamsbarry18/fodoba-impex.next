"use client"

import { Suspense, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { consumeReturnParam } from "@/lib/navigation/return-to"

interface ReturnSelectionOptions {
  successMessage?: string
  reload?: () => void | Promise<void>
}

/** Applique la sélection après création (appel direct depuis un chargement de données). */
export async function applyReturnSelection(
  paramName: string,
  onSelected: (id: string) => void | Promise<void>,
  options?: ReturnSelectionOptions
): Promise<boolean> {
  const id = consumeReturnParam(paramName)
  if (!id) return false

  try {
    if (options?.reload) await options.reload()
    await onSelected(id)
    if (options?.successMessage) toast.success(options.successMessage)
    return true
  } catch {
    toast.error("Erreur lors de la sélection")
    return false
  }
}

function ReturnSelectionEffect({
  paramName,
  onSelected,
  options,
}: {
  paramName: string
  onSelected: (id: string) => void | Promise<void>
  options?: ReturnSelectionOptions
}) {
  const searchParams = useSearchParams()
  const selectedId = searchParams.get(paramName)
  const onSelectedRef = useRef(onSelected)
  const reloadRef = useRef(options?.reload)
  const processedRef = useRef<string | null>(null)

  useEffect(() => {
    onSelectedRef.current = onSelected
    reloadRef.current = options?.reload

    if (!selectedId || processedRef.current === selectedId) return
    processedRef.current = selectedId

    let cancelled = false

    const apply = async () => {
      const id = consumeReturnParam(paramName) ?? selectedId
      if (!id) return

      try {
        if (reloadRef.current) await reloadRef.current()
        if (cancelled) return
        await onSelectedRef.current(id)
        if (options?.successMessage) toast.success(options.successMessage)
      } catch {
        if (!cancelled) toast.error("Erreur lors de la sélection")
      }
    }

    apply()

    return () => {
      cancelled = true
    }
  }, [selectedId, paramName, options?.successMessage, onSelected, options?.reload])

  return null
}

/** Composant Suspense pour la sélection automatique au retour d'une création. */
export function ReturnSelectionHandler({
  paramName,
  onSelected,
  options,
}: {
  paramName: string
  onSelected: (id: string) => void | Promise<void>
  options?: ReturnSelectionOptions
}) {
  return (
    <Suspense fallback={null}>
      <ReturnSelectionEffect
        paramName={paramName}
        onSelected={onSelected}
        options={options}
      />
    </Suspense>
  )
}
