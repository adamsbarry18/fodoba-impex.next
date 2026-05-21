
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ProductSchema, Product, Category } from "@/lib/types"
import { ProductService } from "@/services/product.service"
import { CategoryService } from "@/services/category.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Save, Barcode, DollarSign } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function NewProductPage() {
  const router = useRouter()
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
      prices: {
        GNF: 0,
        USD: 0,
        EUR: 0
      }
    },
  })

  useEffect(() => {
    const load = async () => {
      try {
        const data = await CategoryService.listCategories()
        setCategories(data.filter(c => c.active))
      } catch (error) {
        toast.error("Erreur de chargement")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onSubmit = async (values: Omit<Product, "id" | "createdAt">) => {
    try {
      await ProductService.createProduct(values)
      toast.success("Produit ajouté au catalogue")
      router.push("/inventory")
    } catch (error) {
      toast.error("Erreur lors de la création")
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inventory">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Nouveau Produit</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Identification</CardTitle>
                <CardDescription>Informations de base et classification.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Désignation commerciale</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Riz Basmati Premium 5kg" {...field} />
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
                        <FormLabel>Référence (SKU)</FormLabel>
                        <FormControl>
                          <Input placeholder="RIZ-001" {...field} />
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
                            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="613..." {...field} />
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
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logistique & Unités</CardTitle>
                <CardDescription>Unités de vente et seuils d'alerte.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unité de vente</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unité" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Kg">Kilogramme (Kg)</SelectItem>
                            <SelectItem value="Litre">Litre (L)</SelectItem>
                            <SelectItem value="Pièce">Pièce (Pce)</SelectItem>
                            <SelectItem value="Sac">Sac</SelectItem>
                            <SelectItem value="Carton">Carton</SelectItem>
                            <SelectItem value="Bouteille">Bouteille</SelectItem>
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
                        <FormLabel>Seuil d'alerte</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                      <FormLabel>Conditionnement (Détails)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 1 carton = 12 bouteilles" {...field} />
                      </FormControl>
                      <FormDescription>Informations pour la manutention.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tarification multi-devises</CardTitle>
              <CardDescription>Définissez le prix de base en FCFA et les équivalents indicatifs.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="sellingPriceFCFA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-accent font-bold">Prix Vente FCFA (REF)</FormLabel>
                      <FormControl>
                        <Input type="number" className="font-headline font-bold" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                      <FormLabel>Prix USD ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                      <FormLabel>Prix EUR (€)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>Annuler</Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="min-w-[150px]">
              {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
              Enregistrer le produit
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
