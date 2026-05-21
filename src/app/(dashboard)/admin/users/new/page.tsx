
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
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Loader2, UserPlus, Key } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { z } from "zod"

const FormSchema = UserProfileSchema.omit({ uid: true }).extend({
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères")
})

type FormValues = z.infer<typeof FormSchema>

export default function NewUserPage() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [loadingStores, setLoadingStores] = useState(true)
  
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      nom: "",
      prenom: "",
      role: "seller",
      boutiqueIds: [],
      actif: true,
      password: "",
    },
  })

  useEffect(() => {
    const loadStores = async () => {
      try {
        const result = await StoreService.listStores(100)
        setStores(result.stores)
      } catch (error) {
        toast.error("Impossible de charger les boutiques")
      } finally {
        setLoadingStores(false)
      }
    }
    loadStores()
  }, [])

  const onSubmit = async (values: FormValues) => {
    try {
      await UserService.createCollaborator(values)
      toast.success("Utilisateur créé avec succès")
      router.push("/admin/users")
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création")
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-[#111827]">Nouveau Collaborateur</h1>
      </div>

      <Card className="border-none shadow-sm rounded-[24px] overflow-hidden bg-white ring-1 ring-gray-100">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-xl">Profil & Accès</CardTitle>
          <CardDescription>L'UID sera généré automatiquement par le système.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-bold text-gray-700">Email professionnel</FormLabel>
                      <FormControl>
                        <Input placeholder="nom@fodoba.com" className="h-11 bg-gray-50 border-gray-100 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-bold text-gray-700">Mot de passe provisoire</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input type="password" placeholder="••••••••" className="h-11 pl-10 bg-gray-50 border-gray-100 rounded-xl" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-bold text-gray-700">Prénom</FormLabel>
                      <FormControl>
                        <Input className="h-11 bg-gray-50 border-gray-100 rounded-xl" {...field} />
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
                      <FormLabel className="text-[13px] font-bold text-gray-700">Nom</FormLabel>
                      <FormControl>
                        <Input className="h-11 bg-gray-50 border-gray-100 rounded-xl" {...field} />
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
                    <FormLabel className="text-[13px] font-bold text-gray-700">Rôle du système</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 bg-gray-50 border-gray-100 rounded-xl">
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin (Accès total)</SelectItem>
                        <SelectItem value="manager">Gérant (Gestion de boutiques)</SelectItem>
                        <SelectItem value="seller">Vendeur (Caisse & Stock local)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel className="text-[13px] font-bold text-gray-700">Assignation aux Boutiques</FormLabel>
                <div className="grid grid-cols-2 gap-3 border rounded-2xl p-6 bg-gray-50/50">
                  {loadingStores ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    stores.map((store) => (
                      <FormField
                        key={store.id}
                        control={form.control}
                        name="boutiqueIds"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2 hover:bg-white rounded-lg transition-colors">
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
                            <FormLabel className="text-sm font-medium cursor-pointer">
                              {store.name} <span className="text-xs text-gray-400 font-mono ml-1">({store.code})</span>
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))
                  )}
                </div>
                <p className="text-[11px] text-gray-400 font-medium italic">
                  Les vendeurs et gérants ne voient que les données des boutiques cochées.
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button variant="outline" type="button" className="h-12 px-8 rounded-xl" onClick={() => router.back()}>
                  Annuler
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="h-12 px-10 bg-primary hover:bg-primary/90 rounded-xl font-bold">
                  {form.formState.isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Enregistrer le collaborateur
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
