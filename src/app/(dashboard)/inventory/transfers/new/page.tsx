
"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { InventoryService } from "@/services/inventory.service"
import { ProductService } from "@/services/product.service"
import { StoreService } from "@/services/store.service"
import { Product, Store } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useStore } from "@/lib/contexts/StoreContext"
import { useAuth } from "@/lib/contexts/AuthContext"
import {
  ArrowLeft,
  Loader2,
  ArrowRightLeft,
  Package,
  Info,
  Store as StoreIcon,
  AlertTriangle,
  Save,
  History,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FieldWithAdd } from "@/components/forms/field-with-add"
import { applyReturnSelection } from "@/hooks/use-return-selection"
import { ENTITY_ROUTES } from "@/lib/navigation/return-to"
import { BarcodeScanField } from "@/components/barcode/barcode-scan-field"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"

const TransferFormSchema = z.object({
  productId: z.string().min(1, "Sélectionnez un produit"),
  destinationStoreId: z.string().min(1, "Sélectionnez une boutique destination"),
  quantity: z.coerce.number().min(1, "Quantité minimale : 1"),
  reason: z.string().optional(),
})

type TransferFormValues = z.infer<typeof TransferFormSchema>

export default function NewTransferPage() {
  const router = useRouter()
  const { activeStore } = useStore()
  const { userProfile } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [scanProcessing, setScanProcessing] = useState(false)
  const [sourceStock, setSourceStock] = useState(0)
  const [destStock, setDestStock] = useState<number | null>(null)
  const [loadingStock, setLoadingStock] = useState(false)

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(TransferFormSchema),
    defaultValues: {
      productId: "",
      destinationStoreId: "",
      quantity: 1,
      reason: "",
    },
  })

  const productId = form.watch("productId")
  const destinationStoreId = form.watch("destinationStoreId")
  const quantity = form.watch("quantity")

  const destinationStores = useMemo(
    () => stores.filter((s) => s.id !== activeStore?.id),
    [stores, activeStore?.id]
  )

  const selectedProduct = products.find((p) => p.id === productId)
  const destinationStore = stores.find((s) => s.id === destinationStoreId)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        const [prodResult, storeResult] = await Promise.all([
          ProductService.listProducts(),
          StoreService.listStores(100),
        ])
        if (cancelled) return
        setProducts(prodResult.products)
        setStores(storeResult.stores.filter((s) => s.active))

        await applyReturnSelection(
          ENTITY_ROUTES.product.param,
          (id) => form.setValue("productId", id),
          {
            successMessage: ENTITY_ROUTES.product.createdMessage,
            reload: async () => {
              const result = await ProductService.listProducts()
              setProducts(result.products)
            },
          }
        )
      } catch {
        if (!cancelled) toast.error("Erreur de chargement des données")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [form])

  useEffect(() => {
    if (!productId || !activeStore) {
      setSourceStock(0)
      setDestStock(null)
      return
    }

    let cancelled = false

    const fetchStocks = async () => {
      setLoadingStock(true)
      try {
        const sourceQty = await ProductService.getStockLevel(productId, activeStore.id)
        if (cancelled) return
        setSourceStock(sourceQty)

        if (destinationStoreId) {
          const destQty = await ProductService.getStockLevel(productId, destinationStoreId)
          if (!cancelled) setDestStock(destQty)
        } else {
          setDestStock(null)
        }
      } catch {
        if (!cancelled) toast.error("Erreur de lecture du stock")
      } finally {
        if (!cancelled) setLoadingStock(false)
      }
    }

    fetchStocks()
    return () => {
      cancelled = true
    }
  }, [productId, destinationStoreId, activeStore?.id])

  const handleProductScan = async (code: string) => {
    setScanProcessing(true)
    try {
      const product = await ProductService.findProductByCode(code)
      if (!product) {
        toast.error(`Produit introuvable : ${code}`)
        return
      }
      form.setValue("productId", product.id)
      toast.success(`${product.name} sélectionné`)
    } catch {
      toast.error("Erreur lors du scan")
    } finally {
      setScanProcessing(false)
    }
  }

  const onSubmit = async (values: TransferFormValues) => {
    if (!activeStore || !userProfile) return

    if (values.quantity > sourceStock) {
      form.setError("quantity", {
        message: `Stock insuffisant. Disponible : ${sourceStock}`,
      })
      return
    }

    try {
      await InventoryService.transferStock({
        productId: values.productId,
        fromStoreId: activeStore.id,
        toStoreId: values.destinationStoreId,
        quantity: values.quantity,
        user: userProfile,
        reason: values.reason,
      })
      toast.success("Transfert effectué avec succès")
      router.push("/inventory/history")
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur lors du transfert"
      toast.error(message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!activeStore) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <ArrowRightLeft className="h-10 w-10 opacity-30" />
        <p>Sélectionnez une boutique source pour initier un transfert.</p>
      </div>
    )
  }

  const stockInsufficient = quantity > sourceStock

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouveau transfert</h1>
            <p className="text-sm text-muted-foreground">
              Déplacement de stock depuis{" "}
              <strong className="text-foreground">{activeStore.name}</strong>
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4 text-primary" />
                    Article à transférer
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sélectionnez le produit ou scannez son code-barres.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Produit</FormLabel>
                        <FieldWithAdd entity="product" returnTo="/inventory/transfers/new">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 rounded-xl">
                                <SelectValue placeholder="Sélectionner un article" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl max-h-64">
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldWithAdd>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <BarcodeScanField
                    onScan={handleProductScan}
                    processing={scanProcessing}
                    placeholder="Scanner code-barres ou SKU [F2]…"
                    inputClassName="rounded-xl"
                  />
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <StoreIcon className="h-4 w-4 text-primary" />
                    Destination & quantité
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Boutique réceptrice et volume à déplacer.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="destinationStoreId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Boutique destination</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 rounded-xl">
                                <SelectValue placeholder="Choisir destination" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                              {destinationStores.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name} ({s.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Quantité à envoyer</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={sourceStock || undefined}
                              className="h-10 rounded-xl font-headline font-bold"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          {selectedProduct && (
                            <FormDescription className="text-[11px]">
                              Unité : {selectedProduct.unit}
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motif (optionnel)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex. Réapprovisionnement urgent, commande client…"
                            className="h-10 rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="sticky top-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
                <CardHeader className="border-b bg-muted/20 p-4">
                  <CardTitle className="text-sm font-bold">Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-center justify-between gap-2 rounded-xl border bg-muted/20 p-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Source
                      </p>
                      <p className="truncate text-sm font-semibold">{activeStore.name}</p>
                      <p className="text-[10px] text-muted-foreground">{activeStore.code}</p>
                    </div>
                    <ArrowRightLeft className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Destination
                      </p>
                      <p className="truncate text-sm font-semibold">
                        {destinationStore?.name ?? "-"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {destinationStore?.code ?? ""}
                      </p>
                    </div>
                  </div>

                  {selectedProduct ? (
                    <div className="space-y-3 rounded-xl border p-3">
                      <p className="text-sm font-semibold">{selectedProduct.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {selectedProduct.sku}
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-rose-50 p-2 dark:bg-rose-950/30">
                          <p className="text-[10px] text-muted-foreground">Stock source</p>
                          <p className="font-headline text-lg font-bold">
                            {loadingStock ? "…" : sourceStock}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {selectedProduct.unit}
                          </p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30">
                          <p className="text-[10px] text-muted-foreground">Stock destination</p>
                          <p className="font-headline text-lg font-bold">
                            {loadingStock || destStock === null
                              ? "…"
                              : destStock + (quantity > 0 ? quantity : 0)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            après transfert
                          </p>
                        </div>
                      </div>

                      {quantity > 0 && (
                        <StatusBadge
                          tone={stockInsufficient ? "destructive" : "info"}
                          className="w-full justify-center text-[10px]"
                        >
                          −{quantity} {selectedProduct.unit} → +{quantity}{" "}
                          {selectedProduct.unit}
                        </StatusBadge>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      Sélectionnez un produit pour voir les stocks.
                    </p>
                  )}

                  {stockInsufficient && (
                    <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      Stock source insuffisant pour cette quantité.
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p>
                      Opération irréversible. Le stock source est débité et la destination
                      créditée immédiatement.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      form.formState.isSubmitting ||
                      !productId ||
                      !destinationStoreId ||
                      quantity <= 0 ||
                      stockInsufficient
                    }
                    className="w-full rounded-xl font-semibold"
                  >
                    {form.formState.isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Confirmer le transfert
                  </Button>

                  <Button
                    variant="outline"
                    asChild
                    className="w-full rounded-xl font-semibold"
                  >
                    <Link href="/inventory/history">
                      <History className="mr-2 h-4 w-4" />
                      Voir l&apos;historique
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
