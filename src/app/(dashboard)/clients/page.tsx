
"use client"

import { useState, useEffect, useMemo } from "react"
import { ClientService } from "@/services/client.service"
import { Client } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  UserPlus,
  Search,
  Loader2,
  Phone,
  MapPin,
  ChevronRight,
  MoreVertical,
  RefreshCw,
  Users,
  Wallet,
  AlertTriangle,
  Eye,
  CreditCard,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCurrency } from "@/hooks/use-currency"
import {
  countClientsWithDebt,
  countOverLimit,
  filterClients,
  getClientInitials,
  isOverCreditLimit,
  sumClientDebt,
  type ClientDebtFilter,
  type ClientStatusFilter,
  type ClientTypeFilter,
} from "@/lib/client-utils"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 50

export default function ClientsPage() {
  const { formatAmount } = useCurrency()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<ClientTypeFilter>("all")
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>("all")
  const [debtFilter, setDebtFilter] = useState<ClientDebtFilter>("all")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const loadClients = async () => {
    setLoading(true)
    try {
      const data = await ClientService.listClients()
      setClients(data)
      setVisibleCount(PAGE_SIZE)
    } catch {
      toast.error("Erreur de chargement des clients")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const fetch = async () => {
      setLoading(true)
      try {
        const data = await ClientService.listClients()
        if (!cancelled) {
          setClients(data)
          setVisibleCount(PAGE_SIZE)
        }
      } catch {
        if (!cancelled) toast.error("Erreur de chargement des clients")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredClients = useMemo(
    () =>
      filterClients(clients, {
        search: searchTerm,
        type: typeFilter,
        status: statusFilter,
        debt: debtFilter,
      }),
    [clients, searchTerm, typeFilter, statusFilter, debtFilter]
  )

  const visibleClients = filteredClients.slice(0, visibleCount)
  const hasMore = visibleCount < filteredClients.length

  const stats = useMemo(
    () => ({
      total: clients.length,
      withDebt: countClientsWithDebt(clients),
      overLimit: countOverLimit(clients),
      totalDebt: sumClientDebt(clients),
    }),
    [clients]
  )

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portefeuille Clients</h1>
            <p className="text-sm text-muted-foreground">
              Base globale partagée - crédit et encours communs à toutes les boutiques.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="rounded-xl font-semibold"
            onClick={loadClients}
            disabled={loading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Actualiser
          </Button>
          <Button asChild className="rounded-xl font-semibold">
            <Link href="/clients/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Nouveau client
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900/50">
              <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Clients
              </p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
              <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Avec dette
              </p>
              <p className="text-2xl font-bold">{stats.withDebt}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Plafond dépassé
              </p>
              <p className="text-2xl font-bold">{stats.overLimit}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 rounded-2xl border bg-card shadow-sm lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Encours total
              </p>
              <p className="text-sm font-bold">{formatAmount(stats.totalDebt, "FCFA")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, téléphone ou adresse…"
              className="h-10 rounded-xl pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setVisibleCount(PAGE_SIZE)
              }}
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as ClientTypeFilter)
              setVisibleCount(PAGE_SIZE)
            }}
          >
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="particulier">Particulier</SelectItem>
              <SelectItem value="grossiste">Grossiste</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as ClientStatusFilter)
              setVisibleCount(PAGE_SIZE)
            }}
          >
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="suspendu">Suspendu</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={debtFilter}
            onValueChange={(v) => {
              setDebtFilter(v as ClientDebtFilter)
              setVisibleCount(PAGE_SIZE)
            }}
          >
            <SelectTrigger className="h-10 rounded-xl md:col-span-1">
              <SelectValue placeholder="Dette" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Toutes les dettes</SelectItem>
              <SelectItem value="with_debt">Avec dette</SelectItem>
              <SelectItem value="over_limit">Plafond dépassé</SelectItem>
              <SelectItem value="clear">Sans dette</SelectItem>
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
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30" />
              <div>
                <p className="font-semibold">Aucun client trouvé</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {clients.length === 0
                    ? "Commencez par enregistrer votre premier client."
                    : "Ajustez les filtres ou la recherche."}
                </p>
              </div>
              {clients.length === 0 && (
                <Button asChild className="rounded-xl font-semibold">
                  <Link href="/clients/new">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Nouveau client
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Dette actuelle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleClients.map((client) => {
                    const overLimit = isOverCreditLimit(client)
                    return (
                      <TableRow key={client.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                              {getClientInitials(client.name)}
                            </div>
                            <div>
                              <div className="font-semibold">{client.name}</div>
                              <div className="flex items-center text-[10px] text-muted-foreground">
                                <MapPin className="mr-1 h-2.5 w-2.5" />
                                {client.address || "Adresse non renseignée"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Phone className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            {client.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            preset="clientType"
                            value={client.type}
                            className="text-[10px]"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span
                              className={cn(
                                "font-headline font-bold",
                                client.currentDebt > 0
                                  ? "text-destructive"
                                  : "text-emerald-600"
                              )}
                            >
                              {formatAmount(client.currentDebt, "FCFA")}
                            </span>
                            {client.creditCeiling > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                Plafond : {formatAmount(client.creditCeiling, "FCFA")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <StatusBadge
                              preset="clientStatus"
                              value={client.status}
                              className="text-[10px]"
                            />
                            {overLimit && (
                              <AlertTriangle
                                className="h-4 w-4 text-destructive"
                                aria-label="Plafond dépassé"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-8 w-8 rounded-lg"
                            >
                              <Link href={`/clients/${client.id}`}>
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                                <DropdownMenuItem asChild className="rounded-lg">
                                  <Link
                                    href={`/clients/${client.id}`}
                                    className="flex items-center gap-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                    Voir le profil
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="rounded-lg">
                                  <Link
                                    href={`/clients/${client.id}?tab=payments`}
                                    className="flex items-center gap-2"
                                  >
                                    <CreditCard className="h-4 w-4" />
                                    Enregistrer un paiement
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
                    Charger plus ({filteredClients.length - visibleCount} restants)
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
