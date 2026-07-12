
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { CashService } from "@/services/cash.service"
import { PrintService } from "@/services/print.service"
import { CashSession, CashMovement } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Wallet,
  CheckCircle2,
  History,
  ArrowDownToLine,
  Loader2,
  Lock,
  Unlock,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { useStore } from "@/lib/contexts/StoreContext"
import { useAuth } from "@/lib/contexts/AuthContext"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { runTransaction } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import {
  PAYMENT_METHOD_IDS,
  getPaymentMethodLabel,
} from "@/lib/constants/payment-methods"
import {
  getSessionTotals,
  getMovementStats,
  getCashAuditSummary,
  MOVEMENT_SOURCE_LABELS,
} from "@/lib/cash-session-utils"
import {
  CashFundDialog,
  type CashFundFormValues,
} from "@/components/cash/cash-fund-dialog"
import { useCurrency } from "@/hooks/use-currency"
import { useClientPagination } from "@/hooks/use-client-pagination"
import { TablePagination } from "@/components/ui/table-pagination"

const MOVEMENTS_PAGE_SIZE = 25
const HISTORY_PAGE_SIZE = 25

function formatTimestamp(ts: { toDate?: () => Date } | undefined) {
  if (!ts?.toDate) return "-"
  return format(ts.toDate(), "dd MMM yyyy HH:mm", { locale: fr })
}

