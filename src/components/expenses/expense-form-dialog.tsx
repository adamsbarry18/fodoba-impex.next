
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PaymentMethod } from "@/lib/types"
import { ExpenseService } from "@/services/expense.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
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
import { toast } from "sonner"
import { Loader2, Save, Wallet, AlertTriangle } from "lucide-react"
import { EXPENSE_CATEGORIES } from "@/lib/expense-utils"
import { PAYMENT_METHOD_OPTIONS } from "@/lib/constants/payment-methods"
import type { UserProfile } from "@/lib/types"

const ExpenseFormSchema = z.object({
  amount: z.coerce.number().min(1, "Le montant doit être supérieur à 0"),
  category: z.string().min(1, "Catégorie requise"),
  label: z.string().min(2, "Libellé requis (min. 2 caractères)"),
  method: z.enum([
    "CASH",
    "ORANGE_MONEY",
    "MOBILE_MONEY",
    "CARD",
    "TRANSFER",
    "OTHER",
  ] as const),
  notes: z.string().optional(),
})

type ExpenseFormValues = z.infer<typeof ExpenseFormSchema>

type ExpenseFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeId: string
  user: UserProfile
  onSuccess: () => void
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  storeId,
  user,
  onSuccess,
}: ExpenseFormDialogProps) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(ExpenseFormSchema),
    defaultValues: {
      amount: 0,
      category: EXPENSE_CATEGORIES[0],
      label: "",
      method: "CASH",
      notes: "",
    },
  })

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset()
    onOpenChange(next)
  }

  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      await ExpenseService.createExpense({
        storeId,
        category: values.category,
        label: values.label,
        amount: values.amount,
        method: values.method as PaymentMethod,
        user,
        notes: values.notes,
      })
      toast.success("Dépense enregistrée et caisse débitée")
      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de l'enregistrement"
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden rounded-2xl border p-0 shadow-lg">
        <DialogHeader className="border-b bg-muted/20 p-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Wallet className="h-5 w-5 text-primary" />
            Enregistrer une dépense
          </DialogTitle>
          <DialogDescription className="text-xs">
            Cette action débite immédiatement la caisse active de la boutique.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 p-6">
              <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Une session de caisse ouverte est requise. L&apos;opération est irréversible
                  une fois validée.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Montant (FCFA)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="0"
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {EXPENSE_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Libellé / Motif</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex. Facture EDM mai 2026"
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
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Mode de règlement</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {PAYMENT_METHOD_OPTIONS.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.label}
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Justificatif (réf.)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="N° facture…"
                          className="h-10 rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Référence facture ou bon de commande
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-row justify-end gap-3 border-t bg-muted/20 p-6">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl font-semibold"
                onClick={() => handleOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="min-w-[160px] rounded-xl font-semibold"
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Valider la sortie
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
