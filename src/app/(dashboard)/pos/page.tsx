"use client"

import { useState, useEffect, useMemo } from "react"
import { ProductService } from "@/services/product.service"
import { ClientService } from "@/services/client.service"
import { SaleService } from "@/services/sale.service"
import { PrintService } from "@/services/print.service"
import { Product, Client, SaleItem, Sale } from "@/lib/types"
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
  ChevronDown
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DocumentSnapshot } from "firebase/firestore"

export default function POSPage() {
  const { activeStore } = useStore()
  const { userProfile } = useAuth()
  
  // Product Data & Pagination
  const [products, setProducts] = useState<Product[]>([])
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | undefined>()
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<SaleItem[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>("none")
  const [discount, setDiscount] = useState<number>(0)
  
  // Success states
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)

  // Payment State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({
    CASH: "", ORANGE_MONEY: "", MOBILE_MONEY: "", CARD: "", TRANSFER: ""
  })

  // Initial Load
  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true)
      try {
        const [prodResult, clientResult] = await Promise.all([
          ProductService.listProducts({ active: true }, 24),
          ClientService.listClients()
        ])
        setProducts(prodResult.products)
        setLastVisible(prodResult.lastVisible)
        setHasMore(prodResult.products.length === 24)
        setClients(clientResult)
      } catch (error) {
        toast.error("Erreur de chargement")
      } finally {
        setLoading(false)
      }
    }
    loadInitial()
  }, [])

  // Load more for thousands of products
  const loadMoreProducts = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const result = await ProductService.listProducts({ active: true }, 24, lastVisible)
      setProducts(prev => [...prev, ...result.products])
      setLastVisible(result.lastVisible)
      setHasMore(result.products.length === 24)
    } catch (error) {
      toast.error("Erreur lors du chargement supplémentaire")
    } finally {
      setLoadingMore(false)
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
    toast.success(`${product.name} ajouté`, { duration: 1000, position: 'bottom-center' })
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
      setDiscount(0)
      setPaymentAmounts({ CASH: "", ORANGE_MONEY: "", MOBILE_MONEY: "", CARD: "", TRANSFER: "" })
      setIsPaymentOpen(false)
      setIsSuccessOpen(true)
    } catch (error: any) {
      toast.error(error.message || "Erreur de validation")
    } finally {
      setProcessing(false)
    }
  }

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm)
    )
  }, [products, searchTerm])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground font-medium">Chargement du catalogue...</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Search & Products */}
        <div className="md:col-span-8 space-y-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher (Nom, SKU, Code-barres)..." 
                className="pl-9 h-10 rounded-xl border bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border bg-background hover:bg-secondary transition-colors">
              <ScanLine className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all shadow-sm border bg-card rounded-2xl overflow-hidden group"
                onClick={() => addToCart(product)}
              >
                <div className="p-6 space-y-4">
                  <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground border-none font-semibold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                    {product.unit}
                  </Badge>
                  <p className="font-semibold text-sm leading-tight line-clamp-2 min-h-[40px] text-foreground">
                    {product.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-primary font-bold text-lg font-headline">
                      {product.sellingPriceFCFA.toLocaleString()} <span className="text-[10px] font-medium text-muted-foreground ml-1">FCFA</span>
                    </div>
                    <div className="bg-primary/10 p-1.5 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {hasMore && !searchTerm && (
            <div className="flex justify-center py-8">
              <Button 
                variant="ghost" 
                onClick={loadMoreProducts} 
                disabled={loadingMore}
                className="text-gray-400 font-bold text-[13px] hover:text-primary transition-colors"
              >
                {loadingMore ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                Charger plus de produits
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Panier */}
        <div className="md:col-span-4">
          <Card className="border bg-card shadow-sm sticky top-6 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border p-6 pb-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="bg-secondary p-2 rounded-xl text-muted-foreground">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-bold text-foreground">Panier</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold rounded-full px-2.5 py-0.5 text-[11px]">
                {cart.length} articles
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {/* Client Selection */}
              <div className="p-6 border-b border-border space-y-2">
                <Label className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider ml-1">CLIENT</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="h-10 rounded-xl border border-input bg-background text-sm font-medium px-4">
                    <SelectValue placeholder="Client de passage" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border shadow-md bg-popover text-popover-foreground">
                    <SelectItem value="none" className="font-medium">Client de passage</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id} className="font-medium">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cart Items */}
              <ScrollArea className="h-[320px]">
                {cart.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center gap-3">
                    <div className="bg-secondary/50 p-4 rounded-full text-muted-foreground/30">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                    <p className="text-muted-foreground text-[13px] font-medium italic">Le panier est vide.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {cart.map((item) => (
                      <div key={item.productId} className="p-4 px-6 flex items-center justify-between gap-4 group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-snug">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.unitPrice.toLocaleString()} FCFA / unit.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 border border-input bg-background rounded-lg hover:bg-secondary transition-colors" 
                            onClick={() => updateQty(item.productId, -1)}
                          >
                            <Minus className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          <span className="text-sm font-bold w-6 text-center text-foreground">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 border border-input bg-background rounded-lg hover:bg-secondary transition-colors" 
                            onClick={() => updateQty(item.productId, 1)}
                          >
                            <Plus className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors rounded-lg" 
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

              {/* Totals & Checkout */}
              <div className="p-6 bg-muted/30 border-t border-border space-y-6">
                <div className="space-y-3.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Sous-total</span>
                    <span className="font-semibold text-foreground">{subtotal.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Remise</span>
                    <Input 
                      type="number" 
                      className="w-24 h-9 text-right px-3 rounded-lg border border-input bg-background font-semibold text-sm" 
                      value={discount} 
                      onChange={(e) => setDiscount(Number(e.target.value))} 
                    />
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">TOTAL</span>
                    <span className="text-2xl font-bold text-primary font-headline tracking-tight">{total.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                  <Button 
                    onClick={() => setIsPaymentOpen(true)}
                    className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98]" 
                    disabled={cart.length === 0}
                  >
                    Encaisser
                  </Button>
                  <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border bg-background shadow-lg">
                    <DialogHeader className="p-6 bg-muted/30 border-b border-border">
                      <DialogTitle className="text-lg font-semibold text-foreground">Règlement final</DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">Saisissez les montants perçus par mode de paiement.</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                      <div className="bg-primary/5 p-4 rounded-xl flex items-center justify-between border border-primary/10">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Net à payer</span>
                        <span className="text-2xl font-bold text-primary font-headline">{total.toLocaleString()} FCFA</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {['CASH', 'ORANGE_MONEY', 'MOBILE_MONEY', 'CARD', 'TRANSFER'].map((method) => (
                          <div key={method} className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider ml-1">{method.replace('_', ' ')}</Label>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="h-10 border border-input bg-background rounded-lg font-semibold text-foreground focus:ring-1 focus:ring-primary/20 text-sm"
                              value={paymentAmounts[method]}
                              onChange={(e) => setPaymentAmounts(prev => ({ ...prev, [method]: e.target.value }))}
                            />
                          </div>
                        ))}
                      </div>
                      {change > 0 && (
                        <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 flex justify-between items-center text-amber-600 dark:text-amber-500 text-sm font-medium">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Monnaie à rendre</span>
                          <span className="text-xl font-bold font-headline">-{change.toLocaleString()} FCFA</span>
                        </div>
                      )}
                    </div>
                    <DialogFooter className="p-6 bg-muted/30 border-t border-border flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={() => setIsPaymentOpen(false)} className="h-10 rounded-xl flex-1 font-medium">Annuler</Button>
                      <Button 
                        className="bg-primary hover:bg-primary/90 h-10 rounded-xl flex-1 font-semibold text-white" 
                        disabled={processing || (debtAmount > 0 && selectedClientId === "none") || (totalPaid === 0 && total > 0)}
                        onClick={handleCheckout}
                      >
                        {processing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Valider la vente
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="pt-1">
                  <Button 
                    variant="link" 
                    className="w-full text-xs text-muted-foreground h-auto p-0 flex items-center justify-center gap-2 font-medium hover:text-primary transition-colors" 
                    onClick={() => lastSale && PrintService.generateThermalTicket(lastSale, activeStore!)}
                  >
                    <Printer className="h-4 w-4" /> Aperçu ticket thermique
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-sm text-center p-6 rounded-2xl border bg-background shadow-lg">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold text-foreground">Vente réussie !</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">La transaction a été enregistrée avec succès dans le réseau FODOBA.</DialogDescription>
          <div className="mt-6 space-y-2">
            <Button onClick={() => lastSale && PrintService.generateThermalTicket(lastSale, activeStore!)} className="w-full h-10 bg-primary text-white font-semibold rounded-xl shadow-sm hover:bg-primary/90">
              <Printer className="mr-2 h-4 w-4" /> Imprimer le ticket
            </Button>
            <Button variant="ghost" className="w-full h-10 text-muted-foreground hover:text-foreground font-medium rounded-xl hover:bg-secondary transition-colors" onClick={() => setIsSuccessOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
