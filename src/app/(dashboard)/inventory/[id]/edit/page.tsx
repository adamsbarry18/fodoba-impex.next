
"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ProductSchema, ProductFormValues, Category } from "@/lib/types"
import { ProductService } from "@/services/product.service"
import { CategoryService } from "@/services/category.service"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Save, Package } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { applyReturnSelection } from "@/hooks/use-return-selection"
import { ENTITY_ROUTES } from "@/lib/navigation/return-to"
import { normalizeProduct } from "@/lib/product-utils"
import { ProductFormFields } from "@/components/inventory/product-form-fields"
import { useT } from "@/i18n/context"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const t = useT()

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema) as unknown as Resolver<ProductFormValues>,
  })

  const editReturnPath = `/inventory/${params.id}/edit`

  useEffect(() => {
    const init = async () => {
      try {
        const [prod, cats] = await Promise.all([
          ProductService.getProduct(params.id as string),
          CategoryService.listCategories(),
        ])
        if (prod) {
          form.reset(normalizeProduct(prod))
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

  const onSubmit = async (values: ProductFormValues) => {
    try {
      const productId = params.id as string
      let imageUrl = values.imageUrl

      if (imageFile) {
        imageUrl = await ProductService.uploadProductImage(productId, imageFile)
      }

      await ProductService.updateProduct(productId, {
        ...values,
        imageUrl,
        manufacturingDate: values.manufacturingDate || undefined,
        expirationDate: values.expirationDate || undefined,
        packagingUnit: values.packagingUnit || undefined,
      })
      toast.success(t("inventory.updatedSuccess"))
      router.push("/inventory")
    } catch (error: unknown) {
      if (error instanceof Error && imageFile) {
        toast.error(t("inventory.imageUploadError"))
        return
      }
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
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("inventory.editTitle")}</h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <ProductFormFields
            form={form}
            categories={categories}
            mode="edit"
            categoryReturnPath={editReturnPath}
            imageFile={imageFile}
            onImageFileChange={setImageFile}
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" className="rounded-xl" onClick={() => router.back()}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="rounded-xl font-semibold">
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
