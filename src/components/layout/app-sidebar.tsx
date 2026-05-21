
"use client"

import * as React from "react"
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
  Settings,
  ShieldCheck,
  Receipt
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/lib/auth/permissions"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export function AppSidebar() {
  const pathname = usePathname()
  const { can } = usePermissions()

  const allNavItems = React.useMemo(() => [
    ...navigation.flatMap(group => group.items),
    ...adminItemsList
  ], [])

  const activeItem = React.useMemo(() => {
    const matches = allNavItems.filter(item => {
      if (item.url === "/dashboard" && pathname === "/dashboard") return true;
      if (item.url === "/dashboard") return false; 
      return pathname === item.url || pathname.startsWith(item.url + "/");
    });
    return matches.sort((a, b) => b.url.length - a.url.length)[0];
  }, [pathname, allNavItems]);

  const filteredNavigation = navigation.map(group => ({
    ...group,
    items: group.items.filter(item => !item.permission || can(item.permission as Permission))
  })).filter(group => group.items.length > 0)

  const allowedAdminItems = adminItemsList.filter(item => !item.permission || can(item.permission as Permission))

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-100 bg-white">
      <SidebarHeader className="h-16 flex items-center px-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-1.5 shadow-sm shrink-0">
            <StoreIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-headline font-bold text-lg leading-tight tracking-tight text-[#111827] group-data-[collapsible=icon]:hidden whitespace-nowrap">
            FODOBA
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 group-data-[collapsible=icon]:px-1 gap-0">
        {filteredNavigation.map((group) => (
          <SidebarGroup key={group.title} className="py-2">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[11px] font-semibold uppercase text-gray-400 tracking-wider mb-1 px-3">
              {group.title}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = activeItem?.url === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "h-10 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center rounded-xl transition-all duration-200",
                        isActive 
                          ? "bg-gray-100 text-gray-900 font-semibold" 
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-gray-400")} />
                        <span className="text-[13px] group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-1">
        {allowedAdminItems.length > 0 && (
          <div className="space-y-1">
            <SidebarSeparator className="mb-4 mx-2 group-data-[collapsible=icon]:mx-1" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex w-full justify-center">
                  <SidebarMenuButton
                    tooltip="Paramètres"
                    className="h-10 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center rounded-xl hover:bg-gray-100 transition-all duration-200 w-full justify-start text-gray-500 hover:text-gray-900"
                  >
                    <div className="bg-[#374151] rounded-full p-1.5 flex items-center justify-center shrink-0">
                      <Settings className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="ml-3 text-[13px] font-medium group-data-[collapsible=icon]:hidden">Paramètres</span>
                  </SidebarMenuButton>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="top" 
                align="start" 
                sideOffset={12}
                className="w-[220px] p-2 mb-2 rounded-2xl shadow-xl border-gray-100 bg-white"
              >
                <div className="px-3 py-2 mb-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gestion système</p>
                </div>
                {allowedAdminItems.map((item) => (
                  <DropdownMenuItem 
                    key={item.title} 
                    asChild 
                    className="px-3 py-2.5 rounded-xl cursor-pointer text-gray-700 focus:bg-gray-100 focus:text-gray-900 transition-colors"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-gray-400" />
                      <span className="text-[14px] font-medium">{item.title}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
