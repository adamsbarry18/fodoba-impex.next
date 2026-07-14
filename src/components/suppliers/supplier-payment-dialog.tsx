"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Wallet } from "lucide-react"
import type { Supplier, SupplierPayment } from "@/lib/types"
import { POS_PAYMENT_METHODS } from "@/lib/constants/payment-methods"

type SupplierPaymentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier
  processing: boolean
  onSubmit: (data: {
    amount: number
    method: SupplierPayment["method"]
    notes: string
  }) => void
}

export function SupplierPaymentDialog({
  open,
  onOpenChange,
  supplier,
  processing,
  onSubmit,
}: SupplierPaymentDialogProps) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<SupplierPayment["method"]>("CASH")
  const [notes, setNotes] = useState("")

  const handleSubmit = () => {
    const parsed = Number(amount)
    if (!parsed || parsed <= 0) return
    onSubmit({ amount: parsed, method, notes })
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && !processing) {
      setAmount("")
      setNotes("")
      setMethod("CASH")
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un règlement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Dette fournisseur</p>
              <p className="font-headline text-2xl font-bold text-destructive">
                {supplier.currentDebt.toLocaleString("fr-FR")} FCFA
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label required>Montant versé</Label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label required>Mode de paiement</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as SupplierPayment["method"])}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {POS_PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Commentaire / Référence</Label>
            <Input
              placeholder="N° de virement, bordereau…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="w-full rounded-xl font-semibold sm:w-auto"
            onClick={handleSubmit}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="mr-2 h-4 w-4" />
            )}
            Valider le règlement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
