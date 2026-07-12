
"use client"

import { useEffect, useState } from "react"
import { SupplierService } from "@/services/supplier.service"
import { Supplier } from "@/lib/types"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Edit, 
  Loader2, 
  Truck, 
  MapPin, 
  Globe,
  History,
  Wallet,
  FileText,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function SupplierDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("history")

  const loadSupplier = async () => {
    try {
      const data = await SupplierService.getSupplier(params.id as string)
      if (data) {
        setSupplier(data)
      } else {
        toast.error("Fournisseur introuvable")
        router.push("/suppliers")
      }
    } catch (error) {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSupplier()
  }, [params.id])

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "payments" || tab === "statement" || tab === "history") {
      setActiveTab(tab)
    }
  }, [searchParams])

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent" /></div>
  if (!supplier) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{supplier.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center capitalize"><Globe className="w-3 h-3 mr-1" /> {supplier.type}</span>
              <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {supplier.country}{supplier.city && `, ${supplier.city}`}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/suppliers/${supplier.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" /> Modifier le profil
            </Link>
          </Button>
          <Button>
            <Truck className="w-4 h-4 mr-2" /> Enregistrer un Achat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-muted/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Encours Total</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={`text-2xl font-headline font-bold ${supplier.currentDebt > 0 ? "text-destructive" : "text-emerald-600"}`}>
              {supplier.currentDebt.toLocaleString()} FCFA
            </div>
            {supplier.currentDebt > 0 && (
              <p className="text-[10px] text-destructive mt-1 flex items-center font-bold">
                <AlertCircle className="w-3 h-3 mr-1" /> PAIEMENT EN ATTENTE
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Conditions de Paiement</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg font-medium">{supplier.paymentTerms || "Non défini"}</div>
            <div className="text-[10px] text-muted-foreground mt-1">Devise habituelle: {supplier.defaultCurrency}</div>
          </CardContent>
        </Card>

        <Card className="bg-muted/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Dernier approvisionnement</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg font-medium text-muted-foreground italic">Aucun achat enregistré</div>
            <div className="text-[10px] text-muted-foreground mt-1">Module achats en attente</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" /> Historique Achats
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Paiements Fournisseur
          </TabsTrigger>
          <TabsTrigger value="statement" className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Relevé de Compte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Journal des Entrées</CardTitle>
              <CardDescription>Liste des commandes et réceptions validées pour ce fournisseur.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Le module complet des achats et commandes est requis pour afficher l'historique détaillé.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Règlements Effectués</CardTitle>
              <CardDescription>Historique des virements et paiements pour solde de dettes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Aucun paiement enregistré.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grand Livre Fournisseur</CardTitle>
              <CardDescription>Analyse consolidée des flux financiers FODOBA IMPEX.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 p-8 rounded-xl border border-dashed text-center">
                 <p className="text-muted-foreground">Solde certifié au {format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                 <div className="text-5xl font-headline font-bold mt-4 text-foreground">
                    {supplier.currentDebt.toLocaleString()} <span className="text-2xl text-muted-foreground">FCFA</span>
                 </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
