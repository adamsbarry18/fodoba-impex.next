"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { ProductService } from "@/services/product.service"
import { ClientService } from "@/services/client.service"
import { SaleService } from "@/services/sale.service"
import { PrintService } from "@/services/print.service"
import { CategoryService } from "@/services/category.service"
import { Product, Client, SaleItem, Sale, Category } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ScanLine,
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
  Sparkles,
  Tag,
  Store,
  Clock,
  X
} from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/lib/contexts/StoreContext"
import { useAuth } from "@/lib/contexts/AuthContext"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function POSPage() {
  const { activeStore } = useStore()
  const { userProfile } = useAuth()
  
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
  
  // Barcode Scanner simulation states
  const [scannerInput, setScannerInput] = useState("")
  const [isScannerFocused, setIsScannerFocused] = useState(false)
  
  // Success states
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)

  // Payment State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({
    CASH: "", ORANGE_MONEY: "", MOBILE_MONEY: "", CARD: "", TRANSFER: ""
  })

  // Keyboard shortcut listener for Scanner Focus [F2]
  const scannerInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault()
        scannerInputRef.current?.focus()
        toast.info("Prêt pour la simulation de scan code-barres !")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Initial Load (Categories and initial clients/products)
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
      } catch (error) {
        toast.error("Erreur lors du chargement des données initiales")
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

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

  // Barcode Scanner Simulator
  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault()
    const inputVal = scannerInput.trim()
    if (!inputVal) return
    
    try {
      const searchResults = await ProductService.searchProducts(inputVal)
      if (searchResults.length > 0) {
        const product = searchResults[0]
        addToCart(product)
        setScannerInput("")
        toast.success(`${product.name} scanné !`, { duration: 1500, position: 'bottom-center' })
      } else {
        toast.error(`Aucun produit trouvé pour le code : "${inputVal}"`)
      }
    } catch (error) {
      toast.error("Erreur lors du scan du code-barres")
    }
  }

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

  const subtotal = cart.reduce((acc, item) => acc + item.total, 0)
  const total = Math.max(subtotal - discount, 0)
  const totalPaid = Object.values(paymentAmounts).reduce((acc, val) => acc + (Number(val) || 0), 0)
  const change = totalPaid > total ? totalPaid - total : 0
  const debtAmount = totalPaid < total ? total - totalPaid : 0

  const handleCheckout = async () => {
    if (!activeStore || !userProfile || cart.length === 0) return
    if (debtAmount > 0 && (!selectedClientId || selectedClientId === "none")) {
      toast.error("Sélectionnez un client pour une vente à crédit.")
      return
    }

    setProcessing(true)
    try {
      const finalPayments = Object.entries(paymentAmounts)
        .filter(([_, amount]) => Number(amount) > 0)
        .map(([method, amount]) => ({ method, amount: Number(amount) }))

      const sale = await SaleService.processSale({
        store: activeStore,
        user: userProfile,
        items: cart,
        clientId: selectedClientId !== "none" ? selectedClientId : undefined,
        payments: finalPayments as any,
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
      setPaymentAmounts({ CASH: "", ORANGE_MONEY: "", MOBILE_MONEY: "", CARD: "", TRANSFER: "" })
      setIsPaymentOpen(false)
      setIsSuccessOpen(true)
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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto px-4 py-1">
      {/* POS Top Activity & Simulation Info Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border border-border bg-card rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-foreground flex items-center gap-2">
              Point de Vente 
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-primary border-primary/20 bg-primary/5">
                {activeStore?.name || "Boutique Active"}
              </Badge>
            </h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5 font-medium">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              Caissier : {userProfile?.prenom} {userProfile?.nom}
            </p>
          </div>
        </div>

        {/* Keyboard and Shortcut tips */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted text-muted-foreground border border-border">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">F2</kbd> pour scanner</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Mode Émulateur Code-Barres Actif</span>
          </div>
        </div>
      </div>

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

            {/* simulated Scanner Input box */}
            <form onSubmit={handleBarcodeScan} className="relative flex-1">
              <ScanLine className={cn(
                "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                isScannerFocused ? "text-primary animate-pulse" : "text-muted-foreground"
              )} />
              <Input 
                ref={scannerInputRef}
                placeholder="Scanner Code-barres [F2] + Entrée..." 
                className={cn(
                  "pl-10 h-10 w-full bg-background border-border rounded-xl text-xs transition-all duration-200 font-semibold focus-visible:ring-primary/20",
                  isScannerFocused && "border-primary/50 shadow-sm"
                )}
                value={scannerInput}
                onChange={(e) => setScannerInput(e.target.value)}
                onFocus={() => setIsScannerFocused(true)}
                onBlur={() => setIsScannerFocused(false)}
              />
              <Button type="submit" className="hidden" />
            </form>

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
                              {product.sellingPriceFCFA.toLocaleString()} <span className="text-[9px] font-bold text-muted-foreground ml-0.5">FCFA</span>
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
                            <td className="py-2.5 px-5"><Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 rounded">{product.unit}</Badge></td>
                            <td className="py-2.5 px-5 text-right font-bold text-foreground">{product.sellingPriceFCFA.toLocaleString()}</td>
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
                  {cart.reduce((sum, i) => sum + i.quantity, 0)} articles
                </Badge>
              </CardHeader>

              <CardContent className="p-0">
                {/* Autocomplete Customer Search & Selection */}
                <div className="p-5 border-b border-border space-y-1.5 relative">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider ml-1">
                    Client Facturation
                  </Label>
                  
                  {selectedClientId === "none" ? (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Rechercher un client (Nom, Tel)..."
                        className="pl-10 h-10 text-xs border border-input rounded-xl bg-background focus-visible:ring-primary/20 font-medium"
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value)
                          setIsClientDropdownOpen(true)
                        }}
                        onFocus={() => setIsClientDropdownOpen(true)}
                      />
                      
                      {/* Floating Autocomplete Dropdown */}
                      {isClientDropdownOpen && (
                        <div className="absolute z-20 w-full mt-1.5 bg-popover border border-border shadow-lg rounded-xl overflow-hidden text-xs max-h-48 overflow-y-auto divide-y divide-border">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClientId("none")
                              setIsClientDropdownOpen(false)
                              setClientSearch("")
                            }}
                            className="w-full text-left px-4 py-2.5 font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                          >
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Client de passage (Par défaut)</span>
                          </button>
                          
                          {filteredClients.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedClientId(c.id)
                                setIsClientDropdownOpen(false)
                                setClientSearch("")
                              }}
                              className="w-full text-left px-4 py-2.5 font-semibold text-foreground hover:bg-muted transition-colors flex flex-col"
                            >
                              <span className="text-foreground">{c.name}</span>
                              {c.phone && <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{c.phone}</span>}
                            </button>
                          ))}
                          {filteredClients.length === 0 && (
                            <div className="px-4 py-2.5 text-muted-foreground italic text-[11px] text-center">
                              Aucun client correspondant
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Customer Pill display once selected */
                    <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl p-2.5 text-xs font-semibold text-primary">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{selectedClientName}</span>
                      </div>
                      <button
                        onClick={() => setSelectedClientId("none")}
                        className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Backdrop closer for dropdown */}
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
                        <div key={item.productId} className="p-3 border border-border/60 bg-card rounded-xl flex items-center justify-between gap-3 group transition-shadow hover:shadow-sm">
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-xs font-bold text-foreground leading-tight truncate">{item.name}</p>
                            
                            {/* Inline Unit Price Override Input */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Prix :</span>
                              <div className="relative">
                                <Input 
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => handlePriceEdit(item.productId, Number(e.target.value))}
                                  className="w-20 h-6 px-1.5 text-right font-semibold text-[10px] border border-input rounded bg-background focus-visible:ring-primary/20"
                                />
                              </div>
                              <span className="text-[9px] text-muted-foreground">FCFA</span>
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
                  <span className="text-foreground">{subtotal.toLocaleString()} FCFA</span>
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
                  <span className="font-extrabold text-[10px] uppercase tracking-wider text-muted-foreground">NET À ENCAISSER</span>
                  <span className="text-xl font-black text-primary font-headline tracking-tight">{total.toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* Cash-out checkout logic */}
              <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <Button 
                  onClick={() => setIsPaymentOpen(true)}
                  className="w-full h-11 text-sm bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98]" 
                  disabled={cart.length === 0}
                >
                  Encaisser la commande
                </Button>
                
                <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border bg-background shadow-lg">
                  <DialogHeader className="p-6 bg-muted/30 border-b border-border">
                    <DialogTitle className="text-base font-extrabold text-foreground">Règlement de la vente</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1">
                      Configurez la ventilation des règlements par mode de paiement.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="p-6 space-y-5">
                    <div className="bg-primary/5 p-4 rounded-xl flex items-center justify-between border border-primary/15">
                      <span className="text-[10px] font-black text-primary uppercase tracking-wider">Montant total net</span>
                      <span className="text-xl font-extrabold text-primary font-headline">{total.toLocaleString()} FCFA</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {['CASH', 'ORANGE_MONEY', 'MOBILE_MONEY', 'CARD', 'TRANSFER'].map((method) => (
                        <div key={method} className="space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider ml-0.5">
                            {method.replace('_', ' ')}
                          </Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="h-9 border border-input bg-background rounded-lg font-bold text-foreground focus-visible:ring-primary/20 text-xs"
                            value={paymentAmounts[method]}
                            onChange={(e) => setPaymentAmounts(prev => ({ ...prev, [method]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Change calculator display banner */}
                    {change > 0 && (
                      <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex justify-between items-center text-amber-600 dark:text-amber-500 text-xs font-semibold">
                        <span className="text-[9px] font-bold uppercase tracking-wider">Rendu monnaie</span>
                        <span className="text-lg font-extrabold font-headline">-{change.toLocaleString()} FCFA</span>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="p-6 bg-muted/30 border-t border-border flex-row gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsPaymentOpen(false)} 
                      className="h-10 rounded-xl flex-1 font-bold text-xs"
                    >
                      Annuler
                    </Button>
                    <Button 
                      className="bg-primary hover:bg-primary/90 h-10 rounded-xl flex-1 font-bold text-xs text-white" 
                      disabled={processing || (debtAmount > 0 && selectedClientId === "none") || (totalPaid === 0 && total > 0)}
                      onClick={handleCheckout}
                    >
                      {processing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Valider la vente
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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

      {/* Modern Success Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-sm text-center p-6 rounded-2xl border bg-background shadow-lg">
          <div className="mx-auto bg-primary/10 p-3.5 rounded-full w-fit mb-4 text-primary animate-bounce">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">Vente enregistrée !</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1.5">
            La transaction a été validée avec succès sur les serveurs de FODOBA IMPEX.
          </DialogDescription>
          <div className="mt-5 space-y-2">
            <Button 
              onClick={() => lastSale && PrintService.generateThermalTicket(lastSale, activeStore!)} 
              className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm text-xs"
            >
              <Printer className="mr-2 h-4 w-4" /> Imprimer le ticket de caisse
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-10 text-muted-foreground hover:text-foreground font-semibold rounded-xl hover:bg-secondary transition-colors text-xs" 
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
