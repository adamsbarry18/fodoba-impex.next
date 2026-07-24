
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { StoreSchema, Store } from "@/lib/types"
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
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  Save,
  Store as StoreIcon,
  Hash,
  MapPin,
  Phone,
  Info,
  Building2,
} from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useStore } from "@/lib/contexts/StoreContext"
import { useAuth } from "@/lib/contexts/AuthContext"
import { z } from "zod"
import {
  STORE_CODE_EXAMPLE,
  STORE_CODE_HINT,
  validateStoreCodeFormat,
} from "@/lib/store-utils"
import { useT } from "@/i18n/context"

type FormValues = Omit<Store, "id" | "createdAt">

export default function NewStorePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSetup = searchParams.get("setup") === "1"
  const { refreshStores } = useStore()
  const { userProfile, refreshProfile } = useAuth()
  const t = useT()

  const formSchema = useMemo(
    () =>
      StoreSchema.omit({ id: true, createdAt: true }).extend({
        code: z
          .string()
          .min(2, t("stores.form.codeRequired"))
          .refine((val) => !validateStoreCodeFormat(val), {
            message: t("stores.form.codeFormat", { hint: STORE_CODE_HINT }),
          }),
      }),
    [t]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      address: "",
      phone: "",
      active: true,
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await StoreService.createStore(values, {
        assignToUid: userProfile?.uid,
      })
      toast.success(
        isSetup ? t("onboarding.storeCreatedAssigned") : t("stores.form.created")
      )
      await refreshProfile()
      await refreshStores()
      router.push(isSetup ? "/dashboard" : "/admin/stores")
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("stores.form.createError")
      toast.error(message)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href={isSetup ? "/dashboard" : "/admin/stores"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <StoreIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isSetup ? t("onboarding.createStoreTitle") : t("stores.form.newTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSetup ? t("onboarding.createStoreSubtitle") : t("stores.form.newSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {isSetup && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>{t("onboarding.createStoreFormHint")}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" />
                {t("stores.form.identification")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("stores.form.identificationDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>{t("stores.form.code")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder={STORE_CODE_EXAMPLE}
                            className="h-10 rounded-xl pl-10 font-mono uppercase"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        {t("stores.form.codeHint", {
                          hint: STORE_CODE_HINT,
                          example: STORE_CODE_EXAMPLE,
                        })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>{t("stores.form.name")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("stores.form.namePlaceholder")}
                          className="h-10 rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>{t("stores.form.activeHint")}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                {t("stores.form.contactTitle")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("stores.form.contactDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("stores.form.address")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder={t("stores.form.addressPlaceholder")}
                          className="h-10 rounded-xl pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("stores.form.phone")}</FormLabel>
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
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              type="button"
              className="rounded-xl font-semibold"
              onClick={() => router.back()}
            >
              {t("common.cancel")}
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
              {isSetup ? t("onboarding.saveAndContinue") : t("stores.form.saveStore")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
