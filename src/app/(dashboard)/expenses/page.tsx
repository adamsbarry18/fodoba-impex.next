
"use client"

import { useState, useEffect, useMemo } from "react"
import { ExpenseService } from "@/services/expense.service"
import { Expense } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Plus,
  Wallet,
  Loader2,
  User,
  Tag,
  Download,
  Search,
  FileText,
  TrendingDown,
  PieChart,
  RefreshCw,
  Receipt,
} from "lucide-react"
import { useStore } from "@/lib/contexts/StoreContext"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useCurrency } from "@/hooks/use-currency"
import Papa from "papaparse"
import { getPaymentMethodLabel, PAYMENT_METHOD_OPTIONS } from "@/lib/constants/payment-methods"
import {
  EXPENSE_CATEGORIES,
  filterExpenses,
  getExpenseStats,
  toExpenseDate,
  type ExpenseCategoryFilter,
  type ExpenseMethodFilter,
} from "@/lib/expense-utils"
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 50

export default function ExpensesPage() {
  const { activeStore } = useStore()
  const { userProfile } = useAuth()
  const { formatAmount } = useCurrency()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategoryFilter>("all")
  const [methodFilter, setMethodFilter] = useState<ExpenseMethodFilter>("all")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const loadExpenses = async () => {
    if (!activeStore) return
    setLoading(true)
    try {
      const data = await ExpenseService.listExpenses(activeStore.id)
      setExpenses(data)
      setVisibleCount(PAGE_SIZE)
    } catch {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!activeStore) {
      setExpenses([])
      setLoading(false)
      return
    }

    let cancelled = false

    const fetch = async () => {
      setLoading(true)
      try {
        const data = await ExpenseService.listExpenses(activeStore.id)
        if (!cancelled) {
          setExpenses(data)
          setVisibleCount(PAGE_SIZE)
        }
      } catch {
        if (!cancelled) toast.error("Erreur de chargement")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => {
      cancelled = true
    }
  }, [activeStore?.id])

  const filteredExpenses = useMemo(
    () =>
      filterExpenses(expenses, {
        search: searchTerm,
        category: categoryFilter,
        method: methodFilter,
      }),
    [expenses, searchTerm, categoryFilter, methodFilter]
  )

  const visibleExpenses = filteredExpenses.slice(0, visibleCount)
  const hasMore = visibleCount < filteredExpenses.length

  const stats = useMemo(() => getExpenseStats(expenses), [expenses])

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      toast.error("Aucune dépense à exporter")
      return
    }
    const data = filteredExpenses.map((e) => {
      const date = toExpenseDate(e.timestamp)
      return {
        Date: date ? format(date, "dd/MM/yyyy HH:mm") : "-",
        Categorie: e.category,
        Libelle: e.label,
        Montant: e.amount,
        Mode: getPaymentMethodLabel(e.method),
        Auteur: e.performedByName,
        Notes: e.notes || "",
      }
    })
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `depenses_${activeStore?.code}_${format(new Date(), "yyyyMMdd")}.csv`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("Export CSV téléchargé")
  }

  if (!activeStore) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <Wallet className="h-10 w-10 opacity-30" />
        <p>Sélectionnez une boutique pour consulter les dépenses.</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Gestion des dépenses</h1>
            <p className="text-sm text-muted-foreground">
              Charges opérationnelles de{" "}
              <strong className="text-foreground">{activeStore.name}</strong>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="rounded-xl font-semibold"
            onClick={loadExpenses}
            disabled={loading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            className="rounded-xl font-semibold"
            onClick={handleExportCSV}
            disabled={filteredExpenses.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            className="rounded-xl font-semibold"
            onClick={() => setDialogOpen(true)}
            disabled={!userProfile}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle dépense
          </Button>
        </div>
      </div>

      {userProfile && (
        <ExpenseFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          storeId={activeStore.id}
          user={userProfile}
          onSuccess={loadExpenses}
        />
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40">
              <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Dépenses du mois
              </p>
              <p className="text-sm font-bold">
                {formatAmount(stats.totalThisMonth, "FCFA")}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {stats.monthCount} opération{stats.monthCount > 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <PieChart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Poste principal
              </p>
              <p className="text-sm font-bold">{stats.topCategory}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatAmount(stats.topCategoryAmount, "FCFA")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900/50">
              <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Écritures
              </p>
              <p className="text-2xl font-bold">{stats.count}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 rounded-2xl border bg-card shadow-sm lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
              <Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total cumulé
              </p>
              <p className="text-sm font-bold">{formatAmount(stats.totalAll, "FCFA")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par motif, catégorie ou auteur…"
              className="h-10 rounded-xl pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setVisibleCount(PAGE_SIZE)
              }}
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v as ExpenseCategoryFilter)
              setVisibleCount(PAGE_SIZE)
            }}
          >
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={methodFilter}
            onValueChange={(v) => {
              setMethodFilter(v as ExpenseMethodFilter)
              setVisibleCount(PAGE_SIZE)
            }}
          >
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les modes</SelectItem>
              {PAYMENT_METHOD_OPTIONS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/30" />
              <div>
                <p className="font-semibold">Aucune dépense trouvée</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {expenses.length === 0
                    ? "Enregistrez votre première charge opérationnelle."
                    : "Ajustez les filtres ou la recherche."}
                </p>
              </div>
              {expenses.length === 0 && userProfile && (
                <Button
                  className="rounded-xl font-semibold"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle dépense
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date & heure</TableHead>
                    <TableHead>Catégorie / Motif</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Auteur</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleExpenses.map((e) => {
                    const date = toExpenseDate(e.timestamp)
                    return (
                      <TableRow key={e.id} className="group">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {date
                            ? format(date, "dd/MM/yyyy HH:mm", { locale: fr })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5 text-sm font-semibold">
                              <Tag className="h-3.5 w-3.5 text-primary" />
                              {e.category}
                            </span>
                            <span className="text-xs text-muted-foreground">{e.label}</span>
                            {e.notes && (
                              <StatusBadge tone="slate" className="mt-1 w-fit text-[10px]">
                                Réf : {e.notes}
                              </StatusBadge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge preset="paymentMethod" value={e.method} className="text-[10px]">
                            {getPaymentMethodLabel(e.method)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            {e.performedByName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-headline text-base font-bold text-destructive">
                          −{formatAmount(e.amount, "FCFA")}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {hasMore && (
                <div className="flex justify-center border-t p-4">
                  <Button
                    variant="outline"
                    className="rounded-xl font-semibold"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  >
                    Charger plus ({filteredExpenses.length - visibleCount} restantes)
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
