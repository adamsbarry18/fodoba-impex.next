
"use client"

import { useState, useEffect } from "react"
import { ReportService } from "@/services/report.service"
import { StoreService } from "@/services/store.service"
import { Sale, Store } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Search, 
  Loader2, 
  Calendar as CalendarIcon,
  ShoppingCart,
  TrendingUp,
  FileText
} from "lucide-react"
import Link from "next/link"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { useCurrency } from "@/hooks/use-currency"

export default function SalesReportPage() {
  const { formatAmount } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<Sale[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [totals, setTotals] = useState({ revenue: 0, discount: 0, debt: 0, count: 0 })

  // Filters
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"))
  const [storeId, setStoreId] = useState("all")

  const loadData = async () => {
    setLoading(true)
    try {
      const [salesRes, storesRes] = await Promise.all([
        ReportService.getSalesReport({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          storeId
        }),
        StoreService.listStores(100)
      ])
      setSales(salesRes.sales)
      setTotals(salesRes.totals)
      setStores(storesRes.stores)
    } catch (error) {
      toast.error("Erreur lors du chargement du rapport")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [startDate, endDate, storeId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reports">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Journal des Ventes</h1>
            <p className="text-muted-foreground">Historique complet des transactions réseau.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Date Début</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date Fin</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Boutique</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les boutiques" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les boutiques</SelectItem>
                  {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
               <Button className="w-full" onClick={loadData} disabled={loading}>
                 {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                 Filtrer
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-accent/5 border-accent/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Chiffre d'Affaires</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-headline text-accent">{formatAmount(totals.revenue)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">{totals.count} transactions validées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Total Remises</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-headline">{formatAmount(totals.discount)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Impact sur la rentabilité brute</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Part des Crédits</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-headline text-destructive">{formatAmount(totals.debt)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Ventes non encore encaissées</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Ref</TableHead>
                  <TableHead>Client / Vendeur</TableHead>
                  <TableHead>Boutique</TableHead>
                  <TableHead className="text-right">Total (FCFA)</TableHead>
                  <TableHead className="text-center">Encaissement</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Aucune vente pour cette période.</TableCell></TableRow>
                ) : (
                  sales.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs">#{s.id.slice(-6).toUpperCase()}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {s.timestamp?.toDate ? format(s.timestamp.toDate(), "dd/MM/yy HH:mm") : "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{s.clientName || "Client de passage"}</span>
                          <span className="text-[9px] text-muted-foreground italic">Par: {s.sellerName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{stores.find(st => st.id === s.storeId)?.code || "N/A"}</TableCell>
                      <TableCell className="text-right font-headline font-bold">{s.total.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                         {s.debtAmount > 0 ? (
                           <StatusBadge preset="salePayment" value="partial" className="text-[9px] uppercase" />
                         ) : (
                           <StatusBadge preset="salePayment" value="complete" className="text-[9px] uppercase" />
                         )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge preset="saleStatus" value={s.status} className="text-[9px] uppercase" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
