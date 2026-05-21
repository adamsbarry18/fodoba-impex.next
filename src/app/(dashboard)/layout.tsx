"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { NotificationPanel } from "@/components/notifications/notification-panel"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset
        className={cn(
          "flex min-h-svh min-w-0 flex-1 flex-col bg-sidebar",
          "md:peer-data-[variant=inset]:m-1 md:peer-data-[variant=inset]:ml-0",
          "md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-1",
          "md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-none"
        )}
      >
        <AppHeader onNotifOpen={() => setNotifOpen(true)} />
        
        <div className="flex min-h-0 flex-1 flex-col px-1 pb-2 pt-0.5 md:px-2 md:pb-3 md:pt-1">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              <div className="mx-auto w-full max-w-[1600px] p-4 md:p-8">
                {children}
              </div>
            </div>
          </div>
        </div>

        <NotificationPanel open={notifOpen} onOpenChange={setNotifOpen} />
      </SidebarInset>
    </SidebarProvider>
  )
}
