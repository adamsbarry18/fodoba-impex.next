"use client"

import { useAuth } from "@/lib/contexts/AuthContext"
import { useStore } from "@/lib/contexts/StoreContext"
import { LoadingScreen } from "@/components/ui/loading-screen"

export function StoreReadyGate({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()
  const { loading } = useStore()

  if (!currentUser) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <LoadingScreen
        message="Chargement de votre boutique…"
        fullScreen={false}
        className="min-h-[50vh] rounded-2xl"
      />
    )
  }

  return <>{children}</>
}
