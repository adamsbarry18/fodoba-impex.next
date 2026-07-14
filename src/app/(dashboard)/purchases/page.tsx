
"use client"

import { useState, useEffect, useMemo } from "react"
import { DocumentSnapshot } from "firebase/firestore"
import { PurchaseService } from "@/services/purchase.service"
import { Purchase } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Loader2,
  Truck,
  Eye,
  Calendar,
  User,
  Search,
  RefreshCw,
  Package,
  ClipboardList,
  CheckCircle2,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { StatusBadge } from "@/components/ui/status-badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useStore } from "@/lib/contexts/StoreContext"
import {
  formatPurchaseRef,
  PURCHASE_STATUS_ICONS,
  toPurchaseDate,
} from "@/lib/purchase-utils"
import { cn } from "@/lib/utils"
import { useTableColumns } from "@/hooks/use-table-columns"
import { TableColumnToggle } from "@/components/ui/table-column-toggle"
import { VisibleTableColumn } from "@/components/ui/visible-table-column"
import { PURCHASE_TABLE_COLUMNS } from "@/lib/table-column-presets"

const PAGE_SIZE = 50

export default function PurchasesPage() {
  const { activeStore } = useStore()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<Purchase["status"] | "all">("all")

  const loadPurchases = async (options?: { loadMore?: boolean; reset?: boolean }) => {
    if (!activeStore) return
    const loadMore = options?.loadMore ?? false
    if (loadMore) setLoadingMore(true)
    else setLoading(true)

    try {
      const result = await PurchaseService.listPurchases(
        { storeId: activeStore.id },
        PAGE_SIZE,
        loadMore && !options?.reset ? lastDoc : undefined
      )

      if (loadMore) {
        setPurchases((prev) => [...prev, ...result.purchases])
      } else {
        setPurchases(result.purchases)
      }

      setLastDoc(result.lastVisible)
      setHasMore(result.purchases.length === PAGE_SIZE)
    } catch {
      toast.error("Erreur lors du chargement des achats")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    if (!activeStore) {
      setPurchases([])
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchInitial = async () => {
      setLoading(true)
      try {
        const result = await PurchaseService.listPurchases(
          { storeId: activeStore.id },
          PAGE_SIZE
        )
        if (cancelled) return
        setPurchases(result.purchases)
        setLastDoc(result.lastVisible)
        setHasMore(result.purchases.length === PAGE_SIZE)
      } catch {
        if (!cancelled) toast.error("Erreur lors du chargement des achats")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchInitial()
    return () => {
      cancelled = true
    }
  }, [activeStore])

  const filteredPurchases = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return purchases.filter((p) => {
      const matchesSearch =
        !term ||
        p.supplierName.toLowerCase().includes(term) ||
        p.performedByName.toLowerCase().includes(term) ||
        formatPurchaseRef(p.id).toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term)
      const matchesStatus = statusFilter === "all" || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [purchases, searchTerm, statusFilter])

  const { isVisible, toggleColumn, resetColumns, columns: tableColumns } =
    useTableColumns("purchases", PURCHASE_TABLE_COLUMNS)

  const stats = useMemo(
    () => ({
      total: purchases.length,
      draft: purchases.filter((p) => p.status === "DRAFT").length,
      ordered: purchases.filter((p) => p.status === "ORDERED").length,
      received: purchases.filter((p) => p.status === "RECEIVED").length,
      totalAmount: purchases.reduce((acc, p) => acc + p.totalFCFA, 0),
    }),
    [purchases]
  )

  const handleRefresh = async () => {
    setLastDoc(undefined)
    setHasMore(true)
    await loadPurchases({ reset: true })
  }

  if (!activeStore) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <Truck className="h-10 w-10 opacity-30" />
        <p>Sélectionnez une boutique pour gérer les achats.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Gestion des achats
            </h1>
            <p className="text-sm text-muted-foreground">
              Commandes fournisseurs pour{" "}
              <strong className="text-foreground">{activeStore.name}</strong>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="rounded-xl font-semibold"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Actualiser
          </Button>
          <Button asChild className="rounded-xl font-semibold">
            <Link href="/purchases/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvel approvisionnement
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <ClipboardList className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Commandes
              </p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Brouillons
              </p>
              <p className="text-xl font-bold">{stats.draft}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Truck className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Commandées
              </p>
              <p className="text-xl font-bold">{stats.ordered}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Reçues
              </p>
              <p className="text-xl font-bold">{stats.received}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 rounded-2xl border bg-card shadow-sm lg:col-span-1">
          <CardContent className="flex items-center gap-3 p-4">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Volume FCFA
              </p>
              <p className="text-sm font-bold">{stats.totalAmount.toLocaleString("fr-FR")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence, fournisseur, auteur…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as Purchase["status"] | "all")}
          >
            <SelectTrigger className="h-10 w-full rounded-xl sm:w-[200px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="DRAFT">Brouillon</SelectItem>
              <SelectItem value="ORDERED">Commandé</SelectItem>
              <SelectItem value="RECEIVED">Reçu</SelectItem>
              <SelectItem value="CANCELLED">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 p-4 sm:p-6">
          <div>
            <CardTitle className="text-base">Historique des commandes</CardTitle>
            <CardDescription className="text-xs">
              {filteredPurchases.length} commande{filteredPurchases.length !== 1 ? "s" : ""}
              {searchTerm || statusFilter !== "all" ? " (filtrées)" : ""}
            </CardDescription>
          </div>
          <TableColumnToggle
            columns={tableColumns}
            isVisible={isVisible}
            onToggle={toggleColumn}
            onReset={resetColumns}
          />
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-16 text-center text-muted-foreground">
              <Truck className="h-10 w-10 opacity-30" />
              <p className="font-medium">Aucune commande trouvée</p>
              <p className="text-xs">
                {purchases.length === 0
                  ? "Créez votre premier approvisionnement fournisseur."
                  : "Modifiez vos filtres de recherche."}
              </p>
              {purchases.length === 0 && (
                <Button asChild className="mt-2 rounded-xl">
                  <Link href="/purchases/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvel approvisionnement
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <VisibleTableColumn id="ref" isVisible={isVisible}>
                      <TableHead className="pl-4 sm:pl-6">Référence / Date</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="supplier" isVisible={isVisible}>
                      <TableHead>Fournisseur</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="items" isVisible={isVisible}>
                      <TableHead>Articles</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="total" isVisible={isVisible}>
                      <TableHead className="text-right">Total (FCFA)</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="status" isVisible={isVisible}>
                      <TableHead>Statut</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="actions" isVisible={isVisible}>
                      <TableHead className="pr-4 text-right sm:pr-6">Actions</TableHead>
                    </VisibleTableColumn>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((p) => {
                    const date = toPurchaseDate(p.timestamp)
                    const StatusIcon = PURCHASE_STATUS_ICONS[p.status]

                    return (
                      <TableRow key={p.id} className="group transition-colors hover:bg-muted/20">
                        <VisibleTableColumn id="ref" isVisible={isVisible}>
                          <TableCell className="pl-4 sm:pl-6">
                            <Link
                              href={`/purchases/${p.id}`}
                              className="inline-block rounded-lg transition-colors hover:text-primary"
                            >
                              <p className="font-mono text-sm font-bold group-hover:text-primary">
                                {formatPurchaseRef(p.id)}
                              </p>
                              {date && (
                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {format(date, "dd MMM yyyy", { locale: fr })}
                                </p>
                              )}
                            </Link>
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="supplier" isVisible={isVisible}>
                          <TableCell>
                            <Link
                              href={`/purchases/${p.id}`}
                              className="block rounded-lg transition-colors hover:text-primary"
                            >
                              <p className="text-sm font-semibold group-hover:text-primary">
                                {p.supplierName}
                              </p>
                              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <User className="h-3 w-3" />
                                {p.performedByName}
                              </p>
                            </Link>
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="items" isVisible={isVisible}>
                          <TableCell>
                            <StatusBadge tone="slate" className="text-[10px]">
                              {p.items.length} produit{p.items.length !== 1 ? "s" : ""}
                            </StatusBadge>
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="total" isVisible={isVisible}>
                          <TableCell className="text-right font-headline font-bold">
                            {p.totalFCFA.toLocaleString("fr-FR")}
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="status" isVisible={isVisible}>
                          <TableCell>
                            <StatusBadge
                              preset="purchaseStatus"
                              value={p.status}
                              icon={<StatusIcon className="h-3 w-3" />}
                              className="text-[10px]"
                            />
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="actions" isVisible={isVisible}>
                          <TableCell className="pr-4 text-right sm:pr-6">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="h-8 rounded-lg text-xs font-semibold"
                            >
                              <Link href={`/purchases/${p.id}`}>
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                Voir le détail
                              </Link>
                            </Button>
                          </TableCell>
                        </VisibleTableColumn>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {hasMore && !loading && filteredPurchases.length > 0 && (
            <div className="flex justify-center border-t p-4">
              <Button
                variant="ghost"
                onClick={() => loadPurchases({ loadMore: true })}
                disabled={loadingMore}
                className="rounded-xl font-semibold"
              >
                {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Charger plus de commandes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
