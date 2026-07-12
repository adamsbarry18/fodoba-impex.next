
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
  History, 
  Loader2, 
  Package, 
  Plus, 
  Minus, 
  QrCode,
  Download
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/contexts/StoreContext"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { activeStore } = useStore()
  const { can } = usePermissions()
  const [product, setProduct] = useState<Product | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [stockLevels, setStockLevels] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [adjusting, setAdjusting] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const canEdit = can('manage:catalog')
  const canAdjust = can('adjust:stock')

  const loadAll = async () => {
    try {
      const [prod, allStores] = await Promise.all([
        ProductService.getProduct(params.id as string),
        StoreService.listStores(100)
      ])

      if (prod) {
        setProduct(prod)
        const levels: Record<string, number> = {}
        await Promise.all(allStores.stores.map(async (s) => {
          levels[s.id] = await ProductService.getStockLevel(prod.id, s.id)
        }))
        setStockLevels(levels)
        setStores(allStores.stores)
      } else {
        toast.error("Produit introuvable")
        router.push("/inventory")
      }
    } catch (error) {
      toast.error("Erreur de chargement")
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
      toast.success("Stock mis à jour")
      loadAll()
    } catch (error) {
      toast.error("Erreur d'ajustement")
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
        // catégorie optionnelle pour le PDF
      }
      await PrintService.generateProductSheet(
        product,
        stores,
        stockLevels,
        activeStore,
        categoryName
      )
      toast.success("Fiche PDF téléchargée")
    } catch {
      toast.error("Erreur lors de la génération du PDF")
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
  if (!product) return null

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" asChild>
            <Link href="/inventory">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-gray-100 text-gray-500 font-mono text-[10px] px-2 py-0.5 rounded-md">
                {product.sku}
              </Badge>
              <span className="text-gray-400 text-sm font-medium">•</span>
              <span className="text-gray-400 text-sm font-medium">{product.unit}</span>
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
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Fiche PDF
          </Button>
          {canEdit && (
            <Button asChild className="rounded-xl font-bold bg-primary hover:bg-primary/90">
              <Link href={`/inventory/${product.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" /> Modifier
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Info Card */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl">État des Stocks par Boutique</CardTitle>
              <CardDescription>Visualisation globale du stock réel sur l'ensemble du réseau.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-4">
                {stores.map(store => {
                  const qty = stockLevels[store.id] || 0
                  const isCurrent = store.id === activeStore?.id
                  return (
                    <div key={store.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isCurrent ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10" : "bg-white border-gray-100"}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-2.5 h-2.5 rounded-full ${qty > product.lowStockThreshold ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]"}`} />
                        <div>
                          <div className="font-bold text-gray-900">
                            {store.name} 
                            {isCurrent && <Badge variant="secondary" className="ml-3 bg-primary/10 text-primary text-[9px] uppercase tracking-widest font-bold border-none">Ma boutique</Badge>}
                          </div>
                          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{store.code}</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold font-headline text-gray-900">
                        {qty} <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">{product.unit}</span>
                      </div>
                    </div>
                  )
                })}
            </CardContent>
          </Card>

          {canAdjust && (
            <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[32px] overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  Ajustement Manuel (Inventaire)
                </CardTitle>
                <CardDescription>Corrigez le stock pour <strong>{activeStore?.name}</strong>.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <div className="flex items-center gap-8">
                  <div className="text-center bg-gray-50 p-6 rounded-2xl border border-gray-100 min-w-[140px]">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Actuel</p>
                    <p className="text-4xl font-headline font-bold text-gray-900">{stockLevels[activeStore?.id || ''] || 0}</p>
                  </div>
                  <div className="flex flex-1 gap-4">
                    <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold text-gray-600 border-gray-200" onClick={() => handleManualAdjustment(-1)} disabled={adjusting}>
                      <Minus className="w-5 h-5 mr-2" /> Retirer 1
                    </Button>
                    <Button className="flex-1 h-14 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => handleManualAdjustment(1)} disabled={adjusting}>
                      <Plus className="w-5 h-5 mr-2" /> Ajouter 1
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Codes & Info */}
        <div className="space-y-8">
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="p-8 pb-0 text-center">
              <CardTitle className="text-lg">Identifiant Digital</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 p-8">
              <div className="p-6 bg-white rounded-3xl shadow-sm ring-1 ring-gray-100">
                <QRCodeSVG value={product.id} size={160} />
              </div>
              <div className="text-center space-y-3">
                <Badge variant="secondary" className="bg-gray-100 text-gray-500 font-mono font-bold border-none px-3 py-1 rounded-lg">
                  {product.barcode || "Pas de code-barres"}
                </Badge>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">Scannez ce QR Code pour identifier rapidement ce produit au POS ou lors des transferts.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg">Informations Financières</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-1">
              <div className="flex justify-between items-center py-4 border-b border-gray-50">
                <span className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Prix Vente FCFA</span>
                <span className="font-headline font-bold text-primary text-lg">{product.sellingPriceFCFA.toLocaleString()}</span>
              </div>
              {product.prices?.GNF && (
                <div className="flex justify-between items-center py-4 border-b border-gray-50">
                  <span className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Prix GNF</span>
                  <span className="font-bold text-gray-700">{product.prices.GNF.toLocaleString()}</span>
                </div>
              )}
              {product.prices?.USD && (
                <div className="flex justify-between items-center py-4 border-b border-gray-50">
                  <span className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Prix USD ($)</span>
                  <span className="font-bold text-gray-700">${product.prices.USD.toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
