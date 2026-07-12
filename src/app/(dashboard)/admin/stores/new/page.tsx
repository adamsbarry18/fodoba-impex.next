
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
import { useStore } from "@/lib/contexts/StoreContext"
import { z } from "zod"
import {
  STORE_CODE_EXAMPLE,
  STORE_CODE_HINT,
  validateStoreCodeFormat,
} from "@/lib/store-utils"

const FormSchema = StoreSchema.omit({ id: true, createdAt: true }).extend({
  code: z
    .string()
    .min(2, "Le code est requis")
    .refine((val) => !validateStoreCodeFormat(val), {
      message: `Format attendu : ${STORE_CODE_HINT}`,
    }),
})

type FormValues = z.infer<typeof FormSchema>

export default function NewStorePage() {
  const router = useRouter()
  const { refreshStores } = useStore()

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
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
      await StoreService.createStore(values)
      toast.success("Boutique créée avec succès")
      await refreshStores()
      router.push("/admin/stores")
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la création de la boutique"
      toast.error(message)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/admin/stores">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <StoreIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouvelle boutique</h1>
            <p className="text-sm text-muted-foreground">
              Enregistrement d&apos;un nouveau point de vente dans le réseau.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" />
                Identification
              </CardTitle>
              <CardDescription className="text-xs">
                Le code est unique et sert de référence dans les rapports et l&apos;assignation
                des collaborateurs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Code boutique</FormLabel>
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
                        Format : {STORE_CODE_HINT} (ex. {STORE_CODE_EXAMPLE})
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
                      <FormLabel required>Nom de la boutique</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex. Conakry Central"
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
                <p>
                  La boutique sera créée en statut <strong className="text-foreground">actif</strong>.
                  Vous pourrez la suspendre ultérieurement sans perdre l&apos;historique.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                Coordonnées
              </CardTitle>
              <CardDescription className="text-xs">
                Adresse et téléphone affichés dans l&apos;administration et les documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Adresse complète</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Quartier, ville, pays"
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
                    <FormLabel required>Téléphone de contact</FormLabel>
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
              Enregistrer la boutique
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
