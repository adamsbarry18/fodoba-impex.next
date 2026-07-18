"use client"

import { useAuth } from "@/lib/contexts/AuthContext"
import { useStore } from "@/lib/contexts/StoreContext"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useT } from "@/i18n/context"

export function StoreReadyGate({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()
  const { loading } = useStore()
  const t = useT()

  if (!currentUser) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <LoadingScreen
        message={t("loading.storeLoading")}
        fullScreen={false}
        className="min-h-[50vh] rounded-2xl"
      />
    )
  }

  return <>{children}</>
}

