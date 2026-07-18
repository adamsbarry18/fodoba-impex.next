"use client"

import { useAuth } from "@/lib/contexts/AuthContext"
import { useStore } from "@/lib/contexts/StoreContext"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { useT } from "@/i18n/context"

const PUBLIC_PATHS = ["/login"]

export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth()
  const { loading: storeLoading } = useStore()
  const router = useRouter()
  const pathname = usePathname()
  const t = useT()

  const isPublicPath = PUBLIC_PATHS.includes(pathname)
  const isAuthenticated = Boolean(currentUser)
  const waitingForStore = isAuthenticated && !isPublicPath && storeLoading

  useEffect(() => {
    if (authLoading || waitingForStore) return

    if (!currentUser && !isPublicPath) {
      router.push("/login")
      return
    }

    if (currentUser && pathname === "/login") {
      router.push("/dashboard")
    }
  }, [currentUser, authLoading, waitingForStore, pathname, router, isPublicPath])

  if (authLoading || waitingForStore) {
    return (
      <LoadingScreen
        message={
          authLoading
            ? t("loading.sessionCheck")
            : t("loading.storeActivation")
        }
      />
    )
  }

  return <>{children}</>
}

