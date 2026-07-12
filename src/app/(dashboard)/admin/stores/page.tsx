
"use client"

import { useState, useEffect, useMemo } from "react"
import { DocumentSnapshot } from "firebase/firestore"
import { StoreService } from "@/services/store.service"
import { Store } from "@/lib/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Plus,
  Edit,
  Power,
  PowerOff,
  Loader2,
  MapPin,
  Phone,
  Search,
  RefreshCw,
  Store as StoreIcon,
  Building2,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useStore } from "@/lib/contexts/StoreContext"
import { formatStoreCreatedAt, getStoreInitials } from "@/lib/store-utils"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const PAGE_SIZE = 50

type ToggleTarget = {
  id: string
  name: string
  code: string
  active: boolean
}

export default function StoresAdminPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [toggleTarget, setToggleTarget] = useState<ToggleTarget | null>(null)
  const { refreshStores } = useStore()

  const loadStores = async (options?: { loadMore?: boolean; reset?: boolean }) => {
    const loadMore = options?.loadMore ?? false
    if (loadMore) setLoadingMore(true)
    else setLoading(true)

    try {
      const result = await StoreService.listStores(
        PAGE_SIZE,
        loadMore && !options?.reset ? lastDoc : undefined
      )

      if (loadMore) {
        setStores((prev) => [...prev, ...result.stores])
      } else {
        setStores(result.stores)
      }

      setLastDoc(result.lastVisible)
      setHasMore(result.stores.length === PAGE_SIZE)
    } catch {
      toast.error("Erreur lors du chargement des boutiques")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const fetchInitial = async () => {
      setLoading(true)
      try {
        const result = await StoreService.listStores(PAGE_SIZE)
        if (cancelled) return
        setStores(result.stores)
        setLastDoc(result.lastVisible)
        setHasMore(result.stores.length === PAGE_SIZE)
      } catch {
        if (!cancelled) toast.error("Erreur lors du chargement des boutiques")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchInitial()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredStores = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return stores.filter((store) => {
      const matchesSearch =
        !term ||
        store.name.toLowerCase().includes(term) ||
        store.code.toLowerCase().includes(term) ||
        store.address.toLowerCase().includes(term) ||
        store.phone.toLowerCase().includes(term)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? store.active : !store.active)
      return matchesSearch && matchesStatus
    })
  }, [stores, searchTerm, statusFilter])

  const stats = useMemo(
    () => ({
      total: stores.length,
      active: stores.filter((s) => s.active).length,
      inactive: stores.filter((s) => !s.active).length,
    }),
    [stores]
  )

  const handleRefresh = async () => {
    setLastDoc(undefined)
    setHasMore(true)
    await loadStores({ reset: true })
    await refreshStores()
  }

  const confirmToggleStatus = async () => {
    if (!toggleTarget) return

    setToggling(true)
    try {
      await StoreService.toggleStoreStatus(toggleTarget.id, !toggleTarget.active)
      toast.success(
        toggleTarget.active
          ? `${toggleTarget.name} a été suspendue`
          : `${toggleTarget.name} a été réactivée`
      )
      setToggleTarget(null)
      await loadStores({ reset: true })
      await refreshStores()
    } catch {
      toast.error("Erreur lors du changement de statut")
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* En-tête */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <StoreIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des boutiques</h1>
            <p className="text-sm text-muted-foreground">
              Points de vente du réseau FODOBA IMPEX - codes, coordonnées et statuts.
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
            <Link href="/admin/stores/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle boutique
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900/50">
              <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Boutiques
              </p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Actives
              </p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 rounded-2xl border bg-card shadow-sm lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40">
              <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Suspendues
              </p>
              <p className="text-2xl font-bold">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par code, nom, adresse ou téléphone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 rounded-xl border-border pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as "all" | "active" | "inactive")
            }
          >
            <SelectTrigger className="h-10 w-full rounded-xl sm:w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="inactive">Suspendues</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Liste */}
      <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
          <CardTitle className="text-base">Liste des points de vente</CardTitle>
          <CardDescription className="text-xs">
            {filteredStores.length} boutique{filteredStores.length !== 1 ? "s" : ""}
            {searchTerm || statusFilter !== "all" ? " (filtrées)" : ""} sur{" "}
            {stores.length} chargée{stores.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-16 text-center text-muted-foreground">
              <StoreIcon className="h-10 w-10 opacity-30" />
              <p className="font-medium">Aucune boutique trouvée</p>
              <p className="text-xs">
                {stores.length === 0
                  ? "Créez votre premier point de vente pour démarrer."
                  : "Modifiez vos filtres de recherche."}
              </p>
              {stores.length === 0 && (
                <Button asChild className="mt-2 rounded-xl">
                  <Link href="/admin/stores/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle boutique
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 sm:pl-6">Boutique</TableHead>
                    <TableHead className="hidden sm:table-cell">Contact</TableHead>
                    <TableHead className="hidden md:table-cell">Création</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="pr-4 text-right sm:pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.map((store) => {
                    const createdAt = formatStoreCreatedAt(store.createdAt)

                    return (
                      <TableRow
                        key={store.id}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <TableCell className="pl-4 sm:pl-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[10px] font-bold text-primary">
                              {getStoreInitials(store)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{store.name}</p>
                              <StatusBadge hashFromLabel className="mt-1 font-mono text-[10px]">
                                {store.code}
                              </StatusBadge>
                              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground sm:hidden">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{store.address}</span>
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="space-y-1">
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="line-clamp-1">{store.address}</span>
                            </p>
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3 shrink-0" />
                              {store.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                          {createdAt
                            ? format(createdAt, "dd MMM yyyy", { locale: fr })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            preset="activeState"
                            value={store.active ? "active" : "inactive"}
                            className="text-[10px]"
                          >
                            {store.active ? "Active" : "Suspendue"}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="pr-4 text-right sm:pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-8 w-8 rounded-lg"
                              title="Modifier"
                            >
                              <Link href={`/admin/stores/${store.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-8 w-8 rounded-lg",
                                store.active
                                  ? "text-destructive hover:text-destructive"
                                  : "text-primary hover:text-primary"
                              )}
                              onClick={() =>
                                setToggleTarget({
                                  id: store.id,
                                  name: store.name,
                                  code: store.code,
                                  active: store.active,
                                })
                              }
                              title={store.active ? "Suspendre" : "Réactiver"}
                            >
                              {store.active ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {hasMore && !loading && filteredStores.length > 0 && (
            <div className="flex justify-center border-t p-4">
              <Button
                variant="ghost"
                onClick={() => loadStores({ loadMore: true })}
                disabled={loadingMore}
                className="rounded-xl font-semibold"
              >
                {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Charger plus de boutiques
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={toggleTarget !== null}
        onOpenChange={(open) => !open && setToggleTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.active ? "Suspendre la boutique" : "Réactiver la boutique"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.active
                ? `La boutique ${toggleTarget?.name} (${toggleTarget?.code}) ne sera plus sélectionnable pour les opérations. Les données historiques sont conservées.`
                : `La boutique ${toggleTarget?.name} (${toggleTarget?.code}) redeviendra disponible dans le réseau.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={toggling}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                "rounded-xl",
                toggleTarget?.active && "bg-destructive hover:bg-destructive/90"
              )}
              onClick={(e) => {
                e.preventDefault()
                confirmToggleStatus()
              }}
              disabled={toggling}
            >
              {toggling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
