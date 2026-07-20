
"use client"

import { useEffect, useState } from "react"
import { ProductService } from "@/services/product.service"
import { InventoryService } from "@/services/inventory.service"
import { StoreService } from "@/services/store.service"
import { CategoryService } from "@/services/category.service"
import { PrintService } from "@/services/print.service"
import { getPrintLabels } from "@/lib/print-labels"
import { Product, Store } from "@/lib/types"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ArrowLeft,
  Edit,
  Loader2,
  Package,
  Plus,
  Minus,
  Download,
  ImageIcon,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/contexts/StoreContext"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import { useT } from "@/i18n/context"
import { useAuth } from "@/lib/contexts/AuthContext"
import { formatDecomposedStockLabel, type DecomposedStock } from "@/lib/stock-utils"
import { normalizeProduct } from "@/lib/product-utils"
import { ProductExpirationDisplay } from "@/components/inventory/product-expiration-display"
import { AppNotificationHelper } from "@/lib/notifications/app-notification-helper"

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { activeStore } = useStore()
  const { userProfile } = useAuth()
  const { can } = usePermissions()
  const t = useT()
  const [product, setProduct] = useState<Product | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [stockRecords, setStockRecords] = useState<Record<string, DecomposedStock>>({})
  const [loading, setLoading] = useState(true)
  const [adjusting, setAdjusting] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const canEdit = can("manage:catalog")
  const canAdjust = can("adjust:stock")

  const loadAll = async () => {
    try {
      const [prod, allStores] = await Promise.all([
        ProductService.getProduct(params.id as string),
        StoreService.listStores(100),
      ])

      if (prod) {
        setProduct(prod)
        const levels: Record<string, DecomposedStock> = {}
        await Promise.all(
          allStores.stores.map(async (s) => {
            levels[s.id] = await ProductService.getStockRecord(
              prod.id,
              s.id,
              normalizeProduct(prod).unitsPerPack
            )
          })
        )
        setStockRecords(levels)
        setStores(allStores.stores)
      } else {
        toast.error(t("common.errorProductNotFound"))
        router.push("/inventory")
      }
    } catch {
      toast.error(t("common.errorLoading"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [params.id])

  useEffect(() => {
    if (!product) return
    void AppNotificationHelper.notifyProductExpiration({
      product,
      storeId: activeStore?.id,
    })
  }, [product, activeStore?.id])

  const handleManualAdjustment = async (delta: number) => {
    if (!activeStore || !product || !userProfile) return
    setAdjusting(true)
    try {
      await InventoryService.adjustDetailStock({
        productId: product.id,
        storeId: activeStore.id,
        delta,
        user: userProfile,
        reason: t("inventory.form.stockCorrectionReason"),
      })
      toast.success(t("common.successStockUpdate"))
      loadAll()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("common.errorAdjustment"))
    } finally {
      setAdjusting(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!product) return
    setGeneratingPdf(true)
    try {
      let categoryName: string | undefined
      try {
        const category = await CategoryService.getCategory(product.categoryId)
        categoryName = category?.name
      } catch {
        // optional for PDF
      }
      await PrintService.generateProductSheet(
        product,
        stores,
        stockRecords,
        getPrintLabels(t),
        activeStore,
        categoryName
      )
      toast.success(t("common.successExportPdf"))
    } catch {
      toast.error(t("common.errorExportPdf"))
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-primary" />
      </div>
    )
  }
  if (!product) return null

  const normalized = normalizeProduct(product)

  const cardClassName =
    "overflow-hidden rounded-[32px] border-none bg-white shadow-sm ring-1 ring-gray-100"

  const metaRowClassName =
    "flex items-center justify-between border-b border-gray-50 py-3 last:border-b-0"
  const metaLabelClassName =
    "text-[11px] font-bold uppercase tracking-wider text-gray-400"
  const metaValueClassName = "text-right font-bold text-gray-700"

  const hasPackagingInfo =
    (normalized.packagingUnit && normalized.unitsPerPack > 1) ||
    !!product.manufacturingDate ||
    !!product.expirationDate

  const hasFinancialInfo =
    product.sellingPriceFCFA > 0 ||
    (normalized.wholesalePriceFCFA ?? 0) > 0 ||
    product.purchasePriceRef > 0 ||
    !!product.prices?.GNF ||
    !!product.prices?.USD

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-xl" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {product.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-500"
              >
                {product.sku}
              </Badge>
              <span className="text-sm font-medium text-gray-400">•</span>
              <span className="text-sm font-medium text-gray-400">{product.unit}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl font-bold sm:flex-none"
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
          >
            {generatingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {t("inventory.detail.productSheet")}
          </Button>
          {canEdit && (
            <Button
              asChild
              className="flex-1 rounded-xl bg-primary font-bold hover:bg-primary/90 sm:flex-none"
            >
              <Link href={`/inventory/${product.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> {t("inventory.edit")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <Card className={`${cardClassName} lg:col-span-2`}>
          {product.imageUrl ? (
            <CardContent className="flex max-h-[160px] items-center justify-center overflow-hidden bg-muted/10 p-3 sm:max-h-[180px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-h-[136px] w-full max-w-full object-contain sm:max-h-[156px]"
              />
            </CardContent>
          ) : (
            <CardContent className="flex h-[160px] flex-col items-center justify-center gap-2 bg-muted/20 sm:h-[180px]">
              <div className="rounded-xl bg-muted/40 p-3">
                <ImageIcon className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-[10px] font-medium text-muted-foreground">
                {t("inventory.form.image")}
              </p>
            </CardContent>
          )}
        </Card>

        {(hasPackagingInfo || hasFinancialInfo) && (
          <Card className={`${cardClassName} lg:col-span-7`}>
            <CardContent
              className={`grid h-full gap-0 p-6 sm:gap-6 sm:p-8 ${
                hasPackagingInfo && hasFinancialInfo
                  ? "sm:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]"
                  : "sm:grid-cols-1"
              }`}
            >
              {hasPackagingInfo && (
                <div
                  className={`space-y-1 ${hasFinancialInfo ? "sm:border-r sm:border-gray-100 sm:pr-6" : ""}`}
                >
                  <p className="mb-3 text-sm font-bold text-gray-900">
                    {t("inventory.detail.packagingInfo")}
                  </p>
                  {normalized.packagingUnit && normalized.unitsPerPack > 1 && (
                    <div className={metaRowClassName}>
                      <span className={metaLabelClassName}>
                        {t("inventory.form.unitsPerPack")}
                      </span>
                      <span className={metaValueClassName}>
                        {t("inventory.detail.unitsPerPack", {
                          count: normalized.unitsPerPack,
                          unit: product.unit,
                          packaging: normalized.packagingUnit,
                        })}
                      </span>
                    </div>
                  )}
                  {product.manufacturingDate && (
                    <div className={metaRowClassName}>
                      <span className={metaLabelClassName}>
                        {t("inventory.detail.manufacturingDate")}
                      </span>
                      <span className={metaValueClassName}>{product.manufacturingDate}</span>
                    </div>
                  )}
                  {product.expirationDate && (
                    <div className={metaRowClassName}>
                      <span className={metaLabelClassName}>
                        {t("inventory.detail.expirationDate")}
                      </span>
                      <ProductExpirationDisplay
                        expirationDate={product.expirationDate}
                        showDate
                        className="text-right"
                      />
                    </div>
                  )}
                </div>
              )}

              {hasFinancialInfo && (
                <div className="space-y-1 sm:pl-2">
                  <p className="mb-2 text-xs font-bold text-gray-900">
                    {t("inventory.detail.financialInfoTitle")}
                  </p>
                  <div className={metaRowClassName}>
                    <span className={metaLabelClassName}>{t("inventory.form.retailPrice")}</span>
                    <span className="font-headline text-base font-bold text-primary">
                      {product.sellingPriceFCFA.toLocaleString()}
                    </span>
                  </div>
                  {(normalized.wholesalePriceFCFA ?? 0) > 0 && (
                    <div className={metaRowClassName}>
                      <span className={metaLabelClassName}>
                        {t("inventory.detail.wholesalePrice")}
                      </span>
                      <span className={metaValueClassName}>
                        {normalized.wholesalePriceFCFA!.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {product.purchasePriceRef > 0 && (
                    <div className={metaRowClassName}>
                      <span className={metaLabelClassName}>
                        {t("inventory.detail.purchasePrice")}
                      </span>
                      <span className={metaValueClassName}>
                        {product.purchasePriceRef.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {product.prices?.GNF ? (
                    <div className={metaRowClassName}>
                      <span className={metaLabelClassName}>{t("inventory.detail.priceGnf")}</span>
                      <span className={metaValueClassName}>
                        {product.prices.GNF.toLocaleString()}
                      </span>
                    </div>
                  ) : null}
                  {product.prices?.USD ? (
                    <div className={metaRowClassName}>
                      <span className={metaLabelClassName}>{t("inventory.detail.priceUsd")}</span>
                      <span className={metaValueClassName}>
                        ${product.prices.USD.toLocaleString()}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card
          className={`${cardClassName} ${hasPackagingInfo || hasFinancialInfo ? "lg:col-span-3" : "lg:col-span-10"}`}
        >
          <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-4 sm:p-5 lg:flex-col">
            <div className="shrink-0 rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
              <QRCodeSVG value={product.id} size={96} />
            </div>
            <div className="space-y-1.5 text-center lg:text-center">
              <p className="text-xs font-bold text-gray-900">
                {t("inventory.detail.digitalIdTitle")}
              </p>
              <Badge
                variant="secondary"
                className="rounded-lg border-none bg-gray-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-gray-500"
              >
                {product.barcode || t("inventory.detail.noBarcode")}
              </Badge>
              <p className="max-w-[200px] text-[10px] font-medium leading-relaxed text-gray-400">
                {t("inventory.detail.qrHint")}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <Card className={cardClassName}>
          <CardHeader className="p-6 pb-2 sm:p-8 sm:pb-4">
            <CardTitle className="text-xl">{t("inventory.detail.stockByStoreTitle")}</CardTitle>
            <CardDescription>{t("inventory.detail.stockByStoreDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-2 sm:p-8 sm:pt-4">
            {stores.map((store) => {
              const stockRecord = stockRecords[store.id] ?? {
                packagingQty: 0,
                detailQty: 0,
                quantity: 0,
              }
              const qty = stockRecord.quantity
              const isCurrent = store.id === activeStore?.id
              const hasPackaging =
                !!normalized.packagingUnit && normalized.unitsPerPack > 1
              const decomposedLabel = formatDecomposedStockLabel(
                stockRecord,
                product,
                t("inventory.stockBreakdownSeparator")
              )
              return (
                <div
                  key={store.id}
                  className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${isCurrent ? "border-primary/20 bg-primary/5 ring-1 ring-primary/10" : "border-gray-100 bg-white"}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${qty > product.lowStockThreshold ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]"}`}
                    />
                    <div>
                      <div className="font-bold text-gray-900">
                        {store.name}
                        {isCurrent && (
                          <Badge
                            variant="secondary"
                            className="ml-3 border-none bg-primary/10 text-[9px] font-bold uppercase tracking-widest text-primary"
                          >
                            {t("inventory.detail.myStore")}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        {store.code}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {hasPackaging ? (
                      <>
                        <div className="font-headline text-lg font-bold leading-tight text-gray-900 sm:text-xl">
                          {decomposedLabel}
                        </div>
                        <p className="mt-1 text-[10px] text-gray-400">
                          {t("inventory.stockTotalUnits", {
                            count: qty,
                            unit: product.unit,
                          })}
                        </p>
                      </>
                    ) : (
                      <div className="font-headline text-2xl font-bold text-gray-900">
                        {qty}{" "}
                        <span className="ml-1 text-[10px] font-bold uppercase text-gray-400">
                          {product.unit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {canAdjust && (
          <Card className={cardClassName}>
            <CardHeader className="p-6 pb-2 sm:p-8 sm:pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="rounded-xl bg-primary/10 p-2">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                {t("inventory.detail.manualAdjustTitle")}
              </CardTitle>
              <CardDescription>
                {t.rich("inventory.detail.manualAdjustDesc", {
                  store: activeStore?.name ?? "",
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2 sm:p-8 sm:pt-4">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="min-w-[140px] rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {t("inventory.detail.current")}
                  </p>
                  <p className="font-headline text-4xl font-bold text-gray-900">
                    {(() => {
                      const record = stockRecords[activeStore?.id || ""] ?? {
                        packagingQty: 0,
                        detailQty: 0,
                        quantity: 0,
                      }
                      const hasPackaging =
                        !!normalized.packagingUnit && normalized.unitsPerPack > 1
                      if (hasPackaging) {
                        return formatDecomposedStockLabel(
                          record,
                          product,
                          t("inventory.stockBreakdownSeparator")
                        )
                      }
                      return record.quantity
                    })()}
                  </p>
                  {normalized.packagingUnit && normalized.unitsPerPack > 1 && (
                    <p className="mt-1 text-[10px] text-gray-400">
                      {t("inventory.stockTotalUnits", {
                        count: stockRecords[activeStore?.id || ""]?.quantity ?? 0,
                        unit: product.unit,
                      })}
                    </p>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:gap-4">
                  <Button
                    variant="outline"
                    className="h-14 flex-1 rounded-2xl border-gray-200 font-bold text-gray-600"
                    onClick={() => handleManualAdjustment(-1)}
                    disabled={adjusting}
                  >
                    <Minus className="mr-2 h-5 w-5" /> {t("inventory.detail.removeOne")}
                  </Button>
                  <Button
                    className="h-14 flex-1 rounded-2xl bg-primary font-bold shadow-lg shadow-primary/20 hover:bg-primary/90"
                    onClick={() => handleManualAdjustment(1)}
                    disabled={adjusting}
                  >
                    <Plus className="mr-2 h-5 w-5" /> {t("inventory.detail.addOne")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
