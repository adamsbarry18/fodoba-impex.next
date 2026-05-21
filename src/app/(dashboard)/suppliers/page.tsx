
"use client"

import { useState, useEffect } from "react"
import { SupplierService } from "@/services/supplier.service"
import { Supplier } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
  Search, 
  Loader2, 
  Truck, 
  Globe, 
  MapPin, 
  ChevronRight,
  MoreVertical,
  Banknote
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const loadSuppliers = async () => {
    setLoading(true)
    try {
      const data = await SupplierService.listSuppliers()
      setSuppliers(data)
    } catch (error) {
      toast.error("Erreur de chargement des fournisseurs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.country.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestion Fournisseurs</h1>
          <p className="text-muted-foreground">Base globale des partenaires d'approvisionnement FODOBA IMPEX.</p>
        </div>
        <Button asChild>
          <Link href="/suppliers/new">
            <Plus className="w-4 h-4 mr-2" /> Nouveau Fournisseur
          </Link>
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher par nom ou pays..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Devise</TableHead>
                  <TableHead className="text-right">Dette (Encours)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Aucun fournisseur trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="group">
                      <TableCell>
                        <div className="font-bold text-foreground">{supplier.name}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center">
                          <Truck className="w-2.5 h-2.5 mr-1" /> {supplier.paymentTerms || "Paiement comptant"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-foreground">
                          <MapPin className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                          {supplier.city && `${supplier.city}, `}{supplier.country}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.type === "import" ? "secondary" : "outline"} className="capitalize">
                          {supplier.type === "import" && <Globe className="w-3 h-3 mr-1" />}
                          {supplier.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {supplier.defaultCurrency}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-headline font-bold ${supplier.currentDebt > 0 ? "text-destructive" : "text-emerald-600"}`}>
                          {supplier.currentDebt.toLocaleString()} FCFA
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/suppliers/${supplier.id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/suppliers/${supplier.id}/edit`}>Modifier le profil</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Supprimer (si sans historique)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
