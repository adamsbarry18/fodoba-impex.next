"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserProfileSchema, UserProfile, Store, Role } from "@/lib/types"
import { UserService } from "@/services/user.service"
import { StoreService } from "@/services/store.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Save, Mail, Shield, Store as StoreIcon, Info } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/contexts/AuthContext"
import { getRoleMeta, getUserDisplayName, getUserInitials, ROLE_ORDER } from "@/lib/user-utils"
import { StatusBadge } from "@/components/ui/status-badge"

const EditSchema = UserProfileSchema.refine(
  (data) => data.role === "admin" || (data.boutiqueIds?.length ?? 0) > 0,
  {
    message: "Sélectionnez au moins une boutique pour ce rôle.",
    path: ["boutiqueIds"],
  }
)

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const { userProfile: currentUser, isAdmin } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<UserProfile>({
    resolver: zodResolver(EditSchema),
  })

  const selectedRole = form.watch("role")

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Accès refusé. Droits administrateur requis.")
      router.push("/dashboard")
      return
    }

    let cancelled = false

    const init = async () => {
      try {
        const [userData, storesData] = await Promise.all([
          UserService.getUser(params.id as string),
          StoreService.listStores(100),
        ])

        if (cancelled) return

        if (userData) {
          form.reset(userData)
        } else {
          toast.error("Utilisateur introuvable")
          router.push("/admin/users")
          return
        }
        setStores(storesData.stores)
      } catch {
        if (!cancelled) toast.error("Erreur de chargement")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [params.id, isAdmin, router, form])

  const onSubmit = async (values: UserProfile) => {
    try {
      const { uid, ...profileData } = values
      await UserService.updateUserProfile(uid, profileData)
      toast.success("Profil mis à jour")
      router.push("/admin/users")
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la mise à jour"
      toast.error(message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isSelf = params.id === currentUser?.uid
  const displayName = getUserDisplayName(form.getValues())

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {getUserInitials(form.getValues())}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modifier le profil</h1>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {form.getValues("email")}
            </p>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
          <CardTitle className="text-base">{displayName}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
            <StatusBadge preset="userRole" value={form.getValues("role")} className="text-[10px]" />
            <StatusBadge
              preset="activeState"
              value={form.getValues("actif") ? "active" : "inactive"}
              className="text-[10px]"
            >
              {form.getValues("actif") ? "Actif" : "Suspendu"}
            </StatusBadge>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Prénom</FormLabel>
                      <FormControl>
                        <Input className="h-10 rounded-xl" {...field} />
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
                      <FormLabel required>Nom</FormLabel>
                      <FormControl>
                        <Input className="h-10 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input className="h-10 rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Rôle du système
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSelf}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-xl">
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        {ROLE_ORDER.map((role) => (
                          <SelectItem key={role} value={role}>
                            {getRoleMeta(role).label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isSelf && (
                      <FormDescription>
                        Vous ne pouvez pas modifier votre propre rôle pour des raisons de
                        sécurité.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel
                  required={selectedRole !== "admin"}
                  className="flex items-center gap-2"
                >
                  <StoreIcon className="h-4 w-4 text-primary" />
                  Boutiques autorisées
                </FormLabel>

                {selectedRole === "admin" ? (
                  <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p>Accès réseau complet - aucune restriction par boutique.</p>
                  </div>
                ) : (
                  <div className="grid gap-2 rounded-xl border bg-muted/10 p-4 sm:grid-cols-2">
                    {stores.map((store) => (
                      <FormField
                        key={store.id}
                        control={form.control}
                        name="boutiqueIds"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-3 rounded-lg p-2 hover:bg-background">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(store.id)}
                                onCheckedChange={(checked) => {
                                  const current = field.value ?? []
                                  field.onChange(
                                    checked
                                      ? [...current, store.id]
                                      : current.filter((id) => id !== store.id)
                                  )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer font-normal">
                              {store.name}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="boutiqueIds"
                  render={() => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  type="button"
                  className="rounded-xl"
                  onClick={() => router.back()}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="rounded-xl font-semibold"
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
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
