"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { ProductService } from "@/services/product.service"
import { ClientService } from "@/services/client.service"
import { SaleService } from "@/services/sale.service"
import { PrintService } from "@/services/print.service"
import { CategoryService } from "@/services/category.service"
import { CashService } from "@/services/cash.service"
import { Product, Client, SaleItem, Sale, Category, CashSession, PaymentMethod } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Printer,
  Loader2,
  CheckCircle2,
  ChevronDown,
  LayoutGrid,
  List,
  User,
  Users,
  Barcode,
  Keyboard,
  Percent,
  Tag,
  Store,
  X,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/lib/contexts/StoreContext"
import { useAuth } from "@/lib/contexts/AuthContext"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { PaymentDialog } from "@/components/pos/payment-dialog"
import { BarcodeScanField } from "@/components/barcode/barcode-scan-field"
import { useGlobalBarcodeListener } from "@/hooks/use-barcode-scanner"
import { applyReturnSelection } from "@/hooks/use-return-selection"
import { SearchListAddFooter } from "@/components/forms/search-list-add-footer"
import { ENTITY_ROUTES } from "@/lib/navigation/return-to"
import Link from "next/link"
import { useCurrency } from "@/hooks/use-currency"
import {
  applyCartDiscount,
  getCartItemCount,
  getCartSubtotal,
} from "@/lib/pos-utils"

