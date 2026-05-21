
"use client"

import { useState, useEffect } from "react"
import { ProductService } from "@/services/product.service"
import { SupplierService } from "@/services/supplier.service"
import { PurchaseService } from "@/services/purchase.service"
import { Product, Supplier, PurchaseItem, PurchaseExpense } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Calculator, 
  Loader2, 
  Truck, 
  Package, 
  AlertTriangle,
  Save,
  DollarSign
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useStore } from "@/lib/contexts/StoreContext"
import { useAuth } from "@/lib/contexts/AuthContext"

const CURRENCIES = ["FCFA", "GNF", "USD", "EUR"] as const;

export default function NewPurchasePage() {
  const router = useRouter()
  const { activeStore } = useStore()
  const { userProfile } = useAuth()
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [supplierId, setSupplierId] = useState("")
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [expenses, setExpenses] = useState<PurchaseExpense[]>([])
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const init = async () => {
      try {
        const [suppResult, prodResult] = await Promise.all([
          SupplierService.listSuppliers(),
          ProductService.listProducts({ active: true }, 200)
        ])
        setSuppliers(suppResult)
        setProducts(prodResult.products)
      } catch (error) {
        toast.error("Erreur de chargement des données")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const addItem = () => {
    setItems([...items, {
      productId: "",
      name: "",
      quantity: 1,
      unitCost: 0,
      currency: "FCFA",
      exchangeRate: 1
    }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items]
    if (field === 'productId') {
      const prod = products.find(p => p.id === value)
      newItems[index].productId = value
      newItems[index].name = prod?.name || ""
    } else {
      (newItems[index] as any)[field] = value
    }
    setItems(newItems)
  }

  const addExpense = () => {
    setExpenses([...expenses, { label: "", amount: 0, currency: "FCFA", exchangeRate: 1 }])
  }

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index))
  }

  const subtotalFCFA = items.reduce((acc, item) => acc + (item.quantity * item.unitCost * item.exchangeRate), 0)
  const expensesTotalFCFA = expenses.reduce((acc, exp) => acc + (exp.amount * exp.exchangeRate), 0)
  const totalFCFA = subtotalFCFA + expensesTotalFCFA

  const handleSubmit = async (status: "DRAFT" | "ORDERED") => {
    if (!activeStore || !userProfile) return
    if (!supplierId) return toast.error("Veuillez choisir un fournisseur")
    if (items.length === 0) return toast.error("Ajoutez au moins un article")
    if (items.some(i => !i.productId || i.quantity <= 0)) return toast.error("Détails d'articles invalides")

    setSubmitting(true)
    try {
      const supplier = suppliers.find(s => s.id === supplierId)
      await PurchaseService.createPurchase({
        supplierId,
        supplierName: supplier?.name || "Inconnu",
        storeId: activeStore.id,
        storeName: activeStore.name,
        items,
        expenses,
        subtotalFCFA,
        expensesTotalFCFA,
        totalFCFA,
        status,
        notes,
        performedBy: userProfile.uid,
        performedByName: `${userProfile.prenom} ${userProfile.nom}`
      })
      toast.success(status === "DRAFT" ? "Brouillon enregistré" : "Commande validée")
      router.push("/purchases")
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/purchases">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Nouvel Approvisionnement</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items & Expenses */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Articles commandés</CardTitle>
                <CardDescription>Liste des produits à réceptionner.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Ajouter un produit
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end border-b pb-4 last:border-0 last:pb-0">
                  <div className="col-span-5 space-y-1.5">
                    <Label className="text-xs">Produit</Label>
                    <Select value={item.productId} onValueChange={(v) => updateItem(index, 'productId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Quantité</Label>
                    <Input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Prix Unit.</Label>
                    <Input type="number" value={item.unitCost} onChange={(e) => updateItem(index, 'unitCost', Number(e.target.value))} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Devise / Taux</Label>
                    <div className="flex gap-1">
                       <Select value={item.currency} onValueChange={(v) => updateItem(index, 'currency', v)}>
                        <SelectTrigger className="w-20 px-2 h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input 
                        className="h-9 text-xs px-2" 
                        type="number" 
                        step="0.001" 
                        value={item.exchangeRate} 
                        onChange={(e) => updateItem(index, 'exchangeRate', Number(e.target.value))} 
                        disabled={item.currency === "FCFA"}
                      />
                    </div>
                  </div>
                  <div className="col-span-1 text-right">
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  Cliquez sur "Ajouter un produit" pour commencer.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Frais annexes (Logistique, Douane...)</CardTitle>
                <CardDescription>Frais impactant le coût de revient.</CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={addExpense}>
                <Plus className="w-4 h-4 mr-1" /> Ajouter un frais
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {expenses.map((exp, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Input placeholder="Libellé (ex: Transport)" value={exp.label} onChange={(e) => {
                      const newExp = [...expenses]; newExp[index].label = e.target.value; setExpenses(newExp);
                    }} />
                  </div>
                  <div className="w-32">
                    <Input type="number" placeholder="Montant" value={exp.amount} onChange={(e) => {
                      const newExp = [...expenses]; newExp[index].amount = Number(e.target.value); setExpenses(newExp);
                    }} />
                  </div>
                  <div className="w-24">
                     <Select value={exp.currency} onValueChange={(v: any) => {
                        const newExp = [...expenses]; newExp[index].currency = v; setExpenses(newExp);
                     }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeExpense(index)}>
                    <Trash2 className="h-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Totals & Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif Financier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Fournisseur</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le partenaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.country})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total Marchandises</span>
                  <span className="font-medium">{subtotalFCFA.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Frais Appro</span>
                  <span className="font-medium text-destructive">+{expensesTotalFCFA.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-xl font-bold font-headline pt-2 border-t text-accent">
                  <span>TOTAL ESTIMÉ</span>
                  <span>{totalFCFA.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-4">
                <Label>Notes internes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Livraison prévue lundi..." />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                className="w-full h-12 text-lg font-bold" 
                onClick={() => handleSubmit("ORDERED")}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="animate-spin mr-2" /> : <Truck className="mr-2" />}
                Valider la Commande
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => handleSubmit("DRAFT")}
                disabled={submitting}
              >
                <Save className="w-4 h-4 mr-2" /> Enregistrer Brouillon
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-4 h-4" /> Note Importante
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-amber-600 leading-relaxed">
              La validation de la commande n'incrémente pas encore les stocks. Vous devrez "Valider la Réception" une fois les marchandises livrées pour mettre à jour les inventaires et recalculer les PMP.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
