"use client"

import React, { memo } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/ui/user-avatar"
import { StatusBadge } from "@/components/ui/status-badge"
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
import {
  AppHeaderIconButton,
  appDropdownContentClass,
  appDropdownItemClass,
  appDropdownItemDestructiveClass,
} from "@/components/layout/nav-menu-items"
import { useLocale, useT } from "@/i18n/context"
import { LOCALE_CONFIGS } from "@/i18n/config"

interface AppHeaderProps {
  onNotifOpen: () => void
}

export const AppHeader = memo(function AppHeader({ onNotifOpen }: AppHeaderProps) {
  const { activeStore, availableStores, setActiveStoreById } = useStore()
  const { userProfile, logout, isAdmin } = useAuth()
  const { unreadCount } = useNotifications()
  const t = useT()
  const { locale, setLocale } = useLocale()

  const role = userProfile?.role ?? "seller"

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3",
        "bg-sidebar pl-0 pr-3 text-sidebar-foreground",
        "sm:gap-4 sm:pr-4 md:pr-6"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <SidebarTrigger
          className={cn(
            "h-9 w-9 min-w-9 shrink-0 gap-0 rounded-lg border-0 p-0 text-sidebar-foreground",
            "justify-center [&>span]:sr-only",
            "-ml-0.5",
            "bg-transparent hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          )}
        />
        {availableStores.length > 1 ? (
          <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
            <Select value={activeStore?.id} onValueChange={setActiveStoreById}>
              <SelectTrigger
                className={cn(
                  "h-8 min-h-8 w-auto max-w-[min(calc(100vw-9.5rem),240px)] shrink-0 rounded-lg border border-sidebar-border/60",
                  "sm:h-9 sm:min-h-9",
                  "bg-transparent text-sidebar-foreground shadow-none",
                  "hover:bg-sidebar-accent/80 hover:data-[state=open]:bg-sidebar-accent/80",
                  "hover:text-sidebar-accent-foreground",
                  "justify-start gap-1.5 px-2.5 py-0 text-[13px] font-semibold",
                  "[&>span]:min-w-0 [&>span]:shrink [&>span]:truncate",
                  "[&>svg]:size-3.5 [&>svg]:shrink-0",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
                )}
                aria-label={t("header.storeSelect")}
              >
                <StoreIcon className="opacity-80" aria-hidden />
                <SelectValue placeholder={t("header.storeSelect")} />
              </SelectTrigger>
              <SelectContent align="start" className="z-[200] rounded-xl">
                {availableStores.map((store) => (
                  <SelectItem
                    key={store.id}
                    value={store.id}
                    className="rounded-lg text-xs"
                  >
                    {store.name} ({store.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : availableStores.length === 1 && activeStore ? (
          <div
            className={cn(
              "flex h-8 min-h-8 max-w-[min(calc(100vw-9.5rem),240px)] shrink-0 items-center gap-1.5",
              "rounded-lg border border-sidebar-border/40 px-2.5 text-[13px] font-semibold text-sidebar-foreground",
              "sm:h-9 sm:min-h-9"
            )}
            title={t("header.store", { name: activeStore.name })}
          >
            <StoreIcon className="size-3.5 shrink-0 opacity-80" aria-hidden />
            <span className="min-w-0 truncate">{activeStore.name}</span>
          </div>
        ) : (
          <div className="group-data-[collapsible=icon]:hidden">
            {isAdmin ? (
              <Button
                asChild
                variant="ghost"
                className="h-8 rounded-lg px-2.5 text-[12px] font-semibold text-primary hover:bg-primary/10 hover:text-primary sm:h-9"
              >
                <Link href="/admin/stores/new?setup=1">{t("header.createFirstStore")}</Link>
              </Button>
            ) : (
              <p className="text-[12px] font-medium italic text-muted-foreground">
                {t("header.noStoreAssigned")}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-9 gap-1.5 rounded-lg px-2 text-sidebar-foreground",
                "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              )}
              aria-label={t("header.language")}
            >
              <span className="text-base">{LOCALE_CONFIGS.find(cfg => cfg.code === locale)?.flag}</span>
              <span className="hidden text-xs font-semibold uppercase sm:inline-block">
                {locale}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={appDropdownContentClass} align="end">
            <DropdownMenuLabel className="px-3 py-1.5 text-xs text-muted-foreground">
              {t("header.language")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {LOCALE_CONFIGS.map((cfg) => (
              <DropdownMenuItem
                key={cfg.code}
                className={cn(
                  appDropdownItemClass,
                  locale === cfg.code && "bg-accent/60 font-medium"
                )}
                onClick={() => setLocale(cfg.code)}
              >
                <span className="mr-2 text-base">{cfg.flag}</span>
                <span className="text-sm">{cfg.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <AppHeaderIconButton
          icon={Bell}
          label={t("header.notifications")}
          onClick={onNotifOpen}
          badge={unreadCount}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-9 gap-2 rounded-lg px-2 text-sidebar-foreground",
                "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
                "sm:pl-2 sm:pr-2.5",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              )}
              aria-label={t("header.accountMenu")}
            >
              <UserAvatar
                user={{
                  uid: userProfile?.uid,
                  email: userProfile?.email,
                  firstName: userProfile?.firstName ?? "",
                  lastName: userProfile?.lastName ?? "",
                  photoURL: userProfile?.photoURL,
                }}
                size="sm"
                className="border border-sidebar-border"
              />
              <span className="hidden max-w-[10rem] truncate text-sm font-bold text-primary sm:inline">
                {userProfile?.firstName}
              </span>
              <ChevronDown
                className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block"
                aria-hidden
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={cn(appDropdownContentClass, "w-60")}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="px-3 py-3 font-normal">
              <div className="flex items-start gap-3">
                <UserAvatar
                  user={{
                    uid: userProfile?.uid,
                    email: userProfile?.email,
                    firstName: userProfile?.firstName ?? "",
                    lastName: userProfile?.lastName ?? "",
                    photoURL: userProfile?.photoURL,
                  }}
                  size="md"
                  className="border border-border"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-bold leading-none text-popover-foreground">
                    {userProfile?.firstName} {userProfile?.lastName}
                  </p>
                  {userProfile?.email ? (
                    <p className="truncate text-xs text-muted-foreground">{userProfile.email}</p>
                  ) : null}
                  <StatusBadge preset="userRole" value={role} className="text-[10px]" />
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className={appDropdownItemClass}>
              <Link href="/profile" className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/60">
                  <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
                {t("header.myProfile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className={appDropdownItemDestructiveClass} onClick={logout}>
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-destructive/10">
                <LogOut className="h-3.5 w-3.5" />
              </span>
              {t("header.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
})
AppHeader.displayName = "AppHeader"
