
"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useStore } from "@/lib/contexts/StoreContext"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Building2, 
  ChevronDown, 
  Bell, 
  UserCircle, 
  LogOut 
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationPanel } from "@/components/notifications/notification-panel"
import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { activeStore, availableStores, setActiveStoreById } = useStore()
  const { userProfile, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f9fafb]">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white px-6 sticky top-0 z-50">
          <SidebarTrigger className="-ml-1 text-gray-400 hover:text-gray-900" />
          
          <div className="flex flex-1 items-center justify-between">
            {/* Store Selector */}
            <div className="flex items-center gap-3">
              {availableStores.length > 0 ? (
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 min-w-[180px]">
                  <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                  <Select 
                    value={activeStore?.id} 
                    onValueChange={setActiveStoreById}
                  >
                    <SelectTrigger className="border-none shadow-none bg-transparent p-0 h-auto focus:ring-0 text-[13px] font-medium text-gray-700">
                      <SelectValue placeholder="Choisir une boutique" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStores.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {s.name} ({s.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-[13px] font-medium text-gray-400 italic">Aucune boutique assignée</div>
              )}
            </div>
            
            {/* User Profile & Notifications */}
            <div className="flex items-center gap-5">
              <button 
                className="text-gray-500 hover:text-gray-900 transition-colors relative"
                onClick={() => setNotifOpen(true)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer group">
                    <Avatar className="h-9 w-9 border border-gray-100 bg-primary flex items-center justify-center">
                      <AvatarImage src={userProfile?.photoURL} />
                      <AvatarFallback className="bg-transparent text-white font-bold text-[13px]">
                        {userProfile?.prenom?.[0].toUpperCase()}{userProfile?.nom?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1.5">
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-[14px] font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {userProfile?.prenom}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium capitalize pt-0.5">
                          {userProfile?.role === 'admin' ? 'Admin' : userProfile?.role === 'manager' ? 'Gérant' : 'Vendeur'}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform duration-200" />
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[240px] p-2 mt-2 rounded-2xl shadow-xl border-gray-100 bg-white">
                  <DropdownMenuLabel className="px-3 py-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-[15px] font-bold text-gray-900 leading-none">
                        {userProfile?.prenom} {userProfile?.nom}
                      </p>
                      <p className="text-[13px] text-gray-500 font-medium">
                        {userProfile?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="mx-2" />
                  <DropdownMenuItem asChild className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-gray-700 focus:bg-gray-100 focus:text-gray-900 transition-colors">
                    <Link href="/profile" className="flex items-center gap-3 w-full">
                      <UserCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-[14px] font-medium">Mon profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-destructive focus:bg-red-50 focus:text-destructive transition-colors"
                    onClick={() => logout()}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-[14px] font-medium">Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
        
        <NotificationPanel open={notifOpen} onOpenChange={setNotifOpen} />
      </SidebarInset>
    </SidebarProvider>
  )
}
