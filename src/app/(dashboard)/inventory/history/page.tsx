
"use client"

import { useState, useEffect } from "react"
import { InventoryService } from "@/services/inventory.service"
import { StockMovement } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  History, 
  Loader2, 
  ArrowDownToLine,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ArrowRightLeft,
  ClipboardCheck,
  PackageSearch
} from "lucide-react"
import { useStore } from "@/lib/contexts/StoreContext"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const MOVEMENT_ICONS = {
  PURCHASE: <ArrowDownLeft className="h-4 w-4 text-emerald-500" />,
  SALE: <ArrowUpRight className="h-4 w-4 text-orange-500" />,
  TRANSFER_IN: <ArrowRightLeft className="h-4 w-4 text-blue-500" />,
  TRANSFER_OUT: <ArrowRightLeft className="h-4 w-4 text-blue-500" />,
  RETURN: <RefreshCw className="h-4 w-4 text-purple-500" />,
  CORRECTION: <ClipboardCheck className="h-4 w-4 text-slate-500" />
}

const MOVEMENT_LABELS = {
  PURCHASE: "Achat / Entrée",
  SALE: "Vente",
  TRANSFER_IN: "Transfert (Entrée)",
  TRANSFER_OUT: "Transfert (Sortie)",
  RETURN: "Retour Client",
  CORRECTION: "Correction Inventaire"
}

export default function StockHistoryPage() {
  const { activeStore } = useStore()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)

  const loadMovements = async (loadMore = false) => {
    if (!activeStore) return
    setLoading(true)
    try {
      const result = await InventoryService.listMovements(
        { storeId: activeStore.id }, 
        20, 
        loadMore ? lastDoc : undefined
      )
      
      if (loadMore) {
        setMovements(prev => [...prev, ...result.movements])
      } else {
        setMovements(result.movements)
      }
      
      setLastDoc(result.lastVisible)
      setHasMore(result.movements.length === 20)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMovements()
  }, [activeStore])

  const formatDate = (ts: any) => {
    if (!ts) return "-"
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    return format(date, "dd MMM yyyy HH:mm", { locale: fr })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historique des Flux</h1>
          <p className="text-muted-foreground">Traçabilité complète des mouvements de stock pour <strong>{activeStore?.name}</strong>.</p>
        </div>
        <Button variant="outline">
          <ArrowDownToLine className="w-4 h-4 mr-2" /> Export PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-accent" />
            Journal d'Audit Stock
          </CardTitle>
          <CardDescription>Tous les changements de quantités sont historisés ici.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Variation</TableHead>
                <TableHead className="text-center">Stock Final</TableHead>
                <TableHead>Auteur / Motif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <PackageSearch className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    Aucun mouvement enregistré pour cette boutique.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((move) => (
                  <TableRow key={move.id}>
                    <TableCell className="text-xs font-medium">
                      {formatDate(move.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">{move.productName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {MOVEMENT_ICONS[move.type]}
                        <span className="text-xs">{MOVEMENT_LABELS[move.type]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={move.delta > 0 ? "outline" : "secondary"} className={move.delta > 0 ? "border-emerald-500 text-emerald-600" : ""}>
                        {move.delta > 0 ? `+${move.delta}` : move.delta}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {move.newStock}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium">{move.performedByName}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{move.reason}</div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button variant="ghost" onClick={() => loadMovements(true)} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Charger plus..."}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
