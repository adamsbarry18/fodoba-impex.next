
"use client"

import { useState, useEffect } from "react"
import { InventoryService } from "@/services/inventory.service"
import { ProductService } from "@/services/product.service"
import { StoreService } from "@/services/store.service"
import { Product, Store } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useStore } from "@/lib/contexts/StoreContext"
import { useAuth } from "@/lib/contexts/AuthContext"
import { ArrowLeft, Loader2, ArrowRightLeft, Package, Info } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewTransferPage() {
  const router = useRouter()
  const { activeStore } = useStore()
  const { userProfile } = useAuth()
  
  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [selectedProductId, setSelectedProductId] = useState("")
  const [destinationStoreId, setDestinationStoreId] = useState("")
  const [quantity, setQuantity] = useState<number>(0)
  const [reason, setReason] = useState("")
  const [currentStock, setCurrentStock] = useState<number>(0)

  useEffect(() => {
    const init = async () => {
      try {
        const [prodResult, storeResult] = await Promise.all([
          ProductService.listProducts(),
          StoreService.listStores(100)
        ])
        setProducts(prodResult.products)
        setStores(storeResult.stores.filter(s => s.active))
      } catch (error) {
        toast.error("Erreur de chargement des données")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    const fetchStock = async () => {
      if (selectedProductId && activeStore) {
        const qty = await ProductService.getStockLevel(selectedProductId, activeStore.id)
        setCurrentStock(qty)
      }
    }
    fetchStock()
  }, [selectedProductId, activeStore])

  const handleTransfer = async () => {
    if (!activeStore || !userProfile) return
    if (!selectedProductId) return toast.error("Veuillez choisir un produit")
    if (!destinationStoreId) return toast.error("Veuillez choisir une destination")
    if (quantity <= 0) return toast.error("Quantité invalide")
    if (quantity > currentStock) return toast.error("Stock insuffisant dans la boutique source")

    setSubmitting(true)
    try {
      await InventoryService.transferStock({
        productId: selectedProductId,
        fromStoreId: activeStore.id,
        toStoreId: destinationStoreId,
        quantity,
        user: userProfile,
        reason
      })
      toast.success("Transfert effectué avec succès")
      router.push("/inventory/history")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du transfert")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>

  const selectedProduct = products.find(p => p.id === selectedProductId)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inventory">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Nouveau Transfert</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-accent" />
            Déplacement de Marchandises
          </CardTitle>
          <CardDescription>
            Transférez du stock depuis <strong>{activeStore?.name}</strong> vers une autre succursale.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Produit à transférer</Label>
            <Select onValueChange={setSelectedProductId} value={selectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un article" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProductId && (
            <div className="bg-muted/30 p-4 rounded-lg flex items-center justify-between border border-dashed">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs uppercase font-bold text-muted-foreground">Disponible à {activeStore?.code}</p>
                  <p className="text-xl font-headline font-bold">{currentStock} {selectedProduct?.unit}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Boutique Destination</Label>
              <Select onValueChange={setDestinationStoreId} value={destinationStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir destination" />
                </SelectTrigger>
                <SelectContent>
                  {stores.filter(s => s.id !== activeStore?.id).map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantité à envoyer</Label>
              <Input 
                type="number" 
                min={1} 
                max={currentStock}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Motif du transfert (Optionnel)</Label>
            <Input 
              placeholder="Ex: Réapprovisionnement urgent, commande client..." 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 bg-muted/5 border-t p-6">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Cette opération est irréversible. Elle débitera immédiatement le stock de la boutique source et créditera celui de la destination.</p>
          </div>
          <Button 
            className="w-full h-12 text-lg font-bold" 
            onClick={handleTransfer}
            disabled={submitting || !selectedProductId || !destinationStoreId || quantity <= 0 || quantity > currentStock}
          >
            {submitting ? <Loader2 className="animate-spin mr-2" /> : <ArrowRightLeft className="mr-2" />}
            Confirmer le transfert
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
