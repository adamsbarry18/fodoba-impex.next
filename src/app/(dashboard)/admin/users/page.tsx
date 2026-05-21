
"use client"

import { useState, useEffect } from "react"
import { UserService } from "@/services/user.service"
import { UserProfile } from "@/lib/types"
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
  UserPlus, 
  Edit, 
  UserX, 
  UserCheck, 
  Loader2,
  Mail,
  Shield,
  Store as StoreIcon
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/lib/contexts/AuthContext"

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const { userProfile: currentUser } = useAuth()

  const loadUsers = async () => {
    setLoading(true)
    try {
      const result = await UserService.listUsers(50)
      setUsers(result.users)
    } catch (error) {
      toast.error("Erreur lors du chargement des utilisateurs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleToggleStatus = async (uid: string, currentStatus: boolean) => {
    if (uid === currentUser?.uid) {
      toast.error("Vous ne pouvez pas suspendre votre propre compte.")
      return
    }
    
    try {
      await UserService.toggleUserStatus(uid, !currentStatus)
      toast.success(`Utilisateur ${!currentStatus ? 'activé' : 'suspendu'}`)
      loadUsers()
    } catch (error) {
      toast.error("Erreur lors du changement de statut")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contrôle d'Accès</h1>
          <p className="text-muted-foreground">Gérez les comptes, les rôles et les accès aux boutiques.</p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
            <UserPlus className="w-4 h-4 mr-2" /> Nouvel Utilisateur
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des collaborateurs</CardTitle>
          <CardDescription>Tous les employés enregistrés dans le système.</CardDescription>
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
                  <TableHead>Collaborateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Boutiques</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{user.prenom} {user.nom}</span>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Mail className="w-3 h-3 mr-1" /> {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 capitalize">
                          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm">{user.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <StoreIcon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm">{user.boutiqueIds?.length || 0} boutique(s)</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.actif ? "outline" : "destructive"}>
                          {user.actif ? "Actif" : "Suspendu"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" asChild title="Modifier">
                          <Link href={`/admin/users/${user.uid}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={user.actif ? "text-destructive" : "text-accent"}
                          onClick={() => handleToggleStatus(user.uid, user.actif)}
                          title={user.actif ? "Suspendre" : "Activer"}
                          disabled={user.uid === currentUser?.uid}
                        >
                          {user.actif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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
