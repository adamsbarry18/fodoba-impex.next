"use client"

import React, { memo, useMemo, useState, useEffect, useRef } from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Calculator,
  Wallet,
  Store as StoreIcon,
  Users,
  FolderTree,
  History,
  ArrowRightLeft,
  UsersRound,
  Truck,
  Coins,
  BarChart3,
  Cog,
  ShieldCheck,
  Receipt,
} from "lucide-react"

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
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/lib/auth/permissions"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

interface NavItem {
  title: string;
  icon: any;
  url: string;
  permission?: Permission;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: "Général",
    items: [
      { title: "Accueil", icon: LayoutDashboard, url: "/dashboard", permission: 'view:reports:store' },
    ],
  },
  {
    title: "Commercial",
    items: [
      { title: "Point de Vente", icon: ShoppingCart, url: "/pos", permission: 'create:sale' },
      { title: "Achats / Appro", icon: Truck, url: "/purchases", permission: 'manage:purchases' },
      { title: "Inventaire", icon: Package, url: "/inventory", permission: 'view:stock' },
      { title: "Clients", icon: UsersRound, url: "/clients", permission: 'view:clients' },
    ],
  },
  {
    title: "Stock & Flux",
    items: [
      { title: "Historique Flux", icon: History, url: "/inventory/history", permission: 'view:stock' },
      { title: "Transfert Stock", icon: ArrowRightLeft, url: "/inventory/transfers/new", permission: 'manage:transfers' },
      { title: "Catégories", icon: FolderTree, url: "/admin/categories", permission: 'manage:catalog' },
    ],
  },
  {
    title: "Finance & Analyse",
    items: [
      { title: "Rapports & BI", icon: BarChart3, url: "/reports", permission: 'view:reports:store' },
      { title: "Caisse & Trésorerie", icon: Wallet, url: "/reconciliation", permission: 'reconcile:cash' },
      { title: "Dépenses", icon: Receipt, url: "/expenses", permission: 'manage:expenses' },
      { title: "Fournisseurs", icon: UsersRound, url: "/suppliers", permission: 'view:suppliers' },
      { title: "Coût de Revient", icon: Calculator, url: "/landed-cost", permission: 'manage:purchases' },
    ],
  },
]

const adminItemsList = [
  { title: "Boutiques", icon: StoreIcon, url: "/admin/stores", permission: 'manage:stores' },
  { title: "Collaborateurs", icon: Users, url: "/admin/users", permission: 'manage:users' },
  { title: "Taux de Change", icon: Coins, url: "/admin/currencies", permission: 'manage:currencies' },
  { title: "Logs d'audit", icon: ShieldCheck, url: "/admin/audit", permission: 'manage:stores' },
]

export const AppSidebar = memo(function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { can } = usePermissions()
  const { isMobile, setOpenMobile, openMobile } = useSidebar()
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false)
  const settingsMenuRef = useRef<HTMLLIElement | null>(null)

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

  const allNavItems = useMemo(() => [
    ...navigation.flatMap(group => group.items),
    ...adminItemsList
  ], [])

  const activeItem = useMemo(() => {
    const matches = allNavItems.filter(item => {
      if (item.url === "/dashboard" && pathname === "/dashboard") return true
      if (item.url === "/dashboard") return false
      return pathname === item.url || pathname.startsWith(item.url + "/")
    })
    return matches.sort((a, b) => b.url.length - a.url.length)[0]
  }, [pathname, allNavItems])

  const filteredNavigation = useMemo(() => navigation.map(group => ({
    ...group,
    items: group.items.filter(item => !item.permission || can(item.permission as Permission))
  })).filter(group => group.items.length > 0), [can])

  const allowedAdminItems = useMemo(() => adminItemsList.filter(item => !item.permission || can(item.permission as Permission)), [can])

  const showSettingsGroup = allowedAdminItems.length > 0

  const settingsSectionActive = useMemo(() => allowedAdminItems.some((item) => {
    if (item.url === "/dashboard") return false
    return pathname === item.url || pathname.startsWith(item.url + "/")
  }), [pathname, allowedAdminItems])

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-0 p-1 bg-sidebar">
      <SidebarHeader className={cn("gap-2 px-3 py-3", isMobile && "pr-12")}>
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary shadow-sm",
              "ring-1 ring-inset ring-black/5"
            )}
          >
            <Image src="/images/logo.png" alt="FODOBA" width={20} height={20} />
          </div>
          <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              FODOBA
            </p>
            <p className="truncate text-[11px] text-muted-foreground font-medium">
              Gestion d&apos;Import-Export
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1.5 pt-2 gap-0">
        {filteredNavigation.map((group) => (
          <SidebarGroup key={group.title} className="p-0 py-2">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[11px] font-semibold uppercase text-muted-foreground tracking-wider mb-1 px-3">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = activeItem?.url === item.url
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.url} onClick={closeMobileNav}>
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
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
                    title="Paramètres"
                    aria-expanded={settingsMenuOpen}
                    onClick={() => setSettingsMenuOpen((v) => !v)}
                    className={cn(
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "data-[state=open]:bg-[hsl(var(--sidebar-active))]",
                      "data-[state=open]:text-sidebar-accent-foreground",
                      "data-[state=open]:shadow-sm data-[state=open]:ring-1",
                      "data-[state=open]:ring-primary/20"
                    )}
                  >
                    <Cog className="h-4 w-4 shrink-0" />
                    <span className="truncate">Paramètres</span>
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
                          Paramètres
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Gestion système
                        </p>
                      </div>
                      <Separator />
                      <nav className="flex flex-col py-1" aria-label="Paramètres">
                        {allowedAdminItems.map((item) => (
                          <Link
                            key={item.url}
                            href={item.url}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 text-sm text-popover-foreground outline-none transition-colors",
                              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              "active:bg-sidebar-accent active:text-sidebar-accent-foreground",
                              "focus-visible:bg-sidebar-accent focus-visible:text-sidebar-accent-foreground",
                              pathname.startsWith(item.url) && "bg-accent/60 font-medium"
                            )}
                            onClick={() => {
                              setSettingsMenuOpen(false)
                              closeMobileNav()
                            }}
                          >
                            <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span>{item.title}</span>
                          </Link>
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
                      title="Paramètres"
                      className={cn(
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "data-[state=open]:bg-[hsl(var(--sidebar-active))]",
                        "data-[state=open]:text-sidebar-accent-foreground",
                        "data-[state=open]:shadow-sm data-[state=open]:ring-1",
                        "data-[state=open]:ring-primary/20"
                      )}
                    >
                      <Cog className="h-4 w-4 shrink-0" />
                      <span className="truncate">Paramètres</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className={cn(
                      "z-[200] w-56 min-w-[14rem] rounded-xl border bg-popover py-1 text-popover-foreground shadow-lg",
                    )}
                    side="top"
                    align="start"
                    sideOffset={10}
                    collisionPadding={12}
                  >
                    <DropdownMenuLabel className="px-3 py-3 font-normal">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold leading-none text-popover-foreground">
                          Paramètres
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Gestion système
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allowedAdminItems.map((item) => (
                      <DropdownMenuItem
                        key={item.url}
                        asChild
                        className="cursor-pointer gap-2 px-3 py-2.5 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground"
                      >
                        <Link
                          href={item.url}
                          className="flex cursor-pointer items-center gap-2"
                          onClick={closeMobileNav}
                        >
                          <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>{item.title}</span>
                        </Link>
                      </DropdownMenuItem>
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
