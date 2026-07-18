
"use client"

import { useState, useEffect } from "react"
import { ReportService } from "@/services/report.service"
import { StoreService } from "@/services/store.service"
import { Sale, Store } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  ArrowLeft,
  Download,
  Printer,
  Search,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { toast } from "sonner"
import { useCurrency } from "@/hooks/use-currency"
import { useClientPagination } from "@/hooks/use-client-pagination"
import { TablePagination } from "@/components/ui/table-pagination"
import { useTranslatedTableColumns } from "@/hooks/use-translated-table-columns"
import { TableColumnToggle } from "@/components/ui/table-column-toggle"
import { VisibleTableColumn } from "@/components/ui/visible-table-column"
import { TableListToolbar } from "@/components/ui/table-list-toolbar"
import { SALES_REPORT_TABLE_COLUMNS } from "@/lib/table-column-presets"
import { SaleTicketButton } from "@/components/sales/sale-ticket-button"
import { useT } from "@/i18n/context"

const PAGE_SIZE = 50

const SALES_REPORT_COLUMN_LABEL_KEYS: Record<string, string> = {
  date: "reports.sales.colDate",
  client: "reports.sales.colClient",
  store: "reports.sales.colStore",
  total: "reports.sales.colTotal",
  payment: "reports.sales.colPayment",
  status: "reports.sales.colStatus",
  actions: "reports.sales.colTicket",
}

export default function SalesReportPage() {
  const t = useT()
  const { formatAmount } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<Sale[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [totals, setTotals] = useState({ revenue: 0, discount: 0, debt: 0, count: 0 })

  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"))
  const [storeId, setStoreId] = useState("all")

  const salesResetKey = `${startDate}|${endDate}|${storeId}|${sales.length}`
  const {
    paginatedItems: paginatedSales,
    page,
    setPage,
    totalPages,
    totalItems: salesTotal,
    rangeStart,
    rangeEnd,
  } = useClientPagination(sales, { pageSize: PAGE_SIZE, resetKey: salesResetKey })

  const {
    isVisible,
    toggleColumn,
    resetColumns,
    columns: tableColumns,
    visibleColumnCount,
  } = useTranslatedTableColumns("sales-report", SALES_REPORT_TABLE_COLUMNS, SALES_REPORT_COLUMN_LABEL_KEYS)

  const loadData = async () => {
    setLoading(true)
    try {
      const [salesRes, storesRes] = await Promise.all([
        ReportService.getSalesReport({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          storeId,
        }),
        StoreService.listStores(100),
      ])
      setSales(salesRes.sales)
      setTotals(salesRes.totals)
      setStores(storesRes.stores)
    } catch {
      toast.error(t("common.errorLoading"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [startDate, endDate, storeId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reports">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("reports.sales.title")}</h1>
            <p className="text-muted-foreground">{t("reports.sales.subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-2">
              <Label>{t("reports.sales.startDate")}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("reports.sales.endDate")}</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("reports.sales.store")}</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("reports.sales.storeAll")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("reports.sales.storeAll")}</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={loadData} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {t("reports.sales.filter")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">
              {t("reports.sales.statRevenue")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-headline text-accent">
              {formatAmount(totals.revenue)}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {t("reports.sales.statRevenueDesc", { count: totals.count })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">
              {t("reports.sales.statDiscount")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-headline">{formatAmount(totals.discount)}</div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {t("reports.sales.statDiscountDesc")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">
              {t("reports.sales.statCredit")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-headline text-destructive">
              {formatAmount(totals.debt)}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {t("reports.sales.statCreditDesc")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-accent" />
            </div>
          ) : (
            <>
              <TableListToolbar
                summary={sales.length > 0 ? t("reports.sales.summary", { count: sales.length }) : undefined}
                actions={
                  <TableColumnToggle
                    columns={tableColumns}
                    isVisible={isVisible}
                    onToggle={toggleColumn}
                    onReset={resetColumns}
                  />
                }
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <VisibleTableColumn id="date" isVisible={isVisible}>
                      <TableHead>{t("reports.sales.colDate")}</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="client" isVisible={isVisible}>
                      <TableHead>{t("reports.sales.colClient")}</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="store" isVisible={isVisible}>
                      <TableHead>{t("reports.sales.colStore")}</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="total" isVisible={isVisible}>
                      <TableHead className="text-right">{t("reports.sales.colTotal")}</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="payment" isVisible={isVisible}>
                      <TableHead className="text-center">{t("reports.sales.colPayment")}</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="status" isVisible={isVisible}>
                      <TableHead>{t("reports.sales.colStatus")}</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="actions" isVisible={isVisible}>
                      <TableHead className="text-right">{t("reports.sales.colTicket")}</TableHead>
                    </VisibleTableColumn>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumnCount}
                        className="py-12 text-center text-muted-foreground"
                      >
                        {t("reports.sales.noSales")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSales.map((s) => (
                      <TableRow key={s.id}>
                        <VisibleTableColumn id="date" isVisible={isVisible}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold">
                                #{s.id.slice(-6).toUpperCase()}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {s.timestamp?.toDate
                                  ? format(s.timestamp.toDate(), "dd/MM/yy HH:mm")
                                  : "-"}
                              </span>
                            </div>
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="client" isVisible={isVisible}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">
                                {s.clientName || t("common.walkIn")}
                              </span>
                              <span className="text-[9px] italic text-muted-foreground">
                                {t("reports.sales.bySeller", { name: s.sellerName })}
                              </span>
                            </div>
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="store" isVisible={isVisible}>
                          <TableCell className="text-xs">
                            {stores.find((st) => st.id === s.storeId)?.code || "N/A"}
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="total" isVisible={isVisible}>
                          <TableCell className="text-right font-headline font-bold">
                            {s.total.toLocaleString()}
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="payment" isVisible={isVisible}>
                          <TableCell className="text-center">
                            {s.debtAmount > 0 ? (
                              <StatusBadge
                                preset="salePayment"
                                value="partial"
                                className="text-[9px] uppercase"
                              />
                            ) : (
                              <StatusBadge
                                preset="salePayment"
                                value="complete"
                                className="text-[9px] uppercase"
                              />
                            )}
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="status" isVisible={isVisible}>
                          <TableCell>
                            <StatusBadge
                              preset="saleStatus"
                              value={s.status}
                              className="text-[9px] uppercase"
                            />
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="actions" isVisible={isVisible}>
                          <TableCell className="text-right">
                            <SaleTicketButton sale={s} stores={stores} />
                          </TableCell>
                        </VisibleTableColumn>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                page={page}
                totalPages={totalPages}
                totalItems={salesTotal}
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
