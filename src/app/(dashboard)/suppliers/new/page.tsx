
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SupplierSchema, Supplier } from "@/lib/types"
import { SupplierService } from "@/services/supplier.service"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  Save,
  Truck,
  Globe,
  MapPin,
  Coins,
  Info,
  Building2,
} from "lucide-react"
import Link from "next/link"
import { useCreateReturn } from "@/hooks/use-create-return"
import { ENTITY_ROUTES, readReturnContext } from "@/lib/navigation/return-to"
import { SUPPLIER_CURRENCIES, SUPPLIER_TYPES } from "@/lib/supplier-utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"

export default function NewSupplierPage() {
  const router = useRouter()
  const { redirectAfterCreate, cancelHref } = useCreateReturn(
    "/suppliers",
    ENTITY_ROUTES.supplier.param
  )

  const form = useForm<Omit<Supplier, "id" | "createdAt" | "currentDebt">>({
    resolver: zodResolver(
      SupplierSchema.omit({ id: true, createdAt: true, currentDebt: true })
    ),
    defaultValues: {
      name: "",
      country: "",
      city: "",
      type: "local",
      defaultCurrency: "FCFA",
      paymentTerms: "Comptant",
    },
  })

  const selectedType = form.watch("type")

  const onSubmit = async (values: Omit<Supplier, "id" | "createdAt" | "currentDebt">) => {
    try {
      const supplier = await SupplierService.createSupplier(values)
      if (!readReturnContext(ENTITY_ROUTES.supplier.param).returnTo) {
        toast.success("Fournisseur ajouté avec succès")
      }
      redirectAfterCreate(supplier.id)
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
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouveau fournisseur</h1>
            <p className="text-sm text-muted-foreground">
              Enregistrement d&apos;un partenaire d&apos;approvisionnement dans la base globale.
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
                Raison sociale et type de partenariat commercial.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Raison sociale / Nom</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex. SOGUIPAH, Nestlé International…"
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Type de fournisseur</FormLabel>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {SUPPLIER_TYPES.map((t) => (
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
                          <StatusBadge
                            preset="supplierType"
                            value={t.value}
                            icon={
                              t.value === "import" ? (
                                <Globe className="h-3 w-3" />
                              ) : (
                                <Truck className="h-3 w-3" />
                              )
                            }
                            className="text-[10px]"
                          />
                          <span className="text-sm font-semibold">{t.label}</span>
                          <span className="text-[11px] text-muted-foreground">{t.description}</span>
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                Localisation
              </CardTitle>
              <CardDescription className="text-xs">
                Pays et ville du siège ou du point de contact principal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Pays</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex. Guinée, France…"
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
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex. Conakry, Lyon…"
                          className="h-10 rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <Coins className="h-4 w-4 text-primary" />
                Paramètres commerciaux
              </CardTitle>
              <CardDescription className="text-xs">
                Devise habituelle et conditions de paiement par défaut pour les achats.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="defaultCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Devise habituelle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-xl">
                            <SelectValue placeholder="Devise" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {SUPPLIER_CURRENCIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[11px]">
                        Pré-remplie lors de la création d&apos;un achat.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conditions de paiement</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex. Comptant, 30 jours fin de mois…"
                          className="h-10 rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  L&apos;encours initial est à <strong className="text-foreground">0 FCFA</strong>.
                  Il sera mis à jour automatiquement lors des réceptions d&apos;achat non soldées.
                </p>
              </div>
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
              className="min-w-[200px] rounded-xl font-semibold"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Enregistrer le fournisseur
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
