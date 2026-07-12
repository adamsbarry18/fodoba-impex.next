
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ClientSchema, Client } from "@/lib/types"
import { ClientService } from "@/services/client.service"
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
  UserPlus,
  Phone,
  MapPin,
  CreditCard,
  Info,
  User,
} from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { useStore } from "@/lib/contexts/StoreContext"
import { useCreateReturn } from "@/hooks/use-create-return"
import { ENTITY_ROUTES, readReturnContext } from "@/lib/navigation/return-to"
import { CLIENT_STATUSES, CLIENT_TYPES } from "@/lib/client-utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"

export default function NewClientPage() {
  const router = useRouter()
  const { activeStore } = useStore()
  const { redirectAfterCreate, cancelHref } = useCreateReturn(
    "/clients",
    ENTITY_ROUTES.client.param
  )

  const form = useForm<Omit<Client, "id" | "createdAt" | "currentDebt">>({
    resolver: zodResolver(
      ClientSchema.omit({ id: true, createdAt: true, currentDebt: true })
    ),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      type: "particulier",
      status: "actif",
      creditCeiling: 0,
      storeOfOriginId: activeStore?.id || "",
    },
  })

  useEffect(() => {
    if (activeStore?.id) {
      form.setValue("storeOfOriginId", activeStore.id)
    }
  }, [activeStore?.id, form])

  const selectedType = form.watch("type")
  const selectedStatus = form.watch("status")

  const onSubmit = async (values: Omit<Client, "id" | "createdAt" | "currentDebt">) => {
    try {
      const client = await ClientService.createClient({
        ...values,
        storeOfOriginId: activeStore?.id || values.storeOfOriginId || "unknown",
      })
      if (!readReturnContext(ENTITY_ROUTES.client.param).returnTo) {
        toast.success("Client créé avec succès")
      }
      redirectAfterCreate(client.id)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la création"
      toast.error(message)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href={cancelHref}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouveau client</h1>
            <p className="text-sm text-muted-foreground">
              Ajout au portefeuille global - visible dans toutes les boutiques.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Identification
              </CardTitle>
              <CardDescription className="text-xs">
                Coordonnées et informations de contact du client.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Nom complet / Raison sociale</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex. Jean Dupont, SARL Commerce Plus…"
                        className="h-10 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Téléphone</FormLabel>
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
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Ville, quartier…"
                            className="h-10 rounded-xl pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {activeStore && (
                <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>
                    Boutique d&apos;origine :{" "}
                    <strong className="text-foreground">{activeStore.name}</strong>. Le client
                    sera accessible depuis toutes les boutiques autorisées.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" />
                Classification & crédit
              </CardTitle>
              <CardDescription className="text-xs">
                Type de client, statut initial et plafond de crédit autorisé.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Type de client</FormLabel>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {CLIENT_TYPES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => field.onChange(t.value)}
                          className={cn(
                            "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                            selectedType === t.value
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <StatusBadge preset="clientType" value={t.value} className="text-[10px]" />
                          <span className="text-sm font-semibold">{t.label}</span>
                          <span className="text-[11px] text-muted-foreground">{t.description}</span>
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Statut initial</FormLabel>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {CLIENT_STATUSES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => field.onChange(s.value)}
                          className={cn(
                            "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                            selectedStatus === s.value
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <StatusBadge preset="clientStatus" value={s.value} className="text-[10px]" />
                          <span className="text-sm font-semibold">{s.label}</span>
                          <span className="text-[11px] text-muted-foreground">{s.description}</span>
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditCeiling"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plafond de crédit autorisé (FCFA)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        className="h-10 rounded-xl"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      Laissez à 0 pour un crédit illimité (non recommandé). La dette initiale est
                      toujours de 0 FCFA.
                    </FormDescription>
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
              className="min-w-[180px] rounded-xl font-semibold"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Enregistrer le client
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
