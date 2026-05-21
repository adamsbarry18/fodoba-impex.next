
"use client"

import { useState, useEffect } from "react"
import { ReportService } from "@/services/report.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Loader2, 
  Wallet,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Truck,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useCurrency } from "@/hooks/use-currency"

export default function FinanceReportPage() {
  const { formatAmount } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await ReportService.getFinanceConsolidation()
      setData(res)
    } catch (error) {
      toast.error("Erreur de consolidation")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent" /></div>
  if (!data) return null

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reports">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bilan des Créances & Dettes</h1>
            <p className="text-muted-foreground">Analyse consolidée du passif et de l'actif circulant.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-emerald-700 flex items-center">
              <TrendingDown className="w-3 h-3 mr-1" /> Créances Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-2xl font-bold text-emerald-800">
            {formatAmount(data.summary.totalClientDebt)}
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-destructive flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> Dettes Fournisseurs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-2xl font-bold text-destructive">
            {formatAmount(data.summary.totalSupplierDebt)}
          </CardContent>
        </Card>
        <Card className="bg-primary/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Solde Théorique Net</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-2xl font-bold">
            {formatAmount(data.summary.netBalance)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Debtors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-accent" />
              Principales Créances Clients
            </CardTitle>
            <CardDescription>Les 10 clients ayant les encours les plus élevés.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Dette (FCFA)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.clients.slice(0, 10).map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">{c.currentDebt.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Supplier Debts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-destructive" />
              Encours Fournisseurs
            </CardTitle>
            <CardDescription>Sommes restant à régler pour les approvisionnements.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-right">Dette (FCFA)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.suppliers.slice(0, 10).map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">{s.currentDebt.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex gap-3 items-center">
           <AlertCircle className="w-5 h-5 text-amber-600" />
           <p className="text-xs text-amber-700 leading-relaxed">
             <strong>Attention:</strong> Le solde théorique net est une indication comptable. 
             Il ne garantit pas la liquidité immédiate de l'entreprise. 
             Un suivi rigoureux des recouvrements clients est recommandé.
           </p>
        </CardContent>
      </Card>
    </div>
  )
}
