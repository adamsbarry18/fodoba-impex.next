
"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useStore } from "@/lib/contexts/StoreContext"
import { UserService } from "@/services/user.service"
import { AuthService } from "@/services/auth.service"
import { UserProfileSchema } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserAvatar } from "@/components/ui/user-avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  UserCircle,
  Mail,
  Building2,
  Phone,
  Loader2,
  Key,
  Eye,
  EyeOff,
  Shield,
  Store as StoreIcon,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import {
  getRoleMeta,
  getUserDisplayName,
} from "@/lib/user-utils"
import { cn } from "@/lib/utils"

const ProfileFormSchema = UserProfileSchema.pick({
  prenom: true,
  nom: true,
  phone: true,
})

const PasswordFormSchema = z
  .object({
    current: z.string().min(1, "Le mot de passe actuel est requis"),
    new: z.string().min(6, "Minimum 6 caractères"),
    confirm: z.string().min(6, "Confirmez le nouveau mot de passe"),
  })
  .refine((data) => data.new === data.confirm, {
    message: "La confirmation ne correspond pas",
    path: ["confirm"],
  })

type ProfileFormValues = z.infer<typeof ProfileFormSchema>
type PasswordFormValues = z.infer<typeof PasswordFormSchema>

export default function ProfilePage() {
  const { userProfile, loading: authLoading, refreshProfile, isAdmin } = useAuth()
  const { activeStore, availableStores } = useStore()

  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: { prenom: "", nom: "", phone: "" },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(PasswordFormSchema),
    defaultValues: { current: "", new: "", confirm: "" },
  })

  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        prenom: userProfile.prenom || "",
        nom: userProfile.nom || "",
        phone: userProfile.phone || "",
      })
    }
  }, [userProfile, profileForm])

  const onSaveProfile = async (values: ProfileFormValues) => {
    if (!userProfile) return
    try {
      await UserService.updateOwnProfile(userProfile.uid, values)
      await refreshProfile()
      toast.success("Profil mis à jour avec succès")
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la mise à jour"
      toast.error(message)
    }
  }

  const onUpdatePassword = async (values: PasswordFormValues) => {
    try {
      await AuthService.changePassword(values.current, values.new)
      toast.success("Mot de passe mis à jour avec succès")
      passwordForm.reset()
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur lors du changement de mot de passe"
      toast.error(message)
    }
  }

  if (authLoading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!userProfile) return null

  const roleMeta = getRoleMeta(userProfile.role)

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <UserCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mon profil</h1>
          <p className="text-sm text-muted-foreground">
            Informations personnelles et sécurité de votre compte.
          </p>
        </div>
      </div>

      {/* Carte identité */}
      <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <UserAvatar
              user={userProfile}
              size="lg"
              className="border-2 border-primary/20"
            />
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <h2 className="text-2xl font-bold">{getUserDisplayName(userProfile)}</h2>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                  <Mail className="h-3.5 w-3.5" />
                  {userProfile.email}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <StatusBadge
                  preset="userRole"
                  value={userProfile.role}
                  icon={<Shield className="h-3 w-3" />}
                  className="text-[10px]"
                />
                <StatusBadge
                  preset="activeState"
                  value={userProfile.actif ? "active" : "inactive"}
                  className="text-[10px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Boutiques */}
      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            Boutiques & contexte de travail
          </CardTitle>
          <CardDescription className="text-xs">
            {roleMeta.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="rounded-xl border bg-primary/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Boutique active
            </p>
            <div className="mt-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <p className="font-semibold">
                {activeStore?.name ?? "Aucune boutique sélectionnée"}
              </p>
              {activeStore && (
                <StatusBadge hashFromLabel className="font-mono text-[9px]">
                  {activeStore.code}
                </StatusBadge>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Changez de magasin via le sélecteur en haut de l&apos;écran.
            </p>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {isAdmin ? "Boutiques du réseau" : "Boutiques autorisées"} (
              {availableStores.length})
            </p>
            {availableStores.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">
                Aucune boutique assignée.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableStores.map((store) => (
                  <StatusBadge
                    key={store.id}
                    hashFromLabel
                    className={cn(
                      "text-[10px] font-mono",
                      store.id === activeStore?.id && "ring-1 ring-primary/30"
                    )}
                  >
                    <StoreIcon className="mr-1 h-3 w-3" />
                    {store.code}
                  </StatusBadge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations personnelles */}
      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
          <CardTitle className="text-base">Informations personnelles</CardTitle>
          <CardDescription className="text-xs">
            Modifiables à tout moment. L&apos;email et le rôle sont gérés par un administrateur.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(onSaveProfile)}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={profileForm.control}
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
                  control={profileForm.control}
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
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="+224 6XX XX XX XX"
                          className="h-10 rounded-xl pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={profileForm.formState.isSubmitting}
                  className="rounded-xl font-semibold"
                >
                  {profileForm.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Mot de passe */}
      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4 text-primary" />
            Sécurité - mot de passe
          </CardTitle>
          <CardDescription className="text-xs">
            Votre mot de passe actuel est requis avant toute modification.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onUpdatePassword)}
              className="max-w-xl space-y-4"
            >
              {(["current", "new", "confirm"] as const).map((fieldName) => {
                const labels = {
                  current: "Mot de passe actuel",
                  new: "Nouveau mot de passe",
                  confirm: "Confirmer le nouveau mot de passe",
                }
                return (
                  <FormField
                    key={fieldName}
                    control={passwordForm.control}
                    name={fieldName}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{labels[fieldName]}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPass[fieldName] ? "text" : "password"}
                              className="h-10 rounded-xl pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPass((prev) => ({
                                  ...prev,
                                  [fieldName]: !prev[fieldName],
                                }))
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              aria-label={
                                showPass[fieldName]
                                  ? "Masquer le mot de passe"
                                  : "Afficher le mot de passe"
                              }
                            >
                              {showPass[fieldName] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        {fieldName === "new" && (
                          <FormDescription className="text-[11px]">
                            Minimum 6 caractères.
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )
              })}

              <Button
                type="submit"
                disabled={passwordForm.formState.isSubmitting}
                className="rounded-xl font-semibold"
              >
                {passwordForm.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Key className="mr-2 h-4 w-4" />
                )}
                Mettre à jour le mot de passe
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
