
"use client"

import { useEffect, useState } from "react"
import { ProductService } from "@/services/product.service"
import { StoreService } from "@/services/store.service"
import { CategoryService } from "@/services/category.service"
import { PrintService } from "@/services/print.service"
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
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/contexts/StoreContext"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import { useT } from "@/i18n/context"

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { activeStore } = useStore()
  const { can } = usePermissions()
  const t = useT()
  const [product, setProduct] = useState<Product | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [stockLevels, setStockLevels] = useState<Record<string, number>>({})
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
        const levels: Record<string, number> = {}
        await Promise.all(
          allStores.stores.map(async (s) => {
            levels[s.id] = await ProductService.getStockLevel(prod.id, s.id)
          })
        )
        setStockLevels(levels)
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

  const handleManualAdjustment = async (delta: number) => {
    if (!activeStore || !product) return
    setAdjusting(true)
    try {
      await ProductService.updateStockLevel(product.id, activeStore.id, delta)
      toast.success(t("common.successStockUpdate"))
      loadAll()
    } catch {
      toast.error(t("common.errorAdjustment"))
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
        stockLevels,
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

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.name}</h1>
            <div className="mt-1 flex items-center gap-2">
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
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="rounded-xl font-bold"
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
            <Button asChild className="rounded-xl bg-primary font-bold hover:bg-primary/90">
              <Link href={`/inventory/${product.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> {t("inventory.edit")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-sm ring-1 ring-gray-100">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl">{t("inventory.detail.stockByStoreTitle")}</CardTitle>
              <CardDescription>{t("inventory.detail.stockByStoreDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-8 pt-4">
              {stores.map((store) => {
                const qty = stockLevels[store.id] || 0
                const isCurrent = store.id === activeStore?.id
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
                    <div className="font-headline text-2xl font-bold text-gray-900">
                      {qty}{" "}
                      <span className="ml-1 text-[10px] font-bold uppercase text-gray-400">
                        {product.unit}
                      </span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {canAdjust && (
            <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-sm ring-1 ring-gray-100">
              <CardHeader className="p-8 pb-4">
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
              <CardContent className="p-8 pt-4">
                <div className="flex items-center gap-8">
                  <div className="min-w-[140px] rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {t("inventory.detail.current")}
                    </p>
                    <p className="font-headline text-4xl font-bold text-gray-900">
                      {stockLevels[activeStore?.id || ""] || 0}
                    </p>
                  </div>
                  <div className="flex flex-1 gap-4">
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
        </div>

        <div className="space-y-8">
          <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-sm ring-1 ring-gray-100">
            <CardHeader className="p-8 pb-0 text-center">
              <CardTitle className="text-lg">{t("inventory.detail.digitalIdTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 p-8">
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <QRCodeSVG value={product.id} size={160} />
              </div>
              <div className="space-y-3 text-center">
                <Badge
                  variant="secondary"
                  className="rounded-lg border-none bg-gray-100 px-3 py-1 font-mono font-bold text-gray-500"
                >
                  {product.barcode || t("inventory.detail.noBarcode")}
                </Badge>
                <p className="text-xs font-medium leading-relaxed text-gray-400">
                  {t("inventory.detail.qrHint")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-sm ring-1 ring-gray-100">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg">{t("inventory.detail.financialInfoTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-8 pt-0">
              <div className="flex items-center justify-between border-b border-gray-50 py-4">
                <span className="text-[13px] font-bold uppercase tracking-wider text-gray-400">
                  {t("inventory.detail.sellPriceFcfa")}
                </span>
                <span className="font-headline text-lg font-bold text-primary">
                  {product.sellingPriceFCFA.toLocaleString()}
                </span>
              </div>
              {product.prices?.GNF && (
                <div className="flex items-center justify-between border-b border-gray-50 py-4">
                  <span className="text-[13px] font-bold uppercase tracking-wider text-gray-400">
                    {t("inventory.detail.priceGnf")}
                  </span>
                  <span className="font-bold text-gray-700">
                    {product.prices.GNF.toLocaleString()}
                  </span>
                </div>
              )}
              {product.prices?.USD && (
                <div className="flex items-center justify-between border-b border-gray-50 py-4">
                  <span className="text-[13px] font-bold uppercase tracking-wider text-gray-400">
                    {t("inventory.detail.priceUsd")}
                  </span>
                  <span className="font-bold text-gray-700">
                    ${product.prices.USD.toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
