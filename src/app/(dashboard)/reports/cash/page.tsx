
"use client"

import { useState, useEffect } from "react"
import { CashService } from "@/services/cash.service"
import { StoreService } from "@/services/store.service"
import { CashSession, Store } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Loader2, 
  History,
  CheckCircle2,
  AlertCircle,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useStore } from "@/lib/contexts/StoreContext"

export default function CashReportPage() {
  const { activeStore } = useStore()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<CashSession[]>([])

  useEffect(() => {
    const load = async () => {
      if (!activeStore) return
      setLoading(true)
      try {
        const res = await CashService.listSessions(activeStore.id, 50)
        setSessions(res)
      } catch (error) {
        toast.error("Erreur de chargement")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeStore])

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>

  const totalVariance = sessions.reduce((acc, s) => {
    if (!s.variances) return acc
    return acc + Object.values(s.variances).reduce((sum, v) => sum + v, 0)
  }, 0)

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
            <h1 className="text-3xl font-bold tracking-tight">Rapport d'Audit Caisse</h1>
            <p className="text-muted-foreground">Journal analytique des sessions et rapprochements de <strong>{activeStore?.name}</strong>.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold">
            <Download className="w-4 h-4 mr-2" /> PDF Consolidé
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden bg-white">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Écart Global (50 sessions)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className={`text-3xl font-bold font-headline ${totalVariance === 0 ? 'text-primary' : 'text-destructive'}`}>
              {totalVariance.toLocaleString()} FCFA
            </div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Cumul des variances de comptage</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden bg-white">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Fiabilité Rapprochement</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-bold font-headline text-gray-900">
              {sessions.length > 0 ? Math.round((sessions.filter(s => {
                if (!s.variances) return true
                return Object.values(s.variances).every(v => v === 0)
              }).length / sessions.length) * 100) : 100}%
            </div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Pourcentage de clôtures conformes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden bg-white">
        <CardHeader className="p-8">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            Journal Analytique des Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="py-4 pl-8">Date & Ouverture</TableHead>
                <TableHead>Caissier</TableHead>
                <TableHead className="text-right">Attendu (Total)</TableHead>
                <TableHead className="text-right">Réel (Total)</TableHead>
                <TableHead className="text-center">Statut / Écart</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-gray-400 italic">
                    Aucune session de caisse enregistrée.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((s) => {
                  const totalExpected = Object.values(s.expectedBalances).reduce((a, b) => a + b, 0);
                  const totalActual = s.actualBalances ? Object.values(s.actualBalances).reduce((a, b) => a + b, 0) : totalExpected;
                  const totalVar = s.variances ? Object.values(s.variances).reduce((a, b) => a + b, 0) : 0;

                  return (
                    <TableRow key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="py-4 pl-8">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{format(s.openedAt.toDate(), "dd MMM yyyy", { locale: fr })}</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" /> à {format(s.openedAt.toDate(), "HH:mm")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-600">{s.openedByName}</TableCell>
                      <TableCell className="text-right font-medium">{totalExpected.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-gray-900">{totalActual.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={totalVar === 0 ? "outline" : "destructive"} className="text-[10px] h-5 rounded-md">
                            {totalVar === 0 ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                            {totalVar === 0 ? "CONFORME" : `${totalVar > 0 ? '+' : ''}${totalVar}`}
                          </Badge>
                          {s.status === 'OPEN' && <span className="text-[9px] text-primary font-bold animate-pulse">EN COURS</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
