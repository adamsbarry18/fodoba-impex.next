
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ProductSchema, Product, Category } from "@/lib/types"
import { ProductService } from "@/services/product.service"
import { CategoryService } from "@/services/category.service"
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
  Barcode,
  Package,
  Tags,
  Scale,
  Coins,
  Info,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useCreateReturn } from "@/hooks/use-create-return"
import { ENTITY_ROUTES, readReturnContext } from "@/lib/navigation/return-to"
import { FieldWithAdd } from "@/components/forms/field-with-add"
import { applyReturnSelection } from "@/hooks/use-return-selection"
import { PRODUCT_UNITS } from "@/lib/product-utils"
import { useCurrency } from "@/hooks/use-currency"
import { StatusBadge } from "@/components/ui/status-badge"

export default function NewProductPage() {
  const router = useRouter()
  const { redirectAfterCreate, cancelHref } = useCreateReturn(
    "/inventory",
    ENTITY_ROUTES.product.param
  )
  const { formatAmount, rates } = useCurrency()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<Omit<Product, "id" | "createdAt">>({
    resolver: zodResolver(ProductSchema.omit({ id: true, createdAt: true })),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      categoryId: "",
      unit: "Kg",
      conditionnement: "",
      purchasePriceRef: 0,
      sellingPriceFCFA: 0,
      lowStockThreshold: 10,
      active: true,
      prices: { GNF: 0, USD: 0, EUR: 0 },
    },
  })

  const sellingPrice = form.watch("sellingPriceFCFA")

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await CategoryService.listCategories()
        if (cancelled) return
        setCategories(data.filter((c) => c.active))

        await applyReturnSelection(
          ENTITY_ROUTES.category.param,
          (id) => form.setValue("categoryId", id),
          {
            successMessage: ENTITY_ROUTES.category.createdMessage,
            reload: async () => {
              const cats = await CategoryService.listCategories()
              setCategories(cats.filter((c) => c.active))
            },
          }
        )
      } catch {
        if (!cancelled) toast.error("Erreur de chargement")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [form])

  const onSubmit = async (values: Omit<Product, "id" | "createdAt">) => {
    try {
      const product = await ProductService.createProduct(values)
      if (!readReturnContext(ENTITY_ROUTES.product.param).returnTo) {
        toast.success("Produit ajouté au catalogue")
      }
      redirectAfterCreate(product.id)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la création"
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

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href={cancelHref}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouveau produit</h1>
            <p className="text-sm text-muted-foreground">
              Ajout au catalogue global - visible dans toutes les boutiques autorisées.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Identification */}
            <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tags className="h-4 w-4 text-primary" />
                  Identification
                </CardTitle>
                <CardDescription className="text-xs">
                  Nom commercial, références et classification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Désignation commerciale</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex. Riz Basmati Premium 5 kg"
                          className="h-10 rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Référence (SKU)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="RIZ-001"
                            className="h-10 rounded-xl font-mono uppercase"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code-barres / EAN</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              className="h-10 rounded-xl pl-10 font-mono"
                              placeholder="613…"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Catégorie</FormLabel>
                      <FieldWithAdd entity="category" returnTo="/inventory/new">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-xl">
                              <SelectValue placeholder="Choisir une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldWithAdd>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Logistique */}
            <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scale className="h-4 w-4 text-primary" />
                  Logistique & unités
                </CardTitle>
                <CardDescription className="text-xs">
                  Unité de vente et seuil d&apos;alerte stock par boutique.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Unité de vente</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-xl">
                              <SelectValue placeholder="Unité" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            {PRODUCT_UNITS.map((u) => (
                              <SelectItem key={u.value} value={u.value}>
                                {u.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lowStockThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Seuil d&apos;alerte</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            className="h-10 rounded-xl"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="conditionnement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conditionnement</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex. 1 carton = 12 bouteilles"
                          className="h-10 rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Informations utiles pour la manutention et les achats.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>
                    Le stock initial est à <strong className="text-foreground">0</strong> dans
                    chaque boutique. Il sera alimenté par les réceptions d&apos;achat ou les
                    ajustements d&apos;inventaire.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tarification */}
          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <Coins className="h-4 w-4 text-primary" />
                Tarification
              </CardTitle>
              <CardDescription className="text-xs">
                Prix de vente FCFA (référence) et équivalents indicatifs multi-devises.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <FormField
                  control={form.control}
                  name="purchasePriceRef"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix d&apos;achat ref.</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          className="h-10 rounded-xl"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Coût unitaire indicatif
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sellingPriceFCFA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Prix vente FCFA</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          className="h-10 rounded-xl font-headline font-bold"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prices.GNF"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix GNF</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          className="h-10 rounded-xl"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prices.USD"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix USD</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          className="h-10 rounded-xl"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prices.EUR"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix EUR</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          className="h-10 rounded-xl"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {sellingPrice > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-primary/5 p-3">
                  <span className="text-xs text-muted-foreground">Équivalents indicatifs :</span>
                  <StatusBadge tone="primary-soft" className="text-[10px]">
                    {formatAmount(sellingPrice, "FCFA")}
                  </StatusBadge>
                  {rates.USD > 0 && (
                    <StatusBadge tone="success" className="text-[10px]">
                      ≈ {(sellingPrice / rates.USD).toFixed(2)} USD
                    </StatusBadge>
                  )}
                  {rates.EUR > 0 && (
                    <StatusBadge tone="info" className="text-[10px]">
                      ≈ {(sellingPrice / rates.EUR).toFixed(2)} EUR
                    </StatusBadge>
                  )}
                </div>
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
              className="min-w-[180px] rounded-xl font-semibold"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Enregistrer le produit
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
