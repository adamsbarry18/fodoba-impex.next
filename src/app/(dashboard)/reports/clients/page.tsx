
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
  Users,
  TrendingUp,
  AlertCircle,
  Wallet
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useCurrency } from "@/hooks/use-currency"

export default function ClientDebtReportPage() {
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

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
  if (!data) return null

  const totalDebtors = data.clients.length;

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
            <h1 className="text-3xl font-bold tracking-tight">Rapport des Créances Clients</h1>
            <p className="text-muted-foreground">Analyse globale de l'encours client et risques de défaut.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold">
            <Download className="w-4 h-4 mr-2" /> Excel
          </Button>
          <Button className="rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Printer className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden bg-white">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Encours</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-bold font-headline text-destructive">{formatAmount(data.summary.totalClientDebt)}</div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium italic">Somme restant à recouvrer</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden bg-white">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Nombre de Débiteurs</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-bold font-headline text-gray-900">{totalDebtors}</div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Clients ayant un solde négatif</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden bg-white">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Risque Moyen / Client</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-bold font-headline text-gray-900">
              {totalDebtors > 0 ? formatAmount(data.summary.totalClientDebt / totalDebtors) : "0 FCFA"}
            </div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Encours moyen par compte</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden bg-white">
        <CardHeader className="p-8">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Détail des soldes débiteurs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="py-4 pl-8">Nom du Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right pr-8">Dette (FCFA)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-gray-400 italic">
                    Aucune créance en cours dans le réseau.
                  </TableCell>
                </TableRow>
              ) : (
                data.clients.map((c: any) => (
                  <TableRow key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4 pl-8 font-bold text-gray-900">{c.name}</TableCell>
                    <TableCell className="capitalize">
                      <StatusBadge preset="clientType" value={c.type} className="text-[10px]" />
                    </TableCell>
                    <TableCell>
                       <StatusBadge preset="clientStatus" value={c.status} className="text-[10px]" />
                    </TableCell>
                    <TableCell className="text-right pr-8 font-headline font-bold text-destructive">
                      {c.currentDebt.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4 items-start max-w-4xl">
         <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
         <div className="space-y-1">
            <p className="text-sm font-bold text-amber-900">Note de conformité BI</p>
            <p className="text-[13px] text-amber-700 leading-relaxed">
              Ce rapport liste exclusivement les clients ayant une dette active. Pour la gestion des profils (ajout, modification), rendez-vous dans le menu opérationnel <strong>"Clients"</strong>.
            </p>
         </div>
      </div>
    </div>
  )
}
