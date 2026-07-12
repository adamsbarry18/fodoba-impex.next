
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { Loader2, Save, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from "lucide-react"
import {
  PAYMENT_METHOD_OPTIONS,
} from "@/lib/constants/payment-methods"
import { FUND_OPERATION_TYPES, type FundOperationType } from "@/lib/cash-session-utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"

const CashFundFormSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  method: z.enum([
    "CASH",
    "ORANGE_MONEY",
    "MOBILE_MONEY",
    "CARD",
    "TRANSFER",
    "OTHER",
  ]),
  amount: z.coerce.number().min(1, "Le montant doit être supérieur à 0"),
  reason: z.string().min(3, "Motif requis (min. 3 caractères)"),
})

type CashFundFormValues = z.infer<typeof CashFundFormSchema>

type CashFundDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CashFundFormValues) => Promise<void>
}

export function CashFundDialog({ open, onOpenChange, onSubmit }: CashFundDialogProps) {
  const form = useForm<CashFundFormValues>({
    resolver: zodResolver(CashFundFormSchema),
    defaultValues: {
      type: "IN",
      method: "CASH",
      amount: 0,
      reason: "",
    },
  })

  const selectedType = form.watch("type")

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset()
    onOpenChange(next)
  }

  const handleSubmit = async (values: CashFundFormValues) => {
    try {
      await onSubmit(values)
      form.reset()
      onOpenChange(false)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur lors du mouvement"
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden rounded-2xl border p-0 shadow-lg">
        <DialogHeader className="border-b bg-muted/20 p-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Alimentation / Retrait
          </DialogTitle>
          <DialogDescription className="text-xs">
            Mouvement exceptionnel de fonds hors vente ou dépense enregistrée.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-4 p-6">
              <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Une session de caisse ouverte est requise. L&apos;opération met à jour
                  immédiatement le solde théorique de la ligne sélectionnée.
                </p>
              </div>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Type d&apos;opération</FormLabel>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {FUND_OPERATION_TYPES.map((op) => (
                        <button
                          key={op.value}
                          type="button"
                          onClick={() => field.onChange(op.value)}
                          className={cn(
                            "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                            selectedType === op.value
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <StatusBadge
                            tone={op.value === "IN" ? "success" : "destructive"}
                            className="text-[10px]"
                          >
                            {op.value === "IN" ? (
                              <ArrowDownToLine className="mr-1 h-3 w-3" />
                            ) : (
                              <ArrowUpFromLine className="mr-1 h-3 w-3" />
                            )}
                            {op.label}
                          </StatusBadge>
                          <span className="text-sm font-semibold">{op.label}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {op.description}
                          </span>
                        </button>
                      ))}
                    </div>
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
                      <FormLabel required>Ligne de caisse</FormLabel>
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
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Motif du mouvement</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          FUND_OPERATION_TYPES.find((o) => o.value === selectedType)?.hint ??
                          "Motif de l'opération…"
                        }
                        className="h-10 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Obligatoire pour la traçabilité et l&apos;audit de caisse.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                Valider le mouvement
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export type { CashFundFormValues, FundOperationType }
