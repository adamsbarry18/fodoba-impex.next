
"use client"

import { useState, useEffect } from "react"
import { ClientService } from "@/services/client.service"
import { Client } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Search, 
  UserPlus, 
  Loader2, 
  Phone, 
  MapPin, 
  CreditCard,
  ChevronRight,
  MoreVertical,
  UserCheck,
  AlertCircle
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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const loadClients = async () => {
    setLoading(true)
    try {
      const data = await ClientService.listClients()
      setClients(data)
    } catch (error) {
      toast.error("Erreur de chargement des clients")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portefeuille Clients</h1>
          <p className="text-muted-foreground">Base globale partagée FODOBA IMPEX.</p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <UserPlus className="w-4 h-4 mr-2" /> Nouveau Client
          </Link>
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher par nom ou téléphone..." 
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
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Dette Actuelle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Aucun client trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => {
                    const isOverLimit = client.currentDebt > client.creditCeiling && client.creditCeiling > 0;
                    
                    return (
                      <TableRow key={client.id} className="group">
                        <TableCell>
                          <div className="font-bold">{client.name}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center">
                            <MapPin className="w-2.5 h-2.5 mr-1" /> {client.address || "Non renseigné"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-2 text-muted-foreground" />
                            {client.phone}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          <Badge variant="outline">{client.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className={`font-headline font-bold ${client.currentDebt > 0 ? "text-destructive" : "text-emerald-600"}`}>
                              {client.currentDebt.toLocaleString()} FCFA
                            </span>
                            {client.creditCeiling > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                Limite: {client.creditCeiling.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={client.status === "suspendu" ? "destructive" : client.status === "vip" ? "secondary" : "default"}>
                            {client.status}
                          </Badge>
                          {isOverLimit && <AlertCircle className="w-4 h-4 text-destructive inline ml-1" title="Plafond dépassé" />}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/clients/${client.id}`}>
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
                                  <Link href={`/clients/${client.id}/edit`}>Modifier le profil</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/clients/${client.id}?tab=payments`}>Enregistrer un paiement</Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
