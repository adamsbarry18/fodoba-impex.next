
"use client"

import { useState, useEffect } from "react"
import { PurchaseService } from "@/services/purchase.service"
import { Purchase } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Plus, 
  Loader2, 
  Truck, 
  ChevronRight, 
  Calendar,
  User,
  BadgeAlert,
  CheckCircle2,
  Clock
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useStore } from "@/lib/contexts/StoreContext"

const STATUS_CONFIG = {
  DRAFT: { label: "Brouillon", color: "bg-slate-100 text-slate-700", icon: <Clock className="w-3 h-3 mr-1" /> },
  ORDERED: { label: "Commandé", color: "bg-blue-100 text-blue-700", icon: <Truck className="w-3 h-3 mr-1" /> },
  RECEIVED: { label: "Reçu", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3 mr-1" /> },
  CANCELLED: { label: "Annulé", color: "bg-destructive/10 text-destructive", icon: <BadgeAlert className="w-3 h-3 mr-1" /> },
}

export default function PurchasesPage() {
  const { activeStore } = useStore()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  const loadPurchases = async () => {
    if (!activeStore) return
    setLoading(true)
    try {
      const data = await PurchaseService.listPurchases({ storeId: activeStore.id })
      setPurchases(data.purchases)
    } catch (error) {
      toast.error("Erreur lors du chargement des achats")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPurchases()
  }, [activeStore])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Gestion des Achats</h1>
          <p className="text-muted-foreground">Commandes fournisseurs et approvisionnement pour <strong>{activeStore?.name}</strong>.</p>
        </div>
        <Button asChild>
          <Link href="/purchases/new">
            <Plus className="w-4 h-4 mr-2" /> Nouvel Achat
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence / Date</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead className="text-right">Total (FCFA)</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Aucun achat enregistré.
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases.map((p) => (
                    <TableRow key={p.id} className="group">
                      <TableCell>
                        <div className="font-bold">#{p.id.slice(-6).toUpperCase()}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center">
                          <Calendar className="w-2.5 h-2.5 mr-1" /> 
                          {format(p.timestamp.toDate(), "dd MMM yyyy", { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{p.supplierName}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center">
                          <User className="w-2.5 h-2.5 mr-1" /> {p.performedByName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {p.items.length} produit(s)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-headline font-bold text-foreground">
                          {p.totalFCFA.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`font-medium border-none ${STATUS_CONFIG[p.status].color}`}>
                          {STATUS_CONFIG[p.status].icon}
                          {STATUS_CONFIG[p.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/purchases/${p.id}`}>
                            <ChevronRight className="h-4 h-4 text-muted-foreground" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
