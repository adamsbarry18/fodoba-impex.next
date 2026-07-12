
"use client"

import { useState, useEffect } from "react"
import { ReportService } from "@/services/report.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Loader2, 
  Truck,
  TrendingDown,
  Globe,
  FileText
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useCurrency } from "@/hooks/use-currency"
import { useClientPagination } from "@/hooks/use-client-pagination"
import { TablePagination } from "@/components/ui/table-pagination"

const PAGE_SIZE = 50

export default function SupplierDebtReportPage() {
  const { formatAmount } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await ReportService.getFinanceConsolidation()
      setData(res)
    } catch (error) {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const suppliers = (data?.suppliers ?? []) as Array<{
    id: string
    name: string
    type: string
    country: string
    currentDebt: number
  }>

  const {
    paginatedItems: paginatedSuppliers,
    page,
    setPage,
    totalPages,
    totalItems: suppliersTotal,
    rangeStart,
    rangeEnd,
  } = useClientPagination(suppliers, { pageSize: PAGE_SIZE })

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
  if (!data) return null

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl">
            <Link href="/reports">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rapport des Dettes Fournisseurs</h1>
            <p className="text-muted-foreground">Suivi des encours d'approvisionnement et engagements financiers.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold">
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button className="rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Printer className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden bg-white">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Dettes</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-bold font-headline text-orange-600">{formatAmount(data.summary.totalSupplierDebt)}</div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Factures en attente de règlement</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden bg-white">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Poste Import / Local</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-bold font-headline text-gray-900">
              {data.suppliers.filter((s: any) => s.type === 'import').length} / {data.suppliers.filter((s: any) => s.type === 'local').length}
            </div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Répartition par origine</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden bg-white">
        <CardHeader className="p-8">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="w-5 h-5 text-orange-500" />
            État des comptes fournisseurs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="py-4 pl-8">Raison Sociale</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead className="text-right pr-8">Solde Dû (FCFA)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-gray-400 italic">
                    Aucun encours fournisseur enregistré.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSuppliers.map((s) => (
                  <TableRow key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4 pl-8 font-bold text-gray-900">{s.name}</TableCell>
                    <TableCell>
                      <StatusBadge
                        preset="supplierType"
                        value={s.type}
                        icon={s.type === "import" ? <Globe className="w-3 h-3" /> : undefined}
                        className="text-[10px]"
                      />
                    </TableCell>
                    <TableCell className="text-[13px] text-gray-500">{s.country}</TableCell>
                    <TableCell className="text-right pr-8 font-headline font-bold text-gray-900">
                      {s.currentDebt.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={suppliersTotal}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
