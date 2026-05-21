"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  BarChart3, 
  Package, 
  ArrowRight, 
  History,
  ShoppingCart,
  Users,
  Truck,
  Search,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  TrendingUp
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
    borderColor: "hover:border-blue-500/25 hover:shadow-blue-500/[0.03]",
    bg: "bg-blue-50",
    hoverBg: "group-hover:bg-blue-100",
    permission: "view:reports:store" as Permission,
    category: "finance"
  },
  {
    title: "État du Stock",
    description: "Niveaux d'inventaire, valorisation du PMP et alertes rupture.",
    icon: Package,
    href: "/reports/inventory",
    color: "text-emerald-600",
    borderColor: "hover:border-emerald-500/25 hover:shadow-emerald-500/[0.03]",
    bg: "bg-emerald-50",
    hoverBg: "group-hover:bg-emerald-100",
    permission: "view:stock" as Permission,
    category: "logistics"
  },
  {
    title: "Journal de Caisse",
    description: "Historique des sessions, clôtures et écarts de rapprochement.",
    icon: History,
    href: "/reports/cash",
    color: "text-purple-600",
    borderColor: "hover:border-purple-500/25 hover:shadow-purple-500/[0.03]",
    bg: "bg-purple-50",
    hoverBg: "group-hover:bg-purple-100",
    permission: "view:reports:cash" as Permission,
    category: "finance"
  },
  {
    title: "Portefeuille Clients",
    description: "Analyse détaillée des créances et historique par client.",
    icon: Users,
    href: "/reports/clients",
    color: "text-amber-600",
    borderColor: "hover:border-amber-500/25 hover:shadow-amber-500/[0.03]",
    bg: "bg-amber-50",
    hoverBg: "group-hover:bg-amber-100",
    permission: "view:reports:clients" as Permission,
    category: "clients"
  },
  {
    title: "Suivi Fournisseurs",
    description: "Analyse des achats, délais de livraison et dettes fournisseurs.",
    icon: Truck,
    href: "/reports/suppliers",
    color: "text-orange-600",
    borderColor: "hover:border-orange-500/25 hover:shadow-orange-500/[0.03]",
    bg: "bg-orange-50",
    hoverBg: "group-hover:bg-orange-100",
    permission: "view:reports:suppliers" as Permission,
    category: "logistics"
  }
]

const CATEGORIES = [
  { id: "all", label: "Tous les rapports" },
  { id: "finance", label: "Finances & Caisse" },
  { id: "logistics", label: "Stocks & Achats" },
  { id: "clients", label: "Clients" }
]

export default function ReportsPage() {
  const { can } = usePermissions()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  // Filter based on both category selection and search query
  const allowedReports = REPORT_CARDS.filter(report => {
    const hasPermission = can(report.permission)
    const matchesCategory = activeCategory === "all" || report.category === activeCategory
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          report.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return hasPermission && matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-2">
      {/* Premium Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3 h-3" />
            <span>Centre de Décision & BI</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-headline">
            Centre de Reporting & BI
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Accédez aux analyses consolidées en temps réel et gérez les exports de conformité FODOBA IMPEX.
          </p>
        </div>

        {/* Dynamic BI Metrics */}
        <div className="grid grid-cols-2 sm:flex items-center gap-3">
          <div className="bg-card border border-border rounded-xl p-3 px-4 shadow-sm flex flex-col justify-center min-w-[130px]">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Disponibles</span>
            <span className="text-xl font-extrabold text-foreground mt-0.5">{allowedReports.length} rapports</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 px-4 shadow-sm flex flex-col justify-center min-w-[130px]">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Synchronisation</span>
            <span className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live / 24h
            </span>
          </div>
        </div>
      </div>

      {/* Modern Filter & Search Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/20 p-3 rounded-2xl border border-border">
        {/* Category Pill Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200",
                activeCategory === cat.id
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Premium Search Input */}
        <div className="relative min-w-[280px] lg:max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un rapport..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 w-full bg-background border-border rounded-xl text-xs focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Reports Grid with Premium Cards */}
      {allowedReports.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allowedReports.map((report) => {
            const IconComponent = report.icon
            return (
              <Card
                key={report.href}
                className={cn(
                  "group relative border border-border bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between cursor-pointer",
                  report.borderColor
                )}
              >
                <Link href={report.href} className="flex flex-col h-full justify-between">
                  <div>
                    {/* Header with Styled Icon */}
                    <CardHeader className="p-6 pb-2 flex flex-row items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl transition-transform duration-300 group-hover:scale-105",
                        report.bg,
                        report.color
                      )}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                          {report.title}
                        </CardTitle>
                        <span className="inline-block text-[9px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded-md">
                          {report.category === "finance" ? "Finance & Caisse" : report.category === "logistics" ? "Stocks & Achats" : "Tiers & Clients"}
                        </span>
                      </div>
                    </CardHeader>

                    {/* Report Description */}
                    <CardContent className="p-6 pt-2">
                      <p className="text-xs text-muted-foreground leading-relaxed min-h-[40px]">
                        {report.description}
                      </p>
                    </CardContent>
                  </div>

                  {/* Elegant Call to Action Footer */}
                  <div className="p-6 pt-0 border-t border-border/10 mt-auto flex items-center justify-between text-xs font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                    <span>Consulter le rapport</span>
                    <div className="w-6 h-6 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors duration-200">
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Beautiful Empty State */
        <div className="text-center py-16 bg-card border-2 border-dashed border-border rounded-2xl max-w-md mx-auto space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Aucun rapport trouvé</h3>
            <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
              Nous n'avons trouvé aucun rapport correspondant à vos critères de recherche ou de catégorie.
            </p>
          </div>
          <Button 
            onClick={() => { setSearchQuery(""); setActiveCategory("all") }}
            variant="outline" 
            className="h-9 text-xs rounded-xl"
          >
            Réinitialiser les filtres
          </Button>
        </div>
      )}

      {/* Redesigned Compliance Alert Information */}
      <Card className="bg-primary/[0.02] border border-primary/10 rounded-2xl overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-xl text-primary flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              Conformité et Synchronisation
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
              Les rapports et graphiques analytiques sont recalculés en temps réel avec conversion automatique en **FCFA**. 
              Conformément à la **section 12.3 du Cahier des Charges**, chaque vue de rapport permet d'exporter les données officielles au format **PDF et Excel (CSV)** avec traçabilité complète des transactions.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
