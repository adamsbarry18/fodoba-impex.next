import type { LucideIcon } from "lucide-react"
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
  ShieldCheck,
  Receipt,
  Building2,
} from "lucide-react"
import type { Permission } from "@/lib/auth/permissions"

export interface NavItem {
  title: string
  icon: LucideIcon
  url: string
  permission?: Permission
  description?: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const APP_NAVIGATION: NavGroup[] = [
  {
    title: "Général",
    items: [
      {
        title: "Accueil",
        icon: LayoutDashboard,
        url: "/dashboard",
        permission: "view:reports:store",
        description: "Vue d'ensemble et indicateurs",
      },
    ],
  },
  {
    title: "Commercial",
    items: [
      {
        title: "Point de Vente",
        icon: ShoppingCart,
        url: "/pos",
        permission: "create:sale",
        description: "Encaissement et ventes",
      },
      {
        title: "Achats / Appro",
        icon: Truck,
        url: "/purchases",
        permission: "manage:purchases",
        description: "Commandes fournisseurs",
      },
      {
        title: "Inventaire",
        icon: Package,
        url: "/inventory",
        permission: "view:stock",
        description: "Catalogue et stocks",
      },
      {
        title: "Clients",
        icon: UsersRound,
        url: "/clients",
        permission: "view:clients",
        description: "Portefeuille clients",
      },
    ],
  },
  {
    title: "Stock et Flux",
    items: [
      {
        title: "Historique Flux",
        icon: History,
        url: "/inventory/history",
        permission: "view:stock",
        description: "Mouvements de stock",
      },
      {
        title: "Transfert Stock",
        icon: ArrowRightLeft,
        url: "/inventory/transfers/new",
        permission: "manage:transfers",
        description: "Entre boutiques",
      },
      {
        title: "Catégories",
        icon: FolderTree,
        url: "/admin/categories",
        permission: "manage:catalog",
        description: "Organisation catalogue",
      },
    ],
  },
  {
    title: "Finance & Analyse",
    items: [
      {
        title: "Rapports et BI",
        icon: BarChart3,
        url: "/reports",
        permission: "view:reports:store",
        description: "Analyses et exports",
      },
      {
        title: "Caisse et Trésorerie",
        icon: Wallet,
        url: "/reconciliation",
        permission: "reconcile:cash",
        description: "Sessions et fonds",
      },
      {
        title: "Dépenses",
        icon: Receipt,
        url: "/expenses",
        permission: "manage:expenses",
        description: "Charges et sorties",
      },
      {
        title: "Fournisseurs",
        icon: Building2,
        url: "/suppliers",
        permission: "view:suppliers",
        description: "Partenaires d'achat",
      },
      {
        title: "Coût de Revient",
        icon: Calculator,
        url: "/landed-cost",
        permission: "manage:purchases",
        description: "Calcul landed cost",
      },
    ],
  },
]

export const APP_ADMIN_NAV: NavItem[] = [
  {
    title: "Boutiques",
    icon: StoreIcon,
    url: "/admin/stores",
    permission: "manage:stores",
    description: "Points de vente",
  },
  {
    title: "Collaborateurs",
    icon: Users,
    url: "/admin/users",
    permission: "manage:users",
    description: "Comptes et rôles",
  },
  {
    title: "Taux de Change",
    icon: Coins,
    url: "/admin/currencies",
    permission: "manage:currencies",
    description: "Devises et conversions",
  },
  {
    title: "Logs d'audit",
    icon: ShieldCheck,
    url: "/admin/audit",
    permission: "manage:stores",
    description: "Traçabilité système",
  },
]

export function isNavItemActive(pathname: string, url: string): boolean {
  if (url === "/dashboard") return pathname === "/dashboard"
  return pathname === url || pathname.startsWith(`${url}/`)
}

export function findActiveNavItem(pathname: string, items: NavItem[]): NavItem | undefined {
  const matches = items.filter((item) => isNavItemActive(pathname, item.url))
  return matches.sort((a, b) => b.url.length - a.url.length)[0]
}

export function getAllNavItems(): NavItem[] {
  return [...APP_NAVIGATION.flatMap((group) => group.items), ...APP_ADMIN_NAV]
}
