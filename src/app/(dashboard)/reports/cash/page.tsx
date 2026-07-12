
"use client"

import { useState, useEffect, useMemo } from "react"
import { CashService } from "@/services/cash.service"
import { PrintService } from "@/services/print.service"
import { CashSession } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  ArrowLeft,
  Download,
  Loader2,
  History,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Wallet,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useStore } from "@/lib/contexts/StoreContext"
import { getCashAuditSummary, getSessionTotals } from "@/lib/cash-session-utils"
import { useClientPagination } from "@/hooks/use-client-pagination"
import { TablePagination } from "@/components/ui/table-pagination"

const PAGE_SIZE = 25

export default function CashReportPage() {
  const { activeStore } = useStore()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [sessions, setSessions] = useState<CashSession[]>([])

  useEffect(() => {
    const load = async () => {
      if (!activeStore) {
        setSessions([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await CashService.listSessions(activeStore.id, 50)
        setSessions(res)
      } catch {
        toast.error("Erreur de chargement")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeStore])

  const summary = useMemo(() => getCashAuditSummary(sessions), [sessions])

  const {
    paginatedItems: paginatedSessions,
    page,
    setPage,
    totalPages,
    totalItems: sessionsTotal,
    rangeStart,
    rangeEnd,
  } = useClientPagination(sessions, { pageSize: PAGE_SIZE })

  const handleExportPdf = async () => {
    if (!activeStore) return
    if (sessions.length === 0) {
      toast.error("Aucune session à exporter")
      return
    }
    setExporting(true)
    try {
      await PrintService.generateCashAuditReport(sessions, activeStore, {
        totalVariance: summary.totalVariance,
        reliabilityPercent: summary.reliabilityPercent,
      })
      toast.success("PDF consolidé téléchargé")
    } catch {
      toast.error("Erreur lors de l'export PDF")
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!activeStore) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-center text-muted-foreground">
        <Wallet className="h-10 w-10 opacity-30" />
        <p>Sélectionnez une boutique pour consulter l&apos;audit caisse.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl">
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rapport d&apos;Audit Caisse</h1>
            <p className="text-sm text-muted-foreground">
              Journal analytique des sessions et rapprochements de{" "}
              <strong>{activeStore.name}</strong>.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="rounded-xl font-semibold"
          onClick={handleExportPdf}
          disabled={exporting || sessions.length === 0}
        >
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          PDF Consolidé
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Écart global ({summary.sessionCount} sessions)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold font-headline ${
                summary.totalVariance === 0 ? "text-primary" : "text-destructive"
              }`}
            >
              {summary.totalVariance.toLocaleString("fr-FR")} FCFA
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Cumul des variances de comptage
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Fiabilité rapprochement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline text-foreground">
              {summary.reliabilityPercent}%
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {summary.conformCount} clôture{summary.conformCount !== 1 ? "s" : ""} conforme
              {summary.conformCount !== 1 ? "s" : ""} sur {summary.closedCount || summary.sessionCount}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Sessions enregistrées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline text-foreground">
              {summary.sessionCount}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {summary.closedCount} clôturée{summary.closedCount > 1 ? "s" : ""},{" "}
              {summary.sessionCount - summary.closedCount} en cours
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5 text-primary" />
            Journal analytique des sessions
          </CardTitle>
          <CardDescription>
            Détail des ouvertures, clôtures et écarts par session de caisse.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="py-4 pl-6">Date &amp; ouverture</TableHead>
                <TableHead>Caissier</TableHead>
                <TableHead className="text-right">Attendu (total)</TableHead>
                <TableHead className="text-right">Réel (total)</TableHead>
                <TableHead className="text-center pr-6">Statut / écart</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center text-muted-foreground italic">
                    Aucune session de caisse enregistrée pour cette boutique.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSessions.map((s) => {
                  const { totalExpected, totalActual, totalVar } = getSessionTotals(s)
                  const openedAt = s.openedAt?.toDate ? s.openedAt.toDate() : new Date()

                  return (
                    <TableRow key={s.id} className="hover:bg-muted/20">
                      <TableCell className="py-4 pl-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">
                            {format(openedAt, "dd MMM yyyy", { locale: fr })}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="h-2.5 w-2.5" />
                            à {format(openedAt, "HH:mm")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.openedByName}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {totalExpected.toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {totalActual.toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell className="pr-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <StatusBadge
                            preset="cashVariance"
                            value={totalVar === 0 ? "conforme" : "variance"}
                            className="h-5 rounded-md text-[10px] uppercase"
                            icon={
                              totalVar === 0 ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <AlertCircle className="h-3 w-3" />
                              )
                            }
                          >
                            {totalVar === 0
                              ? "Conforme"
                              : `${totalVar > 0 ? "+" : ""}${totalVar.toLocaleString("fr-FR")}`}
                          </StatusBadge>
                          {s.status === "OPEN" && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-primary">
                              <ShieldCheck className="h-3 w-3" />
                              EN COURS
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={sessionsTotal}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
