"use client"

import { useState, useEffect } from "react"
import { StoreService } from "@/services/store.service"
import { Store } from "@/lib/types"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Edit, 
  Power, 
  PowerOff, 
  Loader2,
  MapPin,
  Phone
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useStore } from "@/lib/contexts/StoreContext"

export default function StoresAdminPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const { refreshStores } = useStore()

  const loadStores = async () => {
    setLoading(true)
    try {
      const result = await StoreService.listStores(50)
      setStores(result.stores)
    } catch (error) {
      toast.error("Erreur lors du chargement des boutiques")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStores()
  }, [])

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await StoreService.toggleStoreStatus(id, !currentStatus)
      toast.success(`Boutique ${!currentStatus ? 'activée' : 'suspendue'}`)
      loadStores()
      refreshStores()
    } catch (error) {
      toast.error("Erreur lors du changement de statut")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Boutiques</h1>
          <p className="text-muted-foreground">Configurez et gérez vos points de vente FODOBA IMPEX.</p>
        </div>
        <Button asChild>
          <Link href="/admin/stores/new">
            <Plus className="w-4 h-4 mr-2" /> Nouvelle Boutique
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des points de vente</CardTitle>
          <CardDescription>Tous les magasins enregistrés dans le réseau global.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Désignation</TableHead>
                  <TableHead>Contact / Adresse</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucune boutique configurée.
                    </TableCell>
                  </TableRow>
                ) : (
                  stores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-mono font-bold text-accent">{store.code}</TableCell>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 mr-1" /> {store.address}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Phone className="w-3 h-3 mr-1" /> {store.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={store.active ? "outline" : "destructive"}>
                          {store.active ? "Active" : "Suspendue"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/stores/${store.id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={store.active ? "text-destructive" : "text-accent"}
                          onClick={() => handleToggleStatus(store.id, store.active)}
                        >
                          {store.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
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
