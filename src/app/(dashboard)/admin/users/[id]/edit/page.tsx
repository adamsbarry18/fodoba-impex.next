"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserProfileSchema, UserProfile, Store } from "@/lib/types"
import { UserService } from "@/services/user.service"
import { StoreService } from "@/services/store.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Save, Mail } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/contexts/AuthContext"

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const { userProfile: currentUser, isAdmin } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  
  const form = useForm<UserProfile>({
    resolver: zodResolver(UserProfileSchema),
  })

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Accès refusé. Droits administrateur requis.")
      router.push("/dashboard")
      return
    }

    const init = async () => {
      try {
        const [userData, storesData] = await Promise.all([
          UserService.getUser(params.id as string),
          StoreService.listStores(100)
        ])
        
        if (userData) {
          form.reset(userData)
        } else {
          toast.error("Utilisateur introuvable")
          router.push("/admin/users")
        }
        setStores(storesData.stores)
      } catch (error) {
        toast.error("Erreur de chargement")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [params.id, isAdmin, router])

  const onSubmit = async (values: UserProfile) => {
    try {
      await UserService.updateUserProfile(params.id as string, values)
      toast.success("Profil mis à jour")
      router.push("/admin/users")
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  const isSelf = params.id === currentUser?.uid

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Modifier Profil</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{form.getValues("prenom")} {form.getValues("nom")}</CardTitle>
          <CardDescription className="flex items-center">
            <Mail className="w-3 h-3 mr-1" /> {form.getValues("email")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle du système</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isSelf}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Gérant</SelectItem>
                        <SelectItem value="seller">Vendeur</SelectItem>
                      </SelectContent>
                    </Select>
                    {isSelf && (
                      <FormDescription>
                        Vous ne pouvez pas modifier votre propre rôle pour des raisons de sécurité.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Boutiques Autorisées</FormLabel>
                <div className="grid grid-cols-2 gap-3 border rounded-lg p-4 bg-muted/20">
                  {stores.map((store) => (
                    <FormField
                      key={store.id}
                      control={form.control}
                      name="boutiqueIds"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(store.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, store.id])
                                  : field.onChange(
                                      field.value?.filter((value) => value !== store.id)
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {store.name}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Annuler
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder les modifications
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}