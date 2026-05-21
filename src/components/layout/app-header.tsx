"use client"

import React, { memo } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, LogOut, UserCircle, Store as StoreIcon, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useStore } from "@/lib/contexts/StoreContext"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AppHeaderProps {
  onNotifOpen: () => void
}

export const AppHeader = memo(function AppHeader({ onNotifOpen }: AppHeaderProps) {
  const { activeStore, availableStores, setActiveStoreById } = useStore()
  const { userProfile, logout } = useAuth()
  const { unreadCount } = useNotifications()

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3",
        "bg-sidebar px-3 text-sidebar-foreground",
        "sm:gap-4 sm:px-4 md:px-6"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <SidebarTrigger
          className={cn(
            "h-9 w-auto shrink-0 rounded-lg border-0 text-sidebar-foreground",
            "md:w-9 md:min-w-9 md:justify-center",
            "bg-transparent hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
          )}
        />
        {availableStores.length > 0 ? (
          <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
            <Select
              value={activeStore?.id}
              onValueChange={setActiveStoreById}
            >
              <SelectTrigger
                className={cn(
                  "h-8 min-h-8 w-auto max-w-[min(calc(100vw-9.5rem),240px)] shrink-0 rounded-lg border-sidebar-border/60",
                  "sm:h-9 sm:min-h-9",
                  "bg-transparent text-sidebar-foreground shadow-none",
                  "hover:bg-sidebar-accent/80 hover:data-[state=open]:bg-sidebar-accent/80",
                  "hover:text-sidebar-accent-foreground",
                  "justify-start gap-1.5 px-2 py-0 text-[13px] font-semibold border",
                  "[&>span]:min-w-0 [&>span]:shrink [&>span]:truncate",
                  "[&>svg]:size-3.5 [&>svg]:shrink-0"
                )}
                aria-label="Boutique active"
              >
                <StoreIcon className="opacity-80" aria-hidden />
                <SelectValue placeholder="Choisir une boutique" />
              </SelectTrigger>
              <SelectContent align="start" className="z-[200]">
                {availableStores.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name} ({s.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="text-[12px] font-medium text-muted-foreground italic group-data-[collapsible=icon]:hidden">
            Aucune boutique assignée
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <button
          className={cn(
            "h-9 w-9 flex items-center justify-center rounded-lg text-sidebar-foreground transition-colors relative",
            "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
          )}
          onClick={onNotifOpen}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 shrink-0" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-background">
              {unreadCount}
            </span>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-9 gap-2 rounded-lg px-2 text-sidebar-foreground",
                "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
                "sm:pl-2 sm:pr-2.5"
              )}
              aria-label="Menu du compte"
            >
              <Avatar className="h-8 w-8 border border-sidebar-border bg-primary flex items-center justify-center">
                {userProfile?.photoURL ? (
                  <AvatarImage src={userProfile.photoURL} />
                ) : null}
                <AvatarFallback className="bg-transparent text-white font-bold text-[11px]">
                  {userProfile?.prenom?.[0].toUpperCase()}{userProfile?.nom?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[10rem] truncate text-sm font-bold sm:inline">
                {userProfile?.prenom}
              </span>
              <ChevronDown
                className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block"
                aria-hidden
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="truncate text-sm font-bold leading-none text-popover-foreground">
                  {userProfile?.prenom} {userProfile?.nom}
                </p>
                {userProfile?.email ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {userProfile.email}
                  </p>
                ) : null}
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-0.5">
                  {userProfile?.role === 'admin' ? 'Admin' : userProfile?.role === 'manager' ? 'Gérant' : 'Vendeur'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              asChild
              className="cursor-pointer px-3 py-2.5 rounded-lg focus:bg-sidebar-accent focus:text-sidebar-accent-foreground data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground"
            >
              <Link href="/profile" className="flex items-center gap-3">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                Mon profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:bg-sidebar-accent focus:text-destructive data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-destructive gap-3 px-3 py-2.5 rounded-lg"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
})
AppHeader.displayName = "AppHeader"
