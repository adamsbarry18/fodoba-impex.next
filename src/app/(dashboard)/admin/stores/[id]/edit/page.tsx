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
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  Save,
  Store as StoreIcon,
  Hash,
  MapPin,
  Phone,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useStore } from "@/lib/contexts/StoreContext"
import { z } from "zod"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  getStoreInitials,
  STORE_CODE_HINT,
  validateStoreCodeFormat,
} from "@/lib/store-utils"

const EditSchema = StoreSchema.extend({
  code: z
    .string()
    .min(2, "Le code est requis")
    .refine((val) => !validateStoreCodeFormat(val), {
      message: `Format attendu : ${STORE_CODE_HINT}`,
    }),
})

export default function EditStorePage() {
  const router = useRouter()
  const params = useParams()
  const { refreshStores } = useStore()
  const [loading, setLoading] = useState(true)

  const form = useForm<Store>({
    resolver: zodResolver(EditSchema),
  })

  useEffect(() => {
    let cancelled = false

    const loadStore = async () => {
      try {
        const data = await StoreService.getStore(params.id as string)
        if (cancelled) return

        if (data) {
          form.reset(data)
        } else {
          toast.error("Boutique introuvable")
          router.push("/admin/stores")
        }
      } catch {
        if (!cancelled) toast.error("Erreur de chargement")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadStore()
    return () => {
      cancelled = true
    }
  }, [params.id, router, form])

  const onSubmit = async (values: Store) => {
    try {
      const { id: _id, createdAt: _createdAt, ...payload } = values
      await StoreService.updateStore(params.id as string, payload)
      toast.success("Boutique mise à jour")
      await refreshStores()
      router.push("/admin/stores")
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

  const storeValues = form.getValues()

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/admin/stores">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
            {getStoreInitials(storeValues)}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modifier la boutique</h1>
            <p className="text-sm text-muted-foreground">{storeValues.name}</p>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
          <CardTitle className="text-base">{storeValues.name}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
            <StatusBadge hashFromLabel className="font-mono text-[10px]">
              {storeValues.code}
            </StatusBadge>
            <StatusBadge
              preset="activeState"
              value={storeValues.active ? "active" : "inactive"}
              className="text-[10px]"
            >
              {storeValues.active ? "Active" : "Suspendue"}
            </StatusBadge>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            className="h-10 rounded-xl pl-10 font-mono uppercase"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Modification rare - impacte les rapports et assignations.
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
                        <Input className="h-10 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Adresse complète</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="h-10 rounded-xl pl-10" {...field} />
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
                        <Input className="h-10 rounded-xl pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
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
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
