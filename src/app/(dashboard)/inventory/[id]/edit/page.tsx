
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ProductSchema, Product, Category } from "@/lib/types"
import { ProductService } from "@/services/product.service"
import { CategoryService } from "@/services/category.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Save, Barcode } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { FieldWithAdd } from "@/components/forms/field-with-add"
import { applyReturnSelection } from "@/hooks/use-return-selection"
import { ENTITY_ROUTES } from "@/lib/navigation/return-to"
import { useT } from "@/i18n/context"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const t = useT()

  const form = useForm<Product>({
    resolver: zodResolver(ProductSchema),
  })

  useEffect(() => {
    const init = async () => {
      try {
        const [prod, cats] = await Promise.all([
          ProductService.getProduct(params.id as string),
          CategoryService.listCategories(),
        ])
        if (prod) {
          form.reset(prod)
        } else {
          toast.error(t("common.errorProductNotFound"))
          router.push("/inventory")
        }
        setCategories(cats.filter((c) => c.active))

        await applyReturnSelection(
          ENTITY_ROUTES.category.param,
          (id) => form.setValue("categoryId", id),
          {
            successMessage: t(ENTITY_ROUTES.category.createdMessageKey),
            errorMessage: t("hooks.returnSelectionError"),
            reload: async () => {
              const fresh = await CategoryService.listCategories()
              setCategories(fresh.filter((c) => c.active))
            },
          }
        )
      } catch {
        toast.error(t("common.errorLoading"))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [params.id, form, router, t])

  const editReturnPath = `/inventory/${params.id}/edit`

  const onSubmit = async (values: Product) => {
    try {
      await ProductService.updateProduct(params.id as string, values)
      toast.success(t("inventory.updatedSuccess"))
      router.push("/inventory")
    } catch {
      toast.error(t("common.errorUpdate"))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{t("inventory.editTitle")}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("inventory.form.identification")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>{t("inventory.form.commercialName")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <FormLabel required>{t("inventory.form.sku")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>{t("inventory.form.barcode")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-9" {...field} />
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
                      <FormLabel required>{t("inventory.form.category")}</FormLabel>
                      <FieldWithAdd entity="category" returnTo={editReturnPath}>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("inventory.form.chooseCategory")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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

            <Card>
              <CardHeader>
                <CardTitle>{t("inventory.form.logisticsStatus")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("inventory.form.unit")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Kg">Kg</SelectItem>
                            <SelectItem value="Litre">L</SelectItem>
                            <SelectItem value="Pièce">Pce</SelectItem>
                            <SelectItem value="Sac">Sac</SelectItem>
                            <SelectItem value="Carton">Carton</SelectItem>
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
                        <FormLabel>{t("inventory.form.lowStockThreshold")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
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
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>{t("inventory.form.activeProduct")}</FormLabel>
                        <FormDescription>{t("inventory.form.hideFromPos")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("inventory.form.pricingFcfa")}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="sellingPriceFCFA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("inventory.form.publicSellPrice")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="text-xl font-bold"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 animate-spin" />
              ) : (
                <Save className="mr-2" />
              )}
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
