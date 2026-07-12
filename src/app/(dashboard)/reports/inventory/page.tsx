
"use client"

import { useState, useEffect } from "react"
import { ReportService } from "@/services/report.service"
import { StoreService } from "@/services/store.service"
import { Store } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Loader2, 
  Package,
  CircleDollarSign,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useCurrency } from "@/hooks/use-currency"
import { useClientPagination } from "@/hooks/use-client-pagination"
import { TablePagination } from "@/components/ui/table-pagination"

const PAGE_SIZE = 50

export default function InventoryReportPage() {
  const { formatAmount } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [storeId, setStoreId] = useState("all")
  const [totalValuation, setTotalValuation] = useState(0)

  const itemsResetKey = `${storeId}|${items.length}`
  const {
    paginatedItems: paginatedItems,
    page,
    setPage,
    totalPages,
    totalItems: itemsTotal,
    rangeStart,
    rangeEnd,
  } = useClientPagination(items, { pageSize: PAGE_SIZE, resetKey: itemsResetKey })

  const loadData = async () => {
    setLoading(true)
    try {
      const [reportRes, storesRes] = await Promise.all([
        ReportService.getInventoryReport(storeId),
        StoreService.listStores(100)
      ])
      setItems(reportRes.items)
      setTotalValuation(reportRes.totalValuation)
      setStores(storesRes.stores)
    } catch (error) {
      toast.error("Erreur lors de la génération du rapport")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [storeId])

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
            <h1 className="text-3xl font-bold tracking-tight">Valorisation des Stocks</h1>
            <p className="text-muted-foreground">Inventaire physique et financier consolidé.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Imprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Filtre Boutique</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
             <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout le réseau</SelectItem>
                  {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
             </Select>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 bg-emerald-50 border-emerald-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-emerald-700 font-bold flex items-center">
              <CircleDollarSign className="w-3 h-3 mr-1" /> Valeur Totale du Stock (PMP)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
             <div className="text-3xl font-headline font-bold text-emerald-800">{formatAmount(totalValuation)}</div>
             <p className="text-[10px] text-emerald-600">Estimation basée sur les derniers coûts d'achat réceptionnés.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent" /></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Désignation</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-right">Coût Unit. (PMP)</TableHead>
                    <TableHead className="text-right">Valeur Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Aucun produit trouvé.</TableCell></TableRow>
                  ) : (
                    paginatedItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-bold">{item.name}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{item.sku}</TableCell>
                        <TableCell className="text-center font-bold">
                          {item.stock} <span className="text-[10px] font-normal text-muted-foreground">{item.unit}</span>
                          {item.stock <= 0 && <span title="Rupture"><AlertTriangle className="w-3 h-3 text-destructive inline ml-1" /></span>}
                        </TableCell>
                        <TableCell className="text-right">{item.unitCost.toLocaleString()} FCFA</TableCell>
                        <TableCell className="text-right font-headline font-bold text-accent">
                          {item.valuation.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                page={page}
                totalPages={totalPages}
                totalItems={itemsTotal}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
