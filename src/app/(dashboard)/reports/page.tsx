
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  Package, 
  ArrowRight, 
  History,
  ShoppingCart,
  Users,
  Truck
} from "lucide-react"
import Link from "next/link"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/lib/auth/permissions"
import { cn } from "@/lib/utils"

const REPORT_CARDS = [
  {
    title: "Journal des Ventes",
    description: "Analyse détaillée du CA, des marges et des remises par boutique.",
    icon: ShoppingCart,
    href: "/reports/sales",
    color: "text-blue-600",
    bg: "bg-blue-50",
    hoverBg: "group-hover:bg-blue-100",
    permission: "view:reports:store" as Permission
  },
  {
    title: "État du Stock",
    description: "Niveaux d'inventaire, valorisation du PMP et alertes rupture.",
    icon: Package,
    href: "/reports/inventory",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    hoverBg: "group-hover:bg-emerald-100",
    permission: "view:stock" as Permission
  },
  {
    title: "Journal de Caisse",
    description: "Historique des sessions, clôtures et écarts de rapprochement.",
    icon: History,
    href: "/reports/cash",
    color: "text-purple-600",
    bg: "bg-purple-50",
    hoverBg: "group-hover:bg-purple-100",
    permission: "view:reports:cash" as Permission
  },
  {
    title: "Portefeuille Clients",
    description: "Analyse détaillée des créances et historique par client.",
    icon: Users,
    href: "/reports/clients",
    color: "text-amber-600",
    bg: "bg-amber-50",
    hoverBg: "group-hover:bg-amber-100",
    permission: "view:reports:clients" as Permission
  },
  {
    title: "Suivi Fournisseurs",
    description: "Analyse des achats, délais de livraison et dettes fournisseurs.",
    icon: Truck,
    href: "/reports/suppliers",
    color: "text-orange-600",
    bg: "bg-orange-50",
    hoverBg: "group-hover:bg-orange-100",
    permission: "view:reports:suppliers" as Permission
  }
]

export default function ReportsPage() {
  const { can } = usePermissions()

  const allowedReports = REPORT_CARDS.filter(report => can(report.permission))

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Centre de Reporting & BI</h1>
        <p className="text-muted-foreground text-[15px]">
          Accédez aux analyses consolidées et gérez les exports officiels FODOBA IMPEX.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 max-w-5xl">
        {allowedReports.map((report) => (
          <Card 
            key={report.href} 
            className="group border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100 rounded-[32px] overflow-hidden bg-white transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-1 cursor-pointer"
          >
            <Link href={report.href}>
              <CardHeader className="flex flex-col items-start gap-4 p-8 pb-4">
                <div className={cn(
                  "p-4 rounded-[20px] transition-colors duration-300",
                  report.bg, 
                  report.color,
                  report.hoverBg
                )}>
                  <report.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">{report.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-8">
                <p className="text-[15px] text-gray-500 leading-relaxed min-h-[45px]">
                  {report.description}
                </p>
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-[15px] group-hover:text-primary transition-all">
                    <span>Consulter le rapport</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/30 border-dashed rounded-[24px] max-w-5xl">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-[11px] flex items-center gap-2 font-bold text-gray-400 uppercase tracking-widest">
             <BarChart3 className="w-4 h-4 text-primary" />
             Information Système
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 text-[12px] text-gray-400 leading-relaxed">
          Les rapports sont générés en temps réel. Les montants sont systématiquement convertis dans la devise de référence (FCFA).
          Conformément à la section 12.3 du CDC, les exports PDF/Excel sont disponibles dans chaque vue détaillée.
        </CardContent>
      </Card>
    </div>
  )
}
