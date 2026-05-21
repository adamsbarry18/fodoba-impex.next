
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PurchaseService } from "@/services/purchase.service"
import { Purchase } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Loader2, 
  Truck, 
  CheckCircle2, 
  Package, 
  Calendar,
  User,
  Printer,
  FileText,
  AlertTriangle,
  Info
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useAuth } from "@/lib/contexts/AuthContext"

export default function PurchaseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { userProfile } = useAuth()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const loadPurchase = async () => {
    try {
      const data = await PurchaseService.getPurchase(params.id as string)
      if (data) {
        setPurchase(data)
      } else {
        toast.error("Commande introuvable")
        router.push("/purchases")
      }
    } catch (error) {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPurchase()
  }, [params.id])

  const handleReception = async () => {
    if (!purchase || !userProfile) return
    if (!confirm("Voulez-vous confirmer la réception totale de cette marchandise ? Cela mettra à jour vos stocks et recalculera les coûts de revient.")) return

    setProcessing(true)
    try {
      await PurchaseService.validateReception(purchase.id, userProfile)
      toast.success("Marchandises réceptionnées avec succès")
      loadPurchase()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la réception")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
  if (!purchase) return null

  const isReceived = purchase.status === "RECEIVED"

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/purchases">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Commande #{purchase.id.slice(-6).toUpperCase()}</h1>
            <p className="text-muted-foreground">Approvisionnement : {purchase.supplierName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" /> Bon de commande
          </Button>
          {!isReceived && (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleReception} disabled={processing}>
              {processing ? <Loader2 className="animate-spin mr-2" /> : <Package className="mr-2" />}
              Valider la Réception
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Liste des articles</CardTitle>
            <CardDescription>Produits inclus dans cette expédition.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                {purchase.items.map((item, idx) => {
                  const landedCostUnit = (item.quantity * item.unitCost * item.exchangeRate + (purchase.expensesTotalFCFA * ((item.quantity * item.unitCost * item.exchangeRate) / purchase.subtotalFCFA))) / item.quantity;
                  
                  return (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg bg-muted/5">
                      <div className="space-y-1">
                        <p className="font-bold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} unités à {item.unitCost.toLocaleString()} {item.currency} 
                          {item.currency !== "FCFA" && ` (Taux: ${item.exchangeRate})`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-headline font-bold">{(item.quantity * item.unitCost * item.exchangeRate).toLocaleString()} FCFA</p>
                        {isReceived && (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">
                             Revient unit: {Math.round(landedCostUnit).toLocaleString()} FCFA
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
             </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statut & Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Statut actuel</span>
                <Badge variant={isReceived ? "default" : "outline"} className={isReceived ? "bg-emerald-100 text-emerald-700" : ""}>
                  {purchase.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Date création</span>
                <span>{format(purchase.timestamp.toDate(), "dd/MM/yyyy")}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Créé par</span>
                <span className="font-medium">{purchase.performedByName}</span>
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sous-total items</span>
                  <span>{purchase.subtotalFCFA.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-sm text-destructive">
                  <span>Frais annexes</span>
                  <span>+{purchase.expensesTotalFCFA.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>TOTAL FINAL</span>
                  <span>{purchase.totalFCFA.toLocaleString()} FCFA</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {isReceived && (
            <Card className="bg-emerald-50 border-emerald-200">
               <CardContent className="p-4 flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-800 space-y-1">
                    <p className="font-bold">Stock mis à jour !</p>
                    <p>Les produits ont été injectés dans l'inventaire de <strong>{purchase.storeName}</strong>.</p>
                    <p>Le prix moyen pondéré (PMP) a été recalculé pour tous les articles de cette commande.</p>
                  </div>
               </CardContent>
            </Card>
          )}

          {purchase.notes && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs uppercase text-muted-foreground">Notes de commande</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm">
                {purchase.notes}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
