
"use client"

import { useEffect, useMemo, useState } from "react"
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
import { getUserDisplayName } from "@/lib/user-utils"
import { cn } from "@/lib/utils"
import { useT } from "@/i18n/context"

const ProfileFormSchema = UserProfileSchema.pick({
  firstName: true,
  lastName: true,
  phone: true,
})

type ProfileFormValues = z.infer<typeof ProfileFormSchema>
type PasswordFormValues = {
  current: string
  new: string
  confirm: string
}

export default function ProfilePage() {
  const t = useT()
  const { userProfile, loading: authLoading, refreshProfile, isAdmin } = useAuth()
  const { activeStore, availableStores } = useStore()

  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const passwordFormSchema = useMemo(
    () =>
      z
        .object({
          current: z.string().min(1, t("profile.validation.currentRequired")),
          new: z.string().min(6, t("profile.minChars")),
          confirm: z.string().min(6, t("profile.confirmPassword")),
        })
        .refine((data) => data.new === data.confirm, {
          message: t("profile.validation.confirmMismatch"),
          path: ["confirm"],
        }),
    [t]
  )

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: { firstName: "", lastName: "", phone: "" },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { current: "", new: "", confirm: "" },
  })

  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        phone: userProfile.phone || "",
      })
    }
  }, [userProfile, profileForm])

  const onSaveProfile = async (values: ProfileFormValues) => {
    if (!userProfile) return
    try {
      await UserService.updateOwnProfile(userProfile.uid, values)
      await refreshProfile()
      toast.success(t("profile.updateSuccess"))
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("profile.updateError")
      toast.error(message)
    }
  }

  const onUpdatePassword = async (values: PasswordFormValues) => {
    try {
      await AuthService.changePassword(values.current, values.new)
      toast.success(t("profile.passwordSuccess"))
      passwordForm.reset()
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("profile.passwordError")
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

  const roleDescription = t(`profile.roleDesc.${userProfile.role}` as "profile.roleDesc.admin")

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <UserCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("profile.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("profile.subtitle")}</p>
        </div>
      </div>

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
                  value={userProfile.active ? "active" : "inactive"}
                  className="text-[10px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            {t("profile.storesTitle")}
          </CardTitle>
          <CardDescription className="text-xs">{roleDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="rounded-xl border bg-primary/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("profile.activeStore")}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <p className="font-semibold">
                {activeStore?.name ?? t("profile.noStoreSelected")}
              </p>
              {activeStore && (
                <StatusBadge hashFromLabel className="font-mono text-[9px]">
                  {activeStore.code}
                </StatusBadge>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("profile.changeStoreHint")}
            </p>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {isAdmin ? t("profile.networkStores") : t("profile.authorizedStores")} (
              {availableStores.length})
            </p>
            {availableStores.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">
                {t("profile.noStoreAssigned")}
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

      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
          <CardTitle className="text-base">{t("profile.personalInfoTitle")}</CardTitle>
          <CardDescription className="text-xs">{t("profile.personalInfoDesc")}</CardDescription>
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
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>{t("profile.firstName")}</FormLabel>
                      <FormControl>
                        <Input className="h-10 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>{t("profile.lastName")}</FormLabel>
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
                    <FormLabel>{t("profile.phone")}</FormLabel>
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
                  {t("profile.saveChanges")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4 text-primary" />
            {t("profile.securityTitle")}
          </CardTitle>
          <CardDescription className="text-xs">{t("profile.securityDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onUpdatePassword)}
              className="max-w-xl space-y-4"
            >
              {(["current", "new", "confirm"] as const).map((fieldName) => {
                const labels = {
                  current: t("profile.currentPassword"),
                  new: t("profile.newPassword"),
                  confirm: t("profile.confirmPassword"),
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
                                  ? t("profile.hidePassword")
                                  : t("profile.showPassword")
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
                            {t("profile.minChars")}
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
                {t("profile.updatePassword")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