export default function ReconciliationPage() {
  const { activeStore } = useStore()
  const { userProfile } = useAuth()
  const { formatAmount } = useCurrency()

  const [activeSession, setActiveSession] = useState<CashSession | null>(null)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [history, setHistory] = useState<CashSession[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  const [actualBalances, setActualBalances] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState("")

  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false)

  const loadData = useCallback(async () => {
    if (!activeStore) {
      setActiveSession(null)
      setMovements([])
      setHistory([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [session, pastSessions] = await Promise.all([
        CashService.getActiveSession(activeStore.id),
        CashService.listSessions(activeStore.id, 10),
      ])
      setActiveSession(session)
      setHistory(pastSessions)

      if (session) {
        const moves = await CashService.getMovements(session.id, activeStore.id)
        setMovements(moves)
        const initialActual: Record<string, string> = {}
        PAYMENT_METHOD_IDS.forEach((m) => {
          initialActual[m] = ""
        })
        setActualBalances(initialActual)
      } else {
        setMovements([])
      }
    } catch (error: unknown) {
      console.error("Reconciliation load error:", error)
      const message =
        error instanceof Error ? error.message : "Erreur de chargement"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [activeStore])

  useEffect(() => {
    loadData()
  }, [loadData])

  const movementStats = useMemo(() => getMovementStats(movements), [movements])

  const {
    paginatedItems: paginatedMovements,
    page: movementsPage,
    setPage: setMovementsPage,
    totalPages: movementsTotalPages,
    totalItems: movementsTotal,
    rangeStart: movementsRangeStart,
    rangeEnd: movementsRangeEnd,
  } = useClientPagination(movements, {
    pageSize: MOVEMENTS_PAGE_SIZE,
    resetKey: movements.length,
  })

  const {
    paginatedItems: paginatedHistory,
    page: historyPage,
    setPage: setHistoryPage,
    totalPages: historyTotalPages,
    totalItems: historyTotal,
    rangeStart: historyRangeStart,
    rangeEnd: historyRangeEnd,
  } = useClientPagination(history, {
    pageSize: HISTORY_PAGE_SIZE,
    resetKey: history.length,
  })

  const sessionTotalExpected = useMemo(() => {
    if (!activeSession) return 0
    return Object.values(activeSession.expectedBalances).reduce((a, b) => a + b, 0)
  }, [activeSession])

  const closureVariance = useMemo(() => {
    if (!activeSession) return 0
    return PAYMENT_METHOD_IDS.reduce((sum, method) => {
      const expected = activeSession.expectedBalances[method] || 0
      const actual = Number(actualBalances[method]) || 0
      if (actualBalances[method] === "") return sum
      return sum + (actual - expected)
    }, 0)
  }, [activeSession, actualBalances])

  const allBalancesFilled = useMemo(
    () => PAYMENT_METHOD_IDS.every((m) => actualBalances[m] !== ""),
    [actualBalances]
  )

  const handleOpenCash = async () => {
    if (!activeStore || !userProfile) return
    const initialBalances: Record<string, number> = {}
    PAYMENT_METHOD_IDS.forEach((m) => {
      initialBalances[m] = 0
    })

    setProcessing(true)
    try {
      await CashService.openSession(activeStore.id, userProfile, initialBalances)
      toast.success("Caisse ouverte avec succès")
      setNotes("")
      await loadData()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur à l'ouverture")
    } finally {
      setProcessing(false)
    }
  }

  const handleCloseCash = async () => {
    if (!activeSession || !userProfile) return
    if (!allBalancesFilled) {
      toast.error("Comptez toutes les lignes de caisse avant la clôture.")
      return
    }

    const formattedActual: Record<string, number> = {}
    PAYMENT_METHOD_IDS.forEach((m) => {
      formattedActual[m] = Number(actualBalances[m]) || 0
    })

    setProcessing(true)
    try {
      await CashService.closeSession(activeSession.id, userProfile, formattedActual, notes)
      toast.success("Caisse clôturée. Rapport de session enregistré.")
      setNotes("")
      await loadData()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur à la clôture")
    } finally {
      setProcessing(false)
    }
  }

  const handleFundMovement = async (values: CashFundFormValues) => {
    if (!activeStore || !userProfile || !activeSession) return

    setProcessing(true)
    try {
      await runTransaction(db, async (transaction) => {
        await CashService.recordMovement(transaction, {
          sessionId: activeSession.id,
          storeId: activeStore.id,
          type: values.type,
          source: values.type === "IN" ? "FUND_ENTRY" : "FUND_WITHDRAWAL",
          amount: values.amount,
          method: values.method,
          user: userProfile,
          description: values.reason,
        })
      })
      toast.success("Mouvement de fonds enregistré")
      await loadData()
    } finally {
      setProcessing(false)
    }
  }

  const fillWithExpected = () => {
    if (!activeSession) return
    const next: Record<string, string> = {}
    PAYMENT_METHOD_IDS.forEach((m) => {
      next[m] = String(activeSession.expectedBalances[m] ?? 0)
    })
    setActualBalances(next)
    toast.info("Montants théoriques appliqués")
  }

  const handleExportPdf = async () => {
    if (!activeStore) return
    setExportingPdf(true)
    try {
      const sessions = await CashService.listSessions(activeStore.id, 50)
      if (sessions.length === 0) {
        toast.error("Aucune session à exporter")
        return
      }
      const summary = getCashAuditSummary(sessions)
      await PrintService.generateCashAuditReport(sessions, activeStore, {
        totalVariance: summary.totalVariance,
        reliabilityPercent: summary.reliabilityPercent,
      })
      toast.success("PDF consolidé téléchargé")
    } catch {
      toast.error("Erreur lors de l'export PDF")
    } finally {
      setExportingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Synchronisation des flux financiers…</p>
      </div>
    )
  }

  if (!activeStore) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <Wallet className="h-10 w-10 opacity-30" />
        <p>Sélectionnez une boutique pour gérer la trésorerie.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Trésorerie & caisse</h1>
              <StatusBadge
                preset="cashSessionStatus"
                value={activeSession ? "OPEN" : "CLOSED"}
                className="text-[10px] font-bold uppercase"
              >
                {activeSession ? "Session ouverte" : "Caisse fermée"}
              </StatusBadge>
            </div>
            <p className="text-sm text-muted-foreground">
              Cycle quotidien et rapprochement pour{" "}
              <strong className="text-foreground">{activeStore.name}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="rounded-xl font-semibold"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Actualiser
          </Button>
          <Button variant="outline" className="rounded-xl font-semibold" asChild>
            <Link href="/reports/cash">
              <FileText className="mr-2 h-4 w-4" />
              Rapport d&apos;audit
            </Link>
          </Button>

          {activeSession ? (
            <>
              <Button
                variant="outline"
                className="rounded-xl font-semibold"
                onClick={() => setIsFundDialogOpen(true)}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Alimentation / Retrait
              </Button>
              <CashFundDialog
                open={isFundDialogOpen}
                onOpenChange={setIsFundDialogOpen}
                onSubmit={handleFundMovement}
              />
            </>
          ) : (
            <Button
              onClick={handleOpenCash}
              disabled={processing}
              className="rounded-xl font-semibold"
            >
              {processing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="mr-2 h-4 w-4" />
              )}
              Ouvrir la caisse
            </Button>
          )}
        </div>
      </div>

      {!activeSession ? (
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-2xl border bg-muted/30 p-5">
              <Lock className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold">Caisse fermée</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Ouvrez une session pour enregistrer des ventes, dépenses et mouvements de fonds.
            </p>
            <Button
              onClick={handleOpenCash}
              disabled={processing}
              className="mt-6 rounded-xl font-semibold"
            >
              <Unlock className="mr-2 h-4 w-4" />
              Ouvrir la caisse
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-2xl border border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Session en cours
                </p>
                <p className="text-sm text-foreground">
                  Ouverte par <strong>{activeSession.openedByName}</strong> le{" "}
                  {formatTimestamp(activeSession.openedAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total théorique
                </p>
                <p className="text-2xl font-bold font-headline text-foreground">
                  {formatAmount(sessionTotalExpected, "FCFA")}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="rounded-2xl border bg-card shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Entrées
                  </p>
                  <p className="text-sm font-bold text-emerald-600">
                    +{formatAmount(movementStats.totalIn, "FCFA")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-card shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40">
                  <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Sorties
                  </p>
                  <p className="text-sm font-bold text-destructive">
                    −{formatAmount(movementStats.totalOut, "FCFA")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-card shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900/50">
                  <History className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Mouvements
                  </p>
                  <p className="text-2xl font-bold">{movementStats.count}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2 rounded-2xl border bg-card shadow-sm lg:col-span-1">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Lignes actives
                  </p>
                  <p className="text-2xl font-bold">{PAYMENT_METHOD_IDS.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-8">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {PAYMENT_METHOD_IDS.map((method) => (
                  <Card key={method} className="rounded-2xl border bg-card shadow-sm">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {getPaymentMethodLabel(method)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-lg font-bold font-headline sm:text-xl">
                        {formatAmount(activeSession.expectedBalances[method] || 0, "FCFA")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">théorique</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-5 w-5 text-primary" />
                    Journal de session
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Flux enregistrés depuis l&apos;ouverture.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[min(420px,50vh)]">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="pl-4 text-xs uppercase sm:pl-6">Heure</TableHead>
                          <TableHead className="text-xs uppercase">Source</TableHead>
                          <TableHead className="hidden text-xs uppercase sm:table-cell">Mode</TableHead>
                          <TableHead className="pr-4 text-right text-xs uppercase sm:pr-6">
                            Montant
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movements.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="py-16 text-center text-muted-foreground"
                            >
                              Aucun mouvement enregistré pour cette session.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedMovements.map((m) => (
                            <TableRow key={m.id} className="group">
                              <TableCell className="pl-4 font-mono text-xs text-muted-foreground sm:pl-6">
                                {m.timestamp?.toDate
                                  ? format(m.timestamp.toDate(), "HH:mm:ss")
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                <div className="min-w-[120px]">
                                  <p className="text-xs font-semibold">
                                    {MOVEMENT_SOURCE_LABELS[m.source] ?? m.source}
                                  </p>
                                  {m.description && (
                                    <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                      {m.description}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-muted-foreground sm:hidden">
                                    {getPaymentMethodLabel(m.method)}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <StatusBadge preset="paymentMethod" value={m.method} className="text-[9px]">
                                  {getPaymentMethodLabel(m.method)}
                                </StatusBadge>
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "pr-4 text-right font-bold sm:pr-6",
                                  m.type === "IN" ? "text-emerald-600" : "text-destructive"
                                )}
                              >
                                {m.type === "IN" ? "+" : "−"}
                                {formatAmount(m.amount, "FCFA")}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  <TablePagination
                    page={movementsPage}
                    totalPages={movementsTotalPages}
                    totalItems={movementsTotal}
                    rangeStart={movementsRangeStart}
                    rangeEnd={movementsRangeEnd}
                    onPageChange={setMovementsPage}
                  />
                </CardContent>
              </Card>
            </div>

            <Card className="h-fit rounded-2xl border border-primary/20 bg-primary/5 shadow-sm xl:col-span-4 xl:sticky xl:top-6">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lock className="h-5 w-5 text-primary" />
                  Clôture de session
                </CardTitle>
                <CardDescription className="text-xs">
                  Saisissez les montants réellement comptés par ligne.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0 sm:p-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl text-xs font-semibold"
                  onClick={fillWithExpected}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Remplir = théorique
                </Button>

                {PAYMENT_METHOD_IDS.map((method) => {
                  const expected = activeSession.expectedBalances[method] || 0
                  const actual = Number(actualBalances[method]) || 0
                  const variance =
                    actualBalances[method] === "" ? null : actual - expected

                  return (
                    <div
                      key={method}
                      className="space-y-1.5 rounded-xl border bg-background p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Label
                          required
                          className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                        >
                          {getPaymentMethodLabel(method)}
                        </Label>
                        <span className="shrink-0 text-[9px] font-semibold text-primary/80">
                          Théor. {formatAmount(expected, "FCFA")}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Compter…"
                          className="h-10 rounded-xl pr-16 font-bold"
                          value={actualBalances[method]}
                          onChange={(e) =>
                            setActualBalances((prev) => ({
                              ...prev,
                              [method]: e.target.value,
                            }))
                          }
                        />
                        {variance !== null && (
                          <div
                            className={cn(
                              "absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-[9px] font-bold",
                              variance === 0
                                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                                : "border border-destructive/20 bg-destructive/10 text-destructive"
                            )}
                          >
                            {variance === 0
                              ? "OK"
                              : `${variance > 0 ? "+" : ""}${variance.toLocaleString("fr-FR")}`}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Notes de clôture
                  </Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observations, écarts…"
                    className="h-10 rounded-xl"
                  />
                </div>

                {allBalancesFilled && (
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-xl border p-3 text-xs",
                      closureVariance === 0
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700"
                        : "border-amber-500/20 bg-amber-500/5 text-amber-800"
                    )}
                  >
                    {closureVariance === 0 ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>
                      Écart total :{" "}
                      <strong>
                        {closureVariance > 0 ? "+" : ""}
                        {formatAmount(Math.abs(closureVariance), "FCFA")}
                        {closureVariance < 0 ? " (manquant)" : closureVariance > 0 ? " (excédent)" : ""}
                      </strong>
                    </span>
                  </div>
                )}

                <Button
                  className="h-11 w-full rounded-xl font-bold"
                  onClick={handleCloseCash}
                  disabled={processing || !allBalancesFilled}
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4" />
                  )}
                  Clôturer la journée
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <CardTitle className="text-base">Historique des sessions</CardTitle>
            <CardDescription className="text-xs">
              Dernières ouvertures et clôtures de caisse.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-semibold"
            onClick={handleExportPdf}
            disabled={exportingPdf || history.length === 0}
          >
            {exportingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowDownToLine className="mr-2 h-4 w-4" />
            )}
            PDF consolidé
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 text-xs uppercase sm:pl-6">Période</TableHead>
                <TableHead className="text-xs uppercase">Caissier</TableHead>
                <TableHead className="text-right text-xs uppercase">Attendu</TableHead>
                <TableHead className="hidden text-right text-xs uppercase md:table-cell">
                  Réel
                </TableHead>
                <TableHead className="text-center text-xs uppercase">Écart</TableHead>
                <TableHead className="pr-4 text-xs uppercase sm:pr-6">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Aucune session enregistrée.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedHistory.map((session) => {
                  const { totalExpected, totalActual, totalVar } = getSessionTotals(session)
                  const openedAt = session.openedAt?.toDate?.() ?? new Date()

                  return (
                    <TableRow key={session.id} className="group">
                      <TableCell className="pl-4 sm:pl-6">
                        <div>
                          <p className="text-xs font-semibold">
                            {format(openedAt, "dd MMM yyyy", { locale: fr })}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(openedAt, "HH:mm")}
                            {session.closedAt
                              ? ` → ${format(session.closedAt.toDate(), "HH:mm")}`
                              : " → en cours"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {session.openedByName}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatAmount(totalExpected, "FCFA")}
                      </TableCell>
                      <TableCell className="hidden text-right font-bold md:table-cell">
                        {formatAmount(totalActual, "FCFA")}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge
                          preset="cashVariance"
                          value={totalVar === 0 ? "conforme" : "variance"}
                          className="text-[9px] uppercase"
                        >
                          {totalVar === 0
                            ? "Conforme"
                            : `${totalVar > 0 ? "+" : ""}${totalVar.toLocaleString("fr-FR")}`}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="pr-4 sm:pr-6">
                        <StatusBadge
                          preset="cashSessionStatus"
                          value={session.status}
                          className="text-[9px] uppercase"
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            page={historyPage}
            totalPages={historyTotalPages}
            totalItems={historyTotal}
            rangeStart={historyRangeStart}
            rangeEnd={historyRangeEnd}
            onPageChange={setHistoryPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
