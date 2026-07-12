
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserProfileSchema, Store, Role } from "@/lib/types"
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
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  UserPlus,
  Key,
  Shield,
  Store as StoreIcon,
  Info,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { z } from "zod"
import { ROLE_META, ROLE_ORDER } from "@/lib/user-utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"

const FormSchema = UserProfileSchema.omit({ uid: true })
  .extend({
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  })
  .refine(
    (data) => data.role === "admin" || (data.boutiqueIds?.length ?? 0) > 0,
    {
      message: "Sélectionnez au moins une boutique pour ce rôle.",
      path: ["boutiqueIds"],
    }
  )

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
      phone: "",
    },
  })

  const selectedRole = form.watch("role")

  useEffect(() => {
    let cancelled = false

    const loadStores = async () => {
      try {
        const result = await StoreService.listStores(100)
        if (!cancelled) setStores(result.stores)
      } catch {
        if (!cancelled) toast.error("Impossible de charger les boutiques")
      } finally {
        if (!cancelled) setLoadingStores(false)
      }
    }

    loadStores()
    return () => {
      cancelled = true
    }
  }, [])

  const onSubmit = async (values: FormValues) => {
    try {
      await UserService.createCollaborator(values)
      toast.success("Collaborateur créé avec succès")
      router.push("/admin/users")
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la création"
      toast.error(message)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouveau collaborateur</h1>
            <p className="text-sm text-muted-foreground">
              Création du compte Auth et du profil d&apos;accès.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Identité & connexion */}
          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="text-base">Identité & connexion</CardTitle>
              <CardDescription className="text-xs">
                L&apos;identifiant (UID) sera généré automatiquement par Firebase Auth.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Email professionnel</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="nom@fodoba.com"
                          className="h-10 rounded-xl"
                          {...field}
                        />
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
                      <FormLabel required>Mot de passe provisoire</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="h-10 rounded-xl pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Minimum 6 caractères. À communiquer au collaborateur.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                      <Input
                        placeholder="+224 6XX XX XX XX"
                        className="h-10 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Rôle */}
          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-primary" />
                Rôle & permissions
              </CardTitle>
              <CardDescription className="text-xs">
                Détermine les actions autorisées dans l&apos;application.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-3">
                      {ROLE_ORDER.map((role) => {
                        const meta = ROLE_META[role]
                        const Icon = meta.icon
                        const selected = field.value === role

                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => field.onChange(role as Role)}
                            className={cn(
                              "flex items-start gap-4 rounded-xl border p-4 text-left transition-colors",
                              selected
                                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                : "border-border bg-background hover:bg-muted/30"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                selected
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">{meta.label}</p>
                                <StatusBadge tone={meta.tone} className="text-[9px]">
                                  {meta.shortLabel}
                                </StatusBadge>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {meta.description}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Boutiques */}
          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <StoreIcon className="h-4 w-4 text-primary" />
                Boutiques autorisées
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedRole === "admin"
                  ? "Les administrateurs ont accès à l'ensemble du réseau."
                  : "Cochez les boutiques visibles par ce collaborateur."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {selectedRole === "admin" ? (
                <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>
                    Aucune assignation requise - le rôle administrateur couvre toutes
                    les boutiques et les paramètres système.
                  </p>
                </div>
              ) : loadingStores ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : stores.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Aucune boutique disponible. Créez d&apos;abord une boutique dans
                  l&apos;administration.
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="boutiqueIds"
                  render={() => (
                    <FormItem>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {stores.map((store) => (
                          <FormField
                            key={store.id}
                            control={form.control}
                            name="boutiqueIds"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center gap-3 rounded-xl border bg-background p-3 transition-colors hover:bg-muted/20">
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
                                  <span className="text-sm font-medium">{store.name}</span>
                                  <StatusBadge
                                    hashFromLabel
                                    className="ml-2 text-[9px] font-mono"
                                  >
                                    {store.code}
                                  </StatusBadge>
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormDescription className="text-[11px]">
                        Les gérants et vendeurs ne voient que les données des boutiques
                        cochées.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              type="button"
              className="rounded-xl font-semibold"
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
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Enregistrer le collaborateur
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
