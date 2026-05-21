
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useStore } from "@/lib/contexts/StoreContext"
import { useCurrency } from "@/hooks/use-currency"
import { SaleService } from "@/services/sale.service"
import { ClientService } from "@/services/client.service"
import { SupplierService } from "@/services/supplier.service"
import { ProductService } from "@/services/product.service"
import { CashService } from "@/services/cash.service"
import { Sale, Client, Supplier, CashSession, Product } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  ShoppingCart,
  Truck,
  CreditCard,
  Loader2,
  Calendar,
  AlertCircle,
  ChevronRight
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer
} from "recharts"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart"
import Link from "next/link"
import { format, startOfDay, endOfDay, isWithinInterval, subDays, subMonths, eachMonthOfInterval } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const chartConfig = {
  sales: {
    label: "Ventes",
    color: "hsl(var(--primary))",
  }
} satisfies ChartConfig

interface LowStockItem extends Product {
  currentStock: number;
}

export default function DashboardPage() {
  const { userProfile } = useAuth()
  const { activeStore } = useStore()
  const { formatAmount } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")

  // Data States
  const [sales, setSales] = useState<Sale[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [cashSession, setCashSession] = useState<CashSession | null>(null)

  const loadDashboardData = useCallback(async () => {
    if (!userProfile || !activeStore) return
    setLoading(true)
    try {
      // Les clients et fournisseurs sont partagés globalement (CDC 3.1)
      const [clientsRes, suppliersRes] = await Promise.all([
        ClientService.listClients(),
        SupplierService.listSuppliers()
      ])
      setClients(clientsRes)
      setSuppliers(suppliersRes)

      // Données spécifiques à la boutique active (Même pour l'Admin, on scope à la sélection)
      const [salesRes, sessionRes, productsRes] = await Promise.all([
        SaleService.listRecentSales(activeStore.id, 200),
        CashService.getActiveSession(activeStore.id),
        ProductService.listProducts({ active: true }, 100)
      ])
      
      setSales(salesRes.sales)
      setCashSession(sessionRes)
      
      // Calcul des alertes de stock réelles pour CETTE boutique
      const productIds = productsRes.products.map(p => p.id);
      const stocks = await ProductService.getStockLevelsForProducts(productIds, activeStore.id);
      
      const alerts = productsRes.products
        .map(p => ({ ...p, currentStock: stocks[p.id] || 0 }))
        .filter(p => p.currentStock <= p.lowStockThreshold)
        .sort((a, b) => a.currentStock - b.currentStock);
        
      setLowStockItems(alerts)

    } catch (error) {
      console.error("Dashboard load error:", error)
    } finally {
      setLoading(false)
    }
  }, [userProfile, activeStore])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const stats = useMemo(() => {
    const now = new Date()
    let startDate: Date;

    switch (timeRange) {
      case "24h": startDate = subDays(now, 1); break;
      case "7d": startDate = subDays(now, 7); break;
      case "30d": startDate = subDays(now, 30); break;
      case "3m": startDate = subMonths(now, 3); break;
      case "12m": startDate = subMonths(now, 12); break;
      default: startDate = subDays(now, 7);
    }

    const interval = { start: startOfDay(startDate), end: endOfDay(now) }
    
    const filteredSales = sales.filter(s => {
      const d = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp)
      return isWithinInterval(d, interval)
    })

    const periodRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0)
    const totalClientDebt = clients.reduce((acc, c) => acc + (c.currentDebt || 0), 0)
    const totalSupplierDebt = suppliers.reduce((acc, s) => acc + (s.currentDebt || 0), 0)
    
    let chartData = []
    if (timeRange === "12m" || timeRange === "3m") {
      const months = eachMonthOfInterval(interval)
      chartData = months.map(m => {
        const monthSales = sales.filter(s => {
          const d = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp)
          return format(d, 'yyyy-MM') === format(m, 'yyyy-MM')
        }).reduce((acc, s) => acc + s.total, 0)
        
        return {
          name: format(m, 'MMM', { locale: fr }),
          sales: monthSales
        }
      })
    } else {
      const daysCount = timeRange === "24h" ? 1 : (timeRange === "7d" ? 7 : 30)
      chartData = Array.from({ length: daysCount }, (_, i) => {
        const date = subDays(now, i)
        const daySales = sales.filter(s => {
          const d = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp)
          return format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        }).reduce((acc, s) => acc + s.total, 0)
        
        return { 
          name: format(date, 'EEE', { locale: fr }), 
          sales: daySales
        }
      }).reverse()
    }

    return {
      periodRevenue,
      totalClientDebt,
      totalSupplierDebt,
      chartData,
      salesCount: filteredSales.length
    }
  }, [sales, clients, suppliers, timeRange])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Analyse des flux FODOBA...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-[13px] font-bold text-primary/60 uppercase tracking-widest mb-1">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: fr })}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-[#111827]">
            Bonjour <span className="text-primary">{userProfile?.prenom}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Boutique active : <span className="font-bold text-gray-900">{activeStore?.name}</span></p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full md:w-[220px] h-12 bg-white border-gray-100 rounded-xl shadow-sm text-[13px] font-bold text-gray-600 focus:ring-4 focus:ring-primary/5 transition-all">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Période" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
              <SelectItem value="24h" className="text-[13px] py-2.5">Dernières 24h</SelectItem>
              <SelectItem value="7d" className="text-[13px] py-2.5">7 derniers jours</SelectItem>
              <SelectItem value="30d" className="text-[13px] py-2.5">30 derniers jours</SelectItem>
              <SelectItem value="3m" className="text-[13px] py-2.5">3 derniers mois</SelectItem>
              <SelectItem value="12m" className="text-[13px] py-2.5">12 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          
          <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all text-[14px]" asChild>
            <Link href="/pos">
              Vente
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-gray-400">CA Boutique</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-gray-900">{formatAmount(stats.periodRevenue)}</div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">{stats.salesCount} transactions locale(s)</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Créances Clients</CardTitle>
            <CreditCard className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-destructive">{formatAmount(stats.totalClientDebt)}</div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Encours global réseau</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Dettes Fournisseurs</CardTitle>
            <Truck className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-gray-900">{formatAmount(stats.totalSupplierDebt)}</div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Global FODOBA</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Trésorerie Locale</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-gray-900">{formatAmount(cashSession?.expectedBalances?.CASH || 0)}</div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Espèces en caisse</p>
          </CardContent>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[24px] ring-1 ring-red-100 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-[17px] font-bold text-gray-900">Alertes de stock</CardTitle>
                <p className="text-[11px] text-red-400 font-medium">Produits en rupture à {activeStore?.code}</p>
              </div>
            </div>
            <Button variant="link" className="text-primary font-bold text-[13px] h-auto p-0 flex items-center gap-1.5" asChild>
              <Link href="/inventory">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-2">
              {lowStockItems.slice(0, 4).map((item) => (
                <Link key={item.id} href={`/inventory/${item.id}`}>
                  <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-primary/20 transition-all group">
                    <span className="text-[14px] font-bold text-gray-700 group-hover:text-primary transition-colors">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[15px] font-headline font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                        {item.currentStock}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-none shadow-sm bg-white rounded-[24px] ring-1 ring-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Performance - {activeStore?.code}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="sales" stroke="var(--color-sales)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-sales)" }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-sm bg-white rounded-[24px] ring-1 ring-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Ventes Locales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {sales.slice(0, 6).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-gray-900 uppercase">#{sale.id.slice(-6)}</p>
                    <p className="text-[11px] text-gray-400 font-medium">{sale.clientName || "Passage"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-bold text-gray-900">{formatAmount(sale.total)}</p>
                  <p className="text-[9px] text-gray-400">{sale.timestamp?.toDate ? format(sale.timestamp.toDate(), 'HH:mm') : ''}</p>
                </div>
              </div>
            ))}
            {sales.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm italic">
                Aucune transaction récente pour {activeStore?.name}.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
