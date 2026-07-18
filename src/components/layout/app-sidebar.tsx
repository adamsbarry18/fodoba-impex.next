"use client"

import React, { memo, useMemo, useState, useEffect, useRef } from "react"
import { Cog, X } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { usePermissions } from "@/hooks/use-permissions"
import type { Permission } from "@/lib/auth/permissions"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { AppLogo } from "@/components/layout/app-logo"
import {
  APP_ADMIN_NAV,
  APP_NAVIGATION,
  findActiveNavItem,
  getAllNavItems,
  isNavItemActive,
} from "@/lib/navigation/app-nav"
import {
  AppDropdownNavItem,
  AppMobileNavLink,
  NavIconBox,
  SidebarNavMenuItem,
  appDropdownContentClass,
} from "@/components/layout/nav-menu-items"
import { useT } from "@/i18n/context"

export const AppSidebar = memo(function AppSidebar() {
  const pathname = usePathname()
  const { can } = usePermissions()
  const { isMobile, setOpenMobile, openMobile } = useSidebar()
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false)
  const settingsMenuRef = useRef<HTMLLIElement | null>(null)
  const t = useT()

  useEffect(() => {
    if (!openMobile) setSettingsMenuOpen(false)
  }, [openMobile])

  useEffect(() => {
    if (!isMobile || !settingsMenuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (settingsMenuRef.current?.contains(target)) return
      setSettingsMenuOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [isMobile, settingsMenuOpen])

  const closeMobileNav = () => {
    if (isMobile) setOpenMobile(false)
  }

  const activeItem = useMemo(
    () => findActiveNavItem(pathname, getAllNavItems()),
    [pathname]
  )

  const filteredNavigation = useMemo(
    () =>
      APP_NAVIGATION.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => !item.permission || can(item.permission as Permission)
        ),
      })).filter((group) => group.items.length > 0),
    [can]
  )

  const allowedAdminItems = useMemo(
    () =>
      APP_ADMIN_NAV.filter(
        (item) => !item.permission || can(item.permission as Permission)
      ),
    [can]
  )

  const showSettingsGroup = allowedAdminItems.length > 0

  const settingsSectionActive = useMemo(
    () => allowedAdminItems.some((item) => isNavItemActive(pathname, item.url)),
    [pathname, allowedAdminItems]
  )

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      hideMobileCloseButton
      className="border-0 bg-sidebar p-1"
    >
      <SidebarHeader className="gap-2 px-3 py-3">
        <div className="flex h-9 items-center gap-2.5">
          <AppLogo />
          <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              {t("common.appName")}
            </p>
            <p className="truncate text-[11px] font-medium text-muted-foreground">
              {t("sidebar.importExport")}
            </p>
          </div>
          {isMobile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto h-9 w-9 shrink-0 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
              onClick={() => setOpenMobile(false)}
              aria-label={t("sidebar.closeMenu")}
            >
              <X className="h-5 w-5" aria-hidden />
            </Button>
          ) : null}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1.5 pt-2">
        {filteredNavigation.map((group) => (
          <SidebarGroup key={group.title} className="p-0 py-2">
            <SidebarGroupLabel className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
              {t(group.title)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => (
                  <SidebarNavMenuItem
                    key={item.url}
                    item={item}
                    isActive={activeItem?.url === item.url}
                    onNavigate={closeMobileNav}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {showSettingsGroup ? (
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem className="relative" ref={settingsMenuRef}>
              {isMobile ? (
                <>
                  <SidebarMenuButton
                    type="button"
                    isActive={settingsSectionActive}
                    title={t("nav.settings")}
                    aria-expanded={settingsMenuOpen}
                    onClick={() => setSettingsMenuOpen((v) => !v)}
                    className={cn(
                      "h-9 gap-2.5 rounded-lg px-2.5",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "data-[state=open]:bg-[hsl(var(--sidebar-active))]",
                      "data-[state=open]:text-sidebar-accent-foreground",
                      "data-[state=open]:shadow-sm data-[state=open]:ring-1",
                      "data-[state=open]:ring-primary/20"
                    )}
                  >
                    {settingsSectionActive ? (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                        aria-hidden
                      />
                    ) : null}
                    <NavIconBox icon={Cog} active={settingsSectionActive} />
                    <span className="truncate font-medium">{t("nav.settings")}</span>
                  </SidebarMenuButton>

                  {settingsMenuOpen ? (
                    <div
                      className={cn(
                        "absolute bottom-full left-0 z-[220] mb-2 w-[min(calc(100vw-2rem),18rem)] rounded-xl border bg-popover p-0 text-popover-foreground shadow-lg",
                        "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-150"
                      )}
                    >
                      <div className="px-3 py-3">
                        <p className="text-sm font-semibold leading-none text-popover-foreground">
                          {t("nav.settings")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("nav.settingsDesc")}
                        </p>
                      </div>
                      <Separator />
                      <nav className="flex flex-col gap-0.5 p-1.5" aria-label={t("nav.settings")}>
                        {allowedAdminItems.map((item) => (
                          <AppMobileNavLink
                            key={item.url}
                            item={item}
                            isActive={isNavItemActive(pathname, item.url)}
                            onNavigate={() => {
                              setSettingsMenuOpen(false)
                              closeMobileNav()
                            }}
                          />
                        ))}
                      </nav>
                    </div>
                  ) : null}
                </>
              ) : (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      isActive={settingsSectionActive}
                      title={t("nav.settings")}
                      className={cn(
                        "h-9 gap-2.5 rounded-lg px-2.5",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "data-[state=open]:bg-[hsl(var(--sidebar-active))]",
                        "data-[state=open]:text-sidebar-accent-foreground",
                        "data-[state=open]:shadow-sm data-[state=open]:ring-1",
                        "data-[state=open]:ring-primary/20"
                      )}
                    >
                      {settingsSectionActive ? (
                        <span
                          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                          aria-hidden
                        />
                      ) : null}
                      <NavIconBox icon={Cog} active={settingsSectionActive} />
                      <span className="truncate font-medium">{t("nav.settings")}</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className={appDropdownContentClass}
                    side="top"
                    align="start"
                    sideOffset={10}
                    collisionPadding={12}
                  >
                    <DropdownMenuLabel className="px-3 py-3 font-normal">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold leading-none text-popover-foreground">
                          {t("nav.settings")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("nav.settingsDesc")}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allowedAdminItems.map((item) => (
                      <AppDropdownNavItem
                        key={item.url}
                        item={item}
                        isActive={isNavItemActive(pathname, item.url)}
                        onNavigate={closeMobileNav}
                      />
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      ) : null}
    </Sidebar>
  )
})
AppSidebar.displayName = "AppSidebar"
