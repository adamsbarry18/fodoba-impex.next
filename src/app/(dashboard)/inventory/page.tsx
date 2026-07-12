
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DocumentSnapshot } from "firebase/firestore"
import { ProductService } from "@/services/product.service"
import { CategoryService } from "@/services/category.service"
import { Product, Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  Search,
  Edit,
  Package,
  Loader2,
  ChevronDown,
  Eye,
  RefreshCw,
  History,
  AlertTriangle,
  Boxes,
  TrendingDown,
  MoreVertical,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { StatusBadge } from "@/components/ui/status-badge"
import { useStore } from "@/lib/contexts/StoreContext"
import { usePermissions } from "@/hooks/use-permissions"
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
import { BarcodeScanField } from "@/components/barcode/barcode-scan-field"
import {
  countLowStock,
  countOutOfStock,
  estimateStockValue,
  getStockStatus,
  type StockFilter,
} from "@/lib/product-utils"
import { cn } from "@/lib/utils"
import { useTableColumns } from "@/hooks/use-table-columns"
import { TableColumnToggle } from "@/components/ui/table-column-toggle"
import { VisibleTableColumn } from "@/components/ui/visible-table-column"
import { INVENTORY_TABLE_COLUMNS } from "@/lib/table-column-presets"

const PAGE_SIZE = 25

export default function InventoryPage() {
  const router = useRouter()
  const { activeStore } = useStore()
  const { can } = usePermissions()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stocks, setStocks] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | undefined>()
  const [hasMore, setHasMore] = useState(true)
  const [scanProcessing, setScanProcessing] = useState(false)

  const canManage = can("manage:catalog")

  const { isVisible, toggleColumn, resetColumns, columns: tableColumns } =
    useTableColumns("inventory", INVENTORY_TABLE_COLUMNS)

  const loadData = useCallback(
    async (options?: { loadMore?: boolean; reset?: boolean }) => {
      if (!activeStore) return
      const loadMore = options?.loadMore ?? false
      if (loadMore) setLoadingMore(true)
      else setLoading(true)

      try {
        const [prodData, catData] = await Promise.all([
          ProductService.listProducts(
            {
              categoryId: filterCategory === "all" ? undefined : filterCategory,
            },
            PAGE_SIZE,
            loadMore && !options?.reset ? lastVisible : undefined
          ),
          loadMore ? Promise.resolve(null) : CategoryService.listCategories(),
        ])

        if (catData) setCategories(catData)

        const newProducts = loadMore
          ? [...products, ...prodData.products]
          : prodData.products
        setProducts(newProducts)
        setLastVisible(prodData.lastVisible)
        setHasMore(prodData.products.length === PAGE_SIZE)

        const productIds = prodData.products.map((p) => p.id)
        const newStocks = await ProductService.getStockLevelsForProducts(
          productIds,
          activeStore.id
        )
        setStocks((prev) => (loadMore ? { ...prev, ...newStocks } : newStocks))
      } catch {
        toast.error("Erreur de chargement")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [activeStore, filterCategory, lastVisible, products]
  )

  useEffect(() => {
    if (!activeStore) {
      setProducts([])
      setStocks({})
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchInitial = async () => {
      setLoading(true)
      try {
        const [prodData, catData] = await Promise.all([
          ProductService.listProducts(
            { categoryId: filterCategory === "all" ? undefined : filterCategory },
            PAGE_SIZE
          ),
          CategoryService.listCategories(),
        ])
        if (cancelled) return

        setProducts(prodData.products)
        setCategories(catData)
        setLastVisible(prodData.lastVisible)
        setHasMore(prodData.products.length === PAGE_SIZE)

        const newStocks = await ProductService.getStockLevelsForProducts(
          prodData.products.map((p) => p.id),
          activeStore.id
        )
        if (!cancelled) setStocks(newStocks)
      } catch {
        if (!cancelled) toast.error("Erreur de chargement")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchInitial()
    return () => {
      cancelled = true
    }
  }, [filterCategory, activeStore?.id])

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return products.filter((p) => {
      const stock = stocks[p.id] ?? 0
      const status = getStockStatus(stock, p.lowStockThreshold)

      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.barcode ?? "").toLowerCase().includes(term)

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && status === "low") ||
        (stockFilter === "out" && status === "out")

      return matchesSearch && matchesStock
    })
  }, [products, searchTerm, stocks, stockFilter])

  const stats = useMemo(
    () => ({
      total: products.length,
      lowStock: countLowStock(products, stocks),
      outOfStock: countOutOfStock(products, stocks),
      valuation: estimateStockValue(products, stocks),
    }),
    [products, stocks]
  )

  const handleRefresh = async () => {
    setLastVisible(undefined)
    setHasMore(true)
    await loadData({ reset: true })
  }

  const handleProductScan = useCallback(
    async (code: string) => {
      setScanProcessing(true)
      try {
        const product = await ProductService.findProductByCode(code)
        if (!product) {
          toast.error(`Produit introuvable : ${code}`)
          return
        }
        router.push(`/inventory/${product.id}`)
      } catch {
        toast.error("Erreur lors du scan")
      } finally {
        setScanProcessing(false)
      }
    },
    [router]
  )

  if (!activeStore) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <Package className="h-10 w-10 opacity-30" />
        <p>Sélectionnez une boutique pour consulter le catalogue et les stocks.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Catalogue et stocks</h1>
            <p className="text-sm text-muted-foreground">
              Articles et niveaux de stock pour{" "}
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
          <Button variant="outline" asChild className="rounded-xl font-semibold">
            <Link href="/inventory/history">
              <History className="mr-2 h-4 w-4" />
              Historique flux
            </Link>
          </Button>
          {canManage && (
            <Button asChild className="rounded-xl font-semibold">
              <Link href="/inventory/new">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau produit
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900/50">
              <Boxes className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Produits chargés
              </p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Stock bas
              </p>
              <p className="text-2xl font-bold">{stats.lowStock}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40">
              <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Ruptures
              </p>
              <p className="text-2xl font-bold">{stats.outOfStock}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 rounded-2xl border bg-card shadow-sm lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Valorisation vente
              </p>
              <p className="text-sm font-bold">
                {stats.valuation.toLocaleString("fr-FR")} FCFA
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, SKU ou code-barres…"
              className="h-10 rounded-xl pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={stockFilter}
            onValueChange={(v) => setStockFilter(v as StockFilter)}
          >
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les stocks</SelectItem>
              <SelectItem value="low">Stock bas</SelectItem>
              <SelectItem value="out">Rupture</SelectItem>
            </SelectContent>
          </Select>
          <div className="md:col-span-4">
            <BarcodeScanField
              placeholder="Scanner un produit [F2]…"
              onScan={handleProductScan}
              processing={scanProcessing}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 p-4 sm:p-6">
          <div>
            <CardTitle className="text-base">Liste des produits</CardTitle>
            <CardDescription className="text-xs">
              {filteredProducts.length} produit{filteredProducts.length !== 1 ? "s" : ""}
              {(searchTerm || stockFilter !== "all") && " (filtrés)"}
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
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-16 text-center text-muted-foreground">
              <Package className="h-10 w-10 opacity-30" />
              <p className="font-medium">Aucun produit trouvé</p>
              <p className="text-xs">
                {products.length === 0 && canManage
                  ? "Ajoutez votre premier article au catalogue."
                  : "Modifiez vos filtres de recherche."}
              </p>
              {products.length === 0 && canManage && (
                <Button asChild className="mt-2 rounded-xl">
                  <Link href="/inventory/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau produit
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <VisibleTableColumn id="product" isVisible={isVisible}>
                        <TableHead className="pl-4 sm:pl-6">Produit</TableHead>
                      </VisibleTableColumn>
                      <VisibleTableColumn id="sku" isVisible={isVisible}>
                        <TableHead>SKU / Code-barres</TableHead>
                      </VisibleTableColumn>
                      <VisibleTableColumn id="category" isVisible={isVisible}>
                        <TableHead>Catégorie</TableHead>
                      </VisibleTableColumn>
                      <VisibleTableColumn id="price" isVisible={isVisible}>
                        <TableHead className="text-right">Prix (FCFA)</TableHead>
                      </VisibleTableColumn>
                      <VisibleTableColumn id="stock" isVisible={isVisible}>
                        <TableHead className="text-center">Stock</TableHead>
                      </VisibleTableColumn>
                      <VisibleTableColumn id="actions" isVisible={isVisible}>
                        <TableHead className="pr-4 text-right sm:pr-6">Actions</TableHead>
                      </VisibleTableColumn>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((p) => {
                      const stock = stocks[p.id] ?? 0
                      const status = getStockStatus(stock, p.lowStockThreshold)
                      const category = categories.find((c) => c.id === p.categoryId)?.name

                      return (
                        <TableRow
                          key={p.id}
                          className="transition-colors hover:bg-muted/20"
                        >
                          <VisibleTableColumn id="product" isVisible={isVisible}>
                            <TableCell className="pl-4 sm:pl-6">
                              <p className="text-sm font-semibold">{p.name}</p>
                              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {p.unit}
                              </p>
                            </TableCell>
                          </VisibleTableColumn>
                          <VisibleTableColumn id="sku" isVisible={isVisible}>
                            <TableCell>
                              <p className="font-mono text-xs">{p.sku}</p>
                              {p.barcode && (
                                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                  {p.barcode}
                                </p>
                              )}
                            </TableCell>
                          </VisibleTableColumn>
                          <VisibleTableColumn id="category" isVisible={isVisible}>
                            <TableCell>
                              <StatusBadge hashFromLabel className="text-[10px]">
                                {category || "N/A"}
                              </StatusBadge>
                            </TableCell>
                          </VisibleTableColumn>
                          <VisibleTableColumn id="price" isVisible={isVisible}>
                            <TableCell className="text-right font-headline font-bold">
                              {p.sellingPriceFCFA.toLocaleString("fr-FR")}
                            </TableCell>
                          </VisibleTableColumn>
                          <VisibleTableColumn id="stock" isVisible={isVisible}>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={cn(
                                    "text-base font-bold font-headline",
                                    status === "out" && "text-destructive",
                                    status === "low" && "text-amber-600",
                                    status === "ok" && "text-foreground"
                                  )}
                                >
                                  {stock}
                                </span>
                                {status === "low" && (
                                  <StatusBadge tone="warning" className="text-[8px]">
                                    Alerte
                                  </StatusBadge>
                                )}
                                {status === "out" && (
                                  <StatusBadge tone="destructive" className="text-[8px]">
                                    Rupture
                                  </StatusBadge>
                                )}
                              </div>
                            </TableCell>
                          </VisibleTableColumn>
                          <VisibleTableColumn id="actions" isVisible={isVisible}>
                            <TableCell className="pr-4 text-right sm:pr-6">
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
                              <DropdownMenuContent
                                align="end"
                                className="w-40 rounded-xl p-2"
                              >
                                <DropdownMenuItem asChild className="rounded-lg">
                                  <Link
                                    href={`/inventory/${p.id}`}
                                    className="flex items-center gap-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                    Détails
                                  </Link>
                                </DropdownMenuItem>
                                {canManage && (
                                  <DropdownMenuItem asChild className="rounded-lg">
                                    <Link
                                      href={`/inventory/${p.id}/edit`}
                                      className="flex items-center gap-2 text-primary"
                                    >
                                      <Edit className="h-4 w-4" />
                                      Modifier
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          </VisibleTableColumn>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {hasMore && (
                <div className="flex justify-center border-t p-4">
                  <Button
                    variant="ghost"
                    onClick={() => loadData({ loadMore: true })}
                    disabled={loadingMore}
                    className="rounded-xl font-semibold"
                  >
                    {loadingMore ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronDown className="mr-2 h-4 w-4" />
                    )}
                    Charger plus de produits
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
