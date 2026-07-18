
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
  RefreshCw,
  Users,
  Wallet,
  AlertTriangle,
  CreditCard,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { StatusBadge } from "@/components/ui/status-badge"
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
import { useClientPagination } from "@/hooks/use-client-pagination"
import { TablePagination } from "@/components/ui/table-pagination"
import { useTableColumns } from "@/hooks/use-table-columns"
import { TableColumnToggle } from "@/components/ui/table-column-toggle"
import { VisibleTableColumn } from "@/components/ui/visible-table-column"
import { TableListToolbar } from "@/components/ui/table-list-toolbar"
import { CLIENT_TABLE_COLUMNS } from "@/lib/table-column-presets"

import { useT } from "@/i18n/context"

const PAGE_SIZE = 50

export default function ClientsPage() {
  const { formatAmount } = useCurrency()
  const t = useT()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<ClientTypeFilter>("all")
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>("all")
  const [debtFilter, setDebtFilter] = useState<ClientDebtFilter>("all")

  const loadClients = async () => {
    setLoading(true)
    try {
      const data = await ClientService.listClients()
      setClients(data)
    } catch {
      toast.error(t("clients.errorLoading"))
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
        }
      } catch {
        if (!cancelled) toast.error(t("clients.errorLoading"))
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

  const filterKey = `${searchTerm}|${typeFilter}|${statusFilter}|${debtFilter}`
  const {
    paginatedItems: visibleClients,
    page,
    setPage,
    totalPages,
    totalItems: filteredTotal,
    rangeStart,
    rangeEnd,
  } = useClientPagination(filteredClients, { pageSize: PAGE_SIZE, resetKey: filterKey })

  const { isVisible, toggleColumn, resetColumns, columns: tableColumns } =
    useTableColumns("clients", CLIENT_TABLE_COLUMNS)

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
            <h1 className="text-3xl font-bold tracking-tight">{t("clients.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("clients.subtitle")}
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
            {t("common.refresh")}
          </Button>
          <Button asChild className="rounded-xl font-semibold">
            <Link href="/clients/new">
              <UserPlus className="mr-2 h-4 w-4" />
              {t("entity.client.new")}
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
                {t("nav.clients")}
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
                {t("clients.statWithDebt")}
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
                {t("clients.statOverLimit")}
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
                {t("clients.statTotalDebt")}
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
              placeholder={t("clients.searchPlaceholder")}
              className="h-10 rounded-xl pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as ClientTypeFilter)}
          >
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder={t("clients.filterType")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{t("clients.filterTypeAll")}</SelectItem>
              <SelectItem value="particulier">{t("badges.clientType.particulier")}</SelectItem>
              <SelectItem value="grossiste">{t("badges.clientType.grossiste")}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ClientStatusFilter)}
          >
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder={t("clients.filterStatus")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{t("clients.filterStatusAll")}</SelectItem>
              <SelectItem value="actif">{t("badges.clientStatus.actif")}</SelectItem>
              <SelectItem value="suspendu">{t("badges.clientStatus.suspendu")}</SelectItem>
              <SelectItem value="vip">{t("badges.clientStatus.vip")}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={debtFilter}
            onValueChange={(v) => setDebtFilter(v as ClientDebtFilter)}
          >
            <SelectTrigger className="h-10 rounded-xl md:col-span-1">
              <SelectValue placeholder={t("clients.filterDebt")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{t("clients.filterDebtAll")}</SelectItem>
              <SelectItem value="with_debt">{t("clients.filterDebtWith")}</SelectItem>
              <SelectItem value="over_limit">{t("clients.filterDebtOver")}</SelectItem>
              <SelectItem value="clear">{t("clients.filterDebtClear")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <CardContent className="p-0">
          <TableListToolbar
            summary={
              !loading && filteredClients.length > 0
                ? t("clients.countSummary", { count: filteredClients.length })
                : undefined
            }
            actions={
              <TableColumnToggle
                columns={tableColumns}
                isVisible={isVisible}
                onToggle={toggleColumn}
                onReset={resetColumns}
              />
            }
          />
          {loading ? (
            <div className="flex justify-center p-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30" />
              <div>
                <p className="font-semibold">{t("clients.noClientsFound")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {clients.length === 0
                    ? t("clients.emptyStateDesc")
                    : t("clients.emptyStateFilterDesc")}
                </p>
              </div>
              {clients.length === 0 && (
                <Button asChild className="rounded-xl font-semibold">
                  <Link href="/clients/new">
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t("entity.client.new")}
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <VisibleTableColumn id="client" isVisible={isVisible}>
                      <TableHead>{t("clients.colClient")}</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="contact" isVisible={isVisible}>
                      <TableHead>{t("clients.colContact")}</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="type" isVisible={isVisible}>
                      <TableHead>{t("clients.colType")}</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="debt" isVisible={isVisible}>
                      <TableHead className="text-right">{t("clients.colDebt")}</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="status" isVisible={isVisible}>
                      <TableHead>{t("clients.colStatus")}</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="actions" isVisible={isVisible}>
                      <TableHead className="text-right">{t("clients.colActions")}</TableHead>
                    </VisibleTableColumn>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleClients.map((client) => {
                    const overLimit = isOverCreditLimit(client)
                    return (
                      <TableRow key={client.id} className="group">
                        <VisibleTableColumn id="client" isVisible={isVisible}>
                          <TableCell>
                            <Link
                              href={`/clients/${client.id}`}
                              className="flex items-center gap-3 rounded-lg transition-colors hover:bg-muted/40 -m-1 p-1"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                                {getClientInitials(client.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold group-hover:text-primary">
                                  {client.name}
                                </div>
                                <div className="flex items-center text-[10px] text-muted-foreground">
                                  <MapPin className="mr-1 h-2.5 w-2.5 shrink-0" />
                                  <span className="truncate">
                                    {client.address || t("clients.noAddress")}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="contact" isVisible={isVisible}>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Phone className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                              {client.phone}
                            </div>
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="type" isVisible={isVisible}>
                          <TableCell>
                            <StatusBadge
                              preset="clientType"
                              value={client.type}
                              className="text-[10px]"
                            />
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="debt" isVisible={isVisible}>
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
                                  {t("clients.ceilingLabel", { amount: formatAmount(client.creditCeiling, "FCFA") })}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="status" isVisible={isVisible}>
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
                                  aria-label={t("clients.statOverLimit")}
                                />
                              )}
                            </div>
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="actions" isVisible={isVisible}>
                          <TableCell className="text-right">
                            {client.currentDebt > 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-8 rounded-lg text-xs font-semibold"
                              >
                                <Link href={`/clients/${client.id}?tab=payments&action=payment`}>
                                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                                  {t("clients.collectBtn")}
                                </Link>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </VisibleTableColumn>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <TablePagination
                page={page}
                totalPages={totalPages}
                totalItems={filteredTotal}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