export default function POSPage() {
  const { activeStore } = useStore()
  const { userProfile } = useAuth()
  const { formatAmount } = useCurrency()
  
  // Product & Category Data
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all")
  
  const [lastVisible, setLastVisible] = useState<any>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<SaleItem[]>([])
  
  // Customer autocomplete states
  const [selectedClientId, setSelectedClientId] = useState<string>("none")
  const [clientSearch, setClientSearch] = useState("")
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
  
  const [discount, setDiscount] = useState<number>(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Barcode scan
  const [scanProcessing, setScanProcessing] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)

  // Payment State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [cashSession, setCashSession] = useState<CashSession | null>(null)

  // Success states
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const [prodResult, clientResult, categoriesResult] = await Promise.all([
          ProductService.listProducts({ active: true }, 24),
          ClientService.listClients(),
          CategoryService.listCategories()
        ])
        setProducts(prodResult.products)
        setLastVisible(prodResult.lastVisible)
        setHasMore(prodResult.products.length === 24)
        setClients(clientResult)
        setCategories(categoriesResult)

        await applyReturnSelection(
          ENTITY_ROUTES.client.param,
          (id) => {
            setSelectedClientId(id)
            setIsClientDropdownOpen(false)
            setClientSearch("")
          },
          {
            successMessage: ENTITY_ROUTES.client.createdMessage,
            reload: async () => {
              const fresh = await ClientService.listClients()
              setClients(fresh)
            },
          }
        )
      } catch (error) {
        toast.error("Erreur lors du chargement des données initiales")
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (!activeStore?.id) {
      setCashSession(null)
      return
    }
    CashService.getActiveSession(activeStore.id)
      .then(setCashSession)
      .catch(() => setCashSession(null))
  }, [activeStore?.id, isPaymentOpen, isSuccessOpen])

  // Load products when active category changes (excluding search query matches)
  const loadProductsByCategory = async (categoryId: string, isLoadMore = false) => {
    if (isLoadMore) {
      if (loadingMore || !hasMore) return
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    
    try {
      const filters = {
        active: true,
        categoryId: categoryId === "all" ? undefined : categoryId
      }
      
      const result = await ProductService.listProducts(
        filters, 
        24, 
        isLoadMore ? lastVisible : undefined
      )
      
      if (isLoadMore) {
        setProducts(prev => [...prev, ...result.products])
      } else {
        setProducts(result.products)
      }
      
      setLastVisible(result.lastVisible)
      setHasMore(result.products.length === 24)
    } catch (error) {
      toast.error("Erreur de chargement des articles")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Handle Category Selection
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setSearchTerm("") // Clear search when changing category
    loadProductsByCategory(categoryId)
  }

  // Load more handler
  const handleLoadMore = () => {
    loadProductsByCategory(selectedCategoryId, true)
  }

  // Hybrid Search logic (real-time Firestore querying on typing with debounce)
  useEffect(() => {
    if (!searchTerm.trim()) {
      // Re-load current category if search query is cleared
      if (products.length === 0 || searchTerm === "") {
        loadProductsByCategory(selectedCategoryId)
      }
      return
    }

    const searchDebounce = setTimeout(async () => {
      setLoadingMore(true)
      try {
        const searchResults = await ProductService.searchProducts(searchTerm)
        setProducts(searchResults)
        setHasMore(false) // search returns maximum matches
      } catch (error) {
        toast.error("Erreur lors de la recherche du produit")
      } finally {
        setLoadingMore(false)
      }
    }, 450)

    return () => clearTimeout(searchDebounce)
  }, [searchTerm])

  // Barcode / douchette / caméra
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        )
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.sellingPriceFCFA,
        total: product.sellingPriceFCFA
      }]
    })
  }

  const handleProductScan = useCallback(async (code: string) => {
    setScanProcessing(true)
    try {
      const product = await ProductService.findProductByCode(code)
      if (!product) {
        toast.error(`Produit introuvable : ${code}`)
        return
      }
      addToCart(product)
      toast.success(`${product.name} ajouté au panier`, {
        duration: 1500,
        position: "bottom-center",
      })
    } catch {
      toast.error("Erreur lors du scan")
    } finally {
      setScanProcessing(false)
    }
  }, [])

  useGlobalBarcodeListener(handleProductScan)

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === id) {
        const newQty = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQty, total: newQty * item.unitPrice }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  // Direct Inline Price Edit
  const handlePriceEdit = (id: string, newPrice: number) => {
    setCart(prev => prev.map(item => 
      item.productId === id 
        ? { ...item, unitPrice: newPrice, total: item.quantity * newPrice }
        : item
    ))
  }

  const subtotal = getCartSubtotal(cart)
  const total = applyCartDiscount(subtotal, discount)
  const cartItemCount = getCartItemCount(cart)

  const handleOpenPayment = () => {
    if (!cashSession) {
      toast.error("Ouvrez la caisse avant d'encaisser une vente.")
      return
    }
    setIsPaymentOpen(true)
  }

  const handleCheckout = async (
    payments: { method: PaymentMethod; amount: number }[],
    debtAmount: number
  ) => {
    if (!activeStore || !userProfile || cart.length === 0) return
    if (debtAmount > 0 && (!selectedClientId || selectedClientId === "none")) {
      toast.error("Sélectionnez un client pour une vente à crédit.")
      return
    }

    setProcessing(true)
    try {
      const sale = await SaleService.processSale({
        store: activeStore,
        user: userProfile,
        items: cart,
        clientId: selectedClientId !== "none" ? selectedClientId : undefined,
        payments,
        discount,
        subtotal,
        total,
        debtAmount
      })

      setLastSale(sale)
      setCart([])
      setSelectedClientId("none")
      setClientSearch("")
      setDiscount(0)
      setIsPaymentOpen(false)
      setIsSuccessOpen(true)
      CashService.getActiveSession(activeStore.id).then(setCashSession)
    } catch (error: any) {
      toast.error(error.message || "Erreur de validation de la transaction")
    } finally {
      setProcessing(false)
    }
  }

  // Filter clients locally for autocomplete
  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients.slice(0, 10)
    return clients.filter(c => 
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone?.includes(clientSearch)
    ).slice(0, 10)
  }, [clients, clientSearch])

  // Get name of selected client
  const selectedClientName = useMemo(() => {
    if (selectedClientId === "none") return "Client de passage"
    return clients.find(c => c.id === selectedClientId)?.name || "Client sélectionné"
  }, [clients, selectedClientId])

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  )

  const refreshCashSession = () => {
    if (!activeStore?.id) return
    CashService.getActiveSession(activeStore.id)
      .then(setCashSession)
      .catch(() => setCashSession(null))
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-8">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Point de vente</h1>
              <StatusBadge tone="primary-soft" className="text-[10px]">
                {activeStore?.name || "Boutique"}
              </StatusBadge>
              <StatusBadge
                preset="cashSessionStatus"
                value={cashSession ? "OPEN" : "CLOSED"}
                className="text-[9px] uppercase"
              />
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              Caissier : {userProfile?.prenom} {userProfile?.nom}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground sm:flex">
            <Keyboard className="h-3.5 w-3.5" />
            <span>
              Douchette ou <kbd className="rounded border bg-background px-1.5 py-0.5 text-[10px]">F2</kbd>
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={refreshCashSession}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Caisse
          </Button>
        </div>
      </div>

      {!cashSession && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">Caisse fermée</p>
            <p className="text-xs text-muted-foreground">
              Ouvrez une session de caisse pour enregistrer des ventes et mettre à jour les encaissements.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 rounded-xl font-bold">
            <Link href="/reconciliation">Ouvrir la caisse</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Product Area (8/12 grid) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Controls: Search, Scanner Simulation & View toggle */}
          <div className="flex flex-col sm:flex-row gap-3 bg-muted/20 p-3 rounded-2xl border border-border">
            
            {/* Standard Hybrid Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher (Nom, SKU, Code-barres)..." 
                className="pl-10 h-10 w-full bg-background border-border rounded-xl text-xs focus-visible:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <BarcodeScanField
              className="flex-1"
              placeholder="Scanner code-barres [F2]…"
              onScan={handleProductScan}
              processing={scanProcessing}
              onFocusHint={() => toast.info("Prêt pour le scan", { duration: 1500 })}
            />

            {/* View Mode Grid/List toggle */}
            <div className="flex items-center gap-1.5 bg-background p-1 border border-border rounded-xl h-10 self-end">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8 rounded-lg", viewMode === 'grid' && "bg-secondary text-foreground")}
                onClick={() => setViewMode('grid')}
                title="Affichage en Grille"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8 rounded-lg", viewMode === 'list' && "bg-secondary text-foreground")}
                onClick={() => setViewMode('list')}
                title="Affichage en Liste Dense"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Horizontally scrollable category pills */}
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              <button
                onClick={() => handleCategoryChange("all")}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex-shrink-0 border",
                  selectedCategoryId === "all"
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                )}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Tous les articles</span>
              </button>
              
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex-shrink-0 border",
                    selectedCategoryId === cat.id
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Loader or Grid/List catalogs layout */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Chargement du catalogue...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                /* 1. Grid Visual Mode */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map((product) => (
                    <Card 
                      key={product.id} 
                      className="cursor-pointer hover:border-primary/20 hover:shadow-md transition-all shadow-sm border bg-card rounded-2xl overflow-hidden group relative flex flex-col justify-between"
                      onClick={() => addToCart(product)}
                    >
                      <div className="p-5 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="bg-secondary/60 text-muted-foreground border-none font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider">
                            {product.unit}
                          </Badge>
                          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                            SKU: {product.sku}
                          </span>
                        </div>
                        
                        <p className="font-bold text-xs leading-snug line-clamp-2 min-h-[36px] text-foreground group-hover:text-primary transition-colors">
                          {product.name}
                        </p>

                        <div className="flex items-end justify-between pt-1">
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Prix de vente</span>
                            <div className="text-primary font-extrabold text-base font-headline">
                              {formatAmount(product.sellingPriceFCFA, "FCFA")}
                            </div>
                          </div>
                          <div className="bg-primary/10 p-2 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-200 active:scale-90">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                /* 2. Compact Dense List Mode (SaaS Spreadsheet UI) */
                <Card className="border bg-card rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          <th className="py-3 px-5">Réf / SKU</th>
                          <th className="py-3 px-5">Nom de l'article</th>
                          <th className="py-3 px-5">Unité</th>
                          <th className="py-3 px-5 text-right">Prix (FCFA)</th>
                          <th className="py-3 px-5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-xs">
                        {products.map((product) => (
                          <tr 
                            key={product.id}
                            className="group hover:bg-muted/30 transition-colors duration-150 cursor-pointer"
                            onClick={() => addToCart(product)}
                          >
                            <td className="py-2.5 px-5 font-mono text-[10px] text-muted-foreground">{product.sku}</td>
                            <td className="py-2.5 px-5 font-bold text-foreground group-hover:text-primary transition-colors">{product.name}</td>
                            <td className="py-2.5 px-5">
                              <StatusBadge tone="slate" className="text-[9px] font-bold uppercase">
                                {product.unit}
                              </StatusBadge>
                            </td>
                            <td className="py-2.5 px-5 text-right font-bold text-foreground">
                              {formatAmount(product.sellingPriceFCFA, "FCFA")}
                            </td>
                            <td className="py-2.5 px-5 text-center">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 px-2 bg-primary/5 hover:bg-primary hover:text-white text-primary text-[10px] font-bold rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addToCart(product)
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Ajouter
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Load More Button */}
              {hasMore && !searchTerm && (
                <div className="flex justify-center py-6">
                  <Button 
                    variant="ghost" 
                    onClick={handleLoadMore} 
                    disabled={loadingMore}
                    className="text-muted-foreground font-bold text-xs hover:text-primary transition-colors h-9 rounded-xl border border-border bg-card px-4"
                  >
                    {loadingMore ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                    Charger plus de produits ({products.length} affichés)
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-card border-2 border-dashed border-border rounded-2xl max-w-md mx-auto space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
                <Barcode className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Aucun article disponible</h3>
                <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
                  Aucun article trouvé. Essayez de réinitialiser la recherche ou de changer de catégorie.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Checkout Cart & Client Selection (4/12 grid) */}
        <div className="lg:col-span-4 sticky top-6">
          <Card className="border bg-card shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between">
            <div>
              {/* Cart Header */}
              <CardHeader className="border-b border-border p-5 pb-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <div className="bg-secondary p-2 rounded-xl text-muted-foreground">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground">Panier actif</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary font-bold rounded-full px-2.5 py-0.5 text-[10px]">
                  {cartItemCount} article{cartItemCount > 1 ? "s" : ""}
                </Badge>
              </CardHeader>

              <CardContent className="p-0">
                {/* Client de facturation - passage par défaut */}
                <div className="p-5 border-b border-border space-y-2 relative">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider ml-1">
                    Client Facturation
                  </Label>

                  <div
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl border p-2.5",
                      selectedClientId === "none"
                        ? "bg-muted/40 border-border"
                        : "bg-primary/5 border-primary/20"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Users
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selectedClientId === "none" ? "text-muted-foreground" : "text-primary"
                        )}
                      />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate text-xs font-semibold",
                            selectedClientId === "none" ? "text-foreground" : "text-primary"
                          )}
                        >
                          {selectedClientName}
                        </p>
                        {selectedClientId === "none" ? (
                          <p className="text-[10px] text-muted-foreground">
                            Par défaut - vente comptant intégrale
                          </p>
                        ) : selectedClient?.phone ? (
                          <p className="text-[10px] text-muted-foreground font-mono">{selectedClient.phone}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {selectedClientId !== "none" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClientId("none")
                            setClientSearch("")
                          }}
                          className="rounded-full p-1 text-primary transition-colors hover:bg-primary/10"
                          aria-label="Revenir au client de passage"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-[11px] font-bold"
                        onClick={() => setIsClientDropdownOpen(true)}
                      >
                        {selectedClientId === "none" ? "Choisir" : "Modifier"}
                      </Button>
                    </div>
                  </div>

                  {isClientDropdownOpen && (
                    <div className="absolute left-5 right-5 top-full z-20 mt-1.5 rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
                      <div className="border-b border-border p-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Rechercher un client (Nom, Tel)..."
                            className="h-9 pl-9 text-xs rounded-lg"
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-border text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClientId("none")
                            setIsClientDropdownOpen(false)
                            setClientSearch("")
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left font-semibold text-foreground transition-colors hover:bg-muted"
                        >
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Client de passage</span>
                        </button>
                        {filteredClients.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedClientId(c.id)
                              setIsClientDropdownOpen(false)
                              setClientSearch("")
                            }}
                            className="flex w-full flex-col px-4 py-2.5 text-left font-semibold text-foreground transition-colors hover:bg-muted"
                          >
                            <span>{c.name}</span>
                            {c.phone && (
                              <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">{c.phone}</span>
                            )}
                          </button>
                        ))}
                        {filteredClients.length === 0 && clientSearch && (
                          <div className="px-4 py-2.5 text-center text-[11px] italic text-muted-foreground">
                            Aucun client correspondant
                          </div>
                        )}
                      </div>
                      <SearchListAddFooter entity="client" returnTo="/pos" />
                    </div>
                  )}

                  {isClientDropdownOpen && (
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsClientDropdownOpen(false)}
                    />
                  )}
                </div>

                {/* Cart Items List Area */}
                <ScrollArea className="h-[280px] p-2">
                  {cart.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center gap-3">
                      <div className="bg-secondary/40 p-3.5 rounded-full text-muted-foreground/30">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <p className="text-muted-foreground text-xs font-medium italic">Le panier est vide.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.productId} className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3 transition-shadow hover:shadow-sm">
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="truncate text-xs font-bold leading-tight text-foreground">
                              {item.name}
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Prix
                                </span>
                                <Input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    handlePriceEdit(item.productId, Number(e.target.value))
                                  }
                                  className="h-6 w-20 rounded border border-input bg-background px-1.5 text-right text-[10px] font-semibold focus-visible:ring-primary/20"
                                />
                              </div>
                              <span className="text-[10px] font-bold text-primary">
                                {formatAmount(item.total, "FCFA")}
                              </span>
                            </div>
                          </div>

                          {/* Quantity adjustments and actions */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-muted/50 p-1 border rounded-lg">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 bg-background rounded hover:bg-secondary transition-colors" 
                                onClick={() => updateQty(item.productId, -1)}
                              >
                                <Minus className="h-3 w-3 text-muted-foreground" />
                              </Button>
                              <span className="text-xs font-extrabold w-5 text-center text-foreground">{item.quantity}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 bg-background rounded hover:bg-secondary transition-colors" 
                                onClick={() => updateQty(item.productId, 1)}
                              >
                                <Plus className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors rounded-lg flex-shrink-0" 
                              onClick={() => updateQty(item.productId, -item.quantity)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </div>

            {/* Totals Section & Checkout Cash-out */}
            <div className="p-5 bg-muted/30 border-t border-border space-y-5">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="text-foreground">{formatAmount(subtotal, "FCFA")}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Percent className="w-3.5 h-3.5" />
                    <span>Remise globale</span>
                  </div>
                  <div className="relative">
                    <Input 
                      type="number" 
                      className="w-24 h-8 text-right px-2 rounded-lg border border-input bg-background font-bold text-xs" 
                      value={discount} 
                      onChange={(e) => setDiscount(Number(e.target.value))} 
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="font-extrabold text-[10px] uppercase tracking-wider text-muted-foreground">
                    Net à encaisser
                  </span>
                  <span className="text-xl font-black text-primary font-headline tracking-tight">
                    {formatAmount(total, "FCFA")}
                  </span>
                </div>
              </div>

              {/* Cash-out checkout logic */}
              <Button
                onClick={handleOpenPayment}
                className="h-11 w-full rounded-xl text-sm font-bold shadow-sm transition-all duration-200 hover:shadow active:scale-[0.98]"
                disabled={cart.length === 0 || !cashSession}
              >
                {cart.length === 0
                  ? "Panier vide"
                  : !cashSession
                    ? "Caisse fermée"
                    : `Encaisser ${formatAmount(total, "FCFA")}`}
              </Button>

              <PaymentDialog
                open={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                total={total}
                selectedClientId={selectedClientId}
                selectedClientName={selectedClientName}
                selectedClient={selectedClient}
                processing={processing}
                onConfirm={handleCheckout}
              />

              <div className="pt-0.5">
                <Button 
                  variant="link" 
                  className="w-full text-xs text-muted-foreground h-auto p-0 flex items-center justify-center gap-1.5 font-bold hover:text-primary transition-colors" 
                  onClick={() => lastSale && PrintService.generateThermalTicket(lastSale, activeStore!)}
                >
                  <Printer className="h-4 w-4 text-muted-foreground" /> 
                  <span>Ticket thermique de la dernière vente</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-sm overflow-hidden rounded-2xl border p-0 text-center shadow-lg">
          <div className="p-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-lg font-bold">Vente enregistrée</DialogTitle>
            <DialogDescription className="mt-2 text-xs">
              Transaction validée. Stock et caisse mis à jour.
            </DialogDescription>
            {lastSale && (
              <p className="mt-3 font-mono text-sm font-bold text-primary">
                #{lastSale.id.slice(-6).toUpperCase()} - {formatAmount(lastSale.total, "FCFA")}
              </p>
            )}
          </div>
          <div className="space-y-2 border-t bg-muted/20 p-4">
            <Button
              onClick={() => lastSale && PrintService.generateThermalTicket(lastSale, activeStore!)}
              className="w-full rounded-xl font-semibold"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimer le ticket
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl font-semibold"
              onClick={() => setIsSuccessOpen(false)}
            >
              Nouvelle vente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
