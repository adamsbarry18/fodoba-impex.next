"use client"

import { useAuth } from "@/lib/contexts/AuthContext"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      if (!currentUser && pathname !== "/login") {
        router.push("/login")
      } else if (currentUser && pathname === "/login") {
        router.push("/dashboard")
      }
    }
  }, [currentUser, loading, pathname, router])

  if (loading) {
    return <LoadingScreen />
  }

  return <>{children}</>
}
