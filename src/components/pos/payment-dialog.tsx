"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Receipt,
  Banknote,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Client, PaymentMethod } from "@/lib/types"
import {
  POS_PAYMENT_METHODS,
  POS_FRACTIONAL_METHODS,
  getPaymentMethodLabel,
  EMPTY_PAYMENT_AMOUNTS,
  buildSalePayments,
  type PosPaymentMode,
} from "@/lib/constants/payment-methods"
import { POS_PAYMENT_MODES } from "@/lib/pos-utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { useCurrency } from "@/hooks/use-currency"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  selectedClientId: string
  selectedClientName: string
  selectedClient?: Client
  processing: boolean
  onConfirm: (payments: { method: PaymentMethod; amount: number }[], debtAmount: number) => void
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  selectedClientId,
  selectedClientName,
  selectedClient,
  processing,
  onConfirm,
}: PaymentDialogProps) {
  const { formatAmount } = useCurrency()
  const [mode, setMode] = useState<PosPaymentMode>("comptant")
  const [comptantMethod, setComptantMethod] = useState<PaymentMethod>("CASH")
  const [amounts, setAmounts] = useState(EMPTY_PAYMENT_AMOUNTS())

  useEffect(() => {
    if (!open) return
    setMode("comptant")
    setComptantMethod("CASH")
    setAmounts({ ...EMPTY_PAYMENT_AMOUNTS(), CASH: String(total) })
  }, [open, total])

  useEffect(() => {
    if (!open) return
    if (mode === "credit" || mode === "partiel") {
      setAmounts(EMPTY_PAYMENT_AMOUNTS())
      return
    }
    if (mode === "comptant") {
      setAmounts({ ...EMPTY_PAYMENT_AMOUNTS(), [comptantMethod]: String(total) })
    }
  }, [mode, comptantMethod, open, total])

  const { payments, debtAmount } = useMemo(
    () => buildSalePayments(mode, total, amounts, comptantMethod),
    [mode, total, amounts, comptantMethod]
  )

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0)
  const cashTendered = Number(amounts.CASH) || 0
  const cashApplied = payments.find((p) => p.method === "CASH")?.amount ?? 0
  const change =
    mode === "comptant" && comptantMethod === "CASH" && cashTendered > cashApplied
      ? cashTendered - cashApplied
      : mode === "fractionne" && cashTendered > cashApplied
        ? cashTendered - cashApplied
        : 0

  const needsClient = debtAmount > 0
  const hasClient = selectedClientId !== "none"
  const creditDisabled = !hasClient
  const creditExceeded =
    !!selectedClient &&
    selectedClient.creditCeiling > 0 &&
    debtAmount > 0 &&
    selectedClient.currentDebt + debtAmount > selectedClient.creditCeiling

  const canValidate = (() => {
    if (processing || creditExceeded) return false
    switch (mode) {
      case "comptant":
        return debtAmount === 0 && totalPaid >= total
      case "partiel":
        return hasClient && totalPaid > 0 && debtAmount > 0
      case "credit":
        return hasClient && debtAmount === total
      case "fractionne":
        return needsClient ? hasClient : totalPaid >= total
      default:
        return false
    }
  })()

  useEffect(() => {
    if (!open) return
    if ((mode === "credit" || mode === "partiel") && creditDisabled) {
      setMode("comptant")
    }
  }, [open, mode, creditDisabled])

  const fillRemaining = (method: PaymentMethod) => {
    const remaining = Math.max(
      0,
      total -
        Object.entries(amounts).reduce((acc, [key, val]) => {
          if (key === method) return acc
          return acc + (Number(val) || 0)
        }, 0)
    )
    setAmounts((prev) => ({ ...prev, [method]: String(remaining) }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,720px)] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl border p-0 shadow-lg">
        <DialogHeader className="shrink-0 border-b bg-muted/20 p-4 sm:p-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Receipt className="h-5 w-5 text-primary" />
            Règlement de la vente
          </DialogTitle>
          <DialogDescription className="text-xs">
            Comptant, acompte + crédit, crédit total ou paiement multi-modes.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Net à encaisser
              </span>
              <span className="font-headline text-2xl font-bold text-primary">
                {formatAmount(total, "FCFA")}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl border bg-background p-3 text-xs">
            <span className="text-muted-foreground">Client facturation</span>
            <StatusBadge
              tone={hasClient ? "info" : "slate"}
              className="max-w-[60%] truncate text-[10px]"
            >
              {selectedClientName}
            </StatusBadge>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {POS_PAYMENT_MODES.map(({ id, label, shortLabel, description, icon: Icon, tone }) => {
              const isDisabled = (id === "credit" || id === "partiel") && creditDisabled
              return (
                <button
                  key={id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setMode(id)}
                  title={isDisabled ? "Sélectionnez un client identifié" : description}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors",
                    mode === id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:bg-muted/50",
                    isDisabled && "cursor-not-allowed opacity-45"
                  )}
                >
                  <StatusBadge tone={tone} className="text-[9px]">
                    <Icon className="mr-1 h-3 w-3" />
                    {shortLabel}
                  </StatusBadge>
                  <span className="text-[11px] font-bold leading-tight">{label}</span>
                </button>
              )
            })}
          </div>

          {creditDisabled && (
            <div className="flex items-start gap-2 rounded-xl border border-dashed bg-muted/30 p-3 text-[11px] text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>
                Les modes <strong>Partiel</strong> et <strong>Crédit</strong> nécessitent un
                client identifié dans le panier.
              </span>
            </div>
          )}

          {mode === "comptant" && (
            <div className="space-y-3 rounded-xl border bg-card p-4">
              <Label required className="text-xs font-semibold">
                Mode de paiement
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {POS_PAYMENT_METHODS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setComptantMethod(id)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors",
                      comptantMethod === id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comptant-amount" required className="text-xs font-semibold">
                  Montant reçu
                </Label>
                <Input
                  id="comptant-amount"
                  type="number"
                  min={0}
                  className="h-11 rounded-xl font-headline font-bold"
                  value={amounts[comptantMethod]}
                  onChange={(e) =>
                    setAmounts((prev) => ({ ...prev, [comptantMethod]: e.target.value }))
                  }
                />
              </div>
              {totalPaid < total && totalPaid > 0 && (
                <p className="text-[11px] text-amber-600">
                  Montant insuffisant - utilisez le mode <strong>Partiel</strong>.
                </p>
              )}
            </div>
          )}

          {mode === "partiel" && (
            <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-sm font-semibold">Acompte + solde en crédit</p>
              <Label required className="text-xs font-semibold">
                Mode de l&apos;acompte
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {POS_PAYMENT_METHODS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setComptantMethod(id)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors",
                      comptantMethod === id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="partiel-amount" required className="text-xs font-semibold">
                  Montant encaissé maintenant
                </Label>
                <Input
                  id="partiel-amount"
                  type="number"
                  min={1}
                  max={total - 1}
                  className="h-11 rounded-xl font-bold"
                  value={amounts[comptantMethod]}
                  onChange={(e) =>
                    setAmounts((prev) => ({ ...prev, [comptantMethod]: e.target.value }))
                  }
                />
              </div>
              <div className="flex justify-between rounded-lg bg-background p-3 text-xs">
                <span className="text-muted-foreground">Reste en crédit</span>
                <span className="font-bold text-amber-600">{formatAmount(debtAmount, "FCFA")}</span>
              </div>
              {selectedClient && (
                <ClientCreditSummary client={selectedClient} formatAmount={formatAmount} />
              )}
            </div>
          )}

          {mode === "credit" && (
            <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-sm font-semibold">Vente à crédit intégrale</p>
              <p className="text-xs text-muted-foreground">
                Aucun encaissement caisse. Dette augmentée de{" "}
                <strong>{formatAmount(total, "FCFA")}</strong>.
              </p>
              {!hasClient && (
                <AlertBlock message="Sélectionnez un client dans le panier avant de valider." />
              )}
              {selectedClient && (
                <ClientCreditSummary client={selectedClient} formatAmount={formatAmount} />
              )}
            </div>
          )}

          {mode === "fractionne" && (
            <div className="space-y-3 rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                Répartissez le paiement entre plusieurs modes. Le reste devient une dette client.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {POS_FRACTIONAL_METHODS.map(({ id, label }) => (
                  <div key={id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {label}
                      </Label>
                      <button
                        type="button"
                        onClick={() => fillRemaining(id)}
                        className="text-[10px] font-semibold text-primary hover:underline"
                      >
                        Solde
                      </button>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="h-10 rounded-xl font-bold"
                      value={amounts[id]}
                      onChange={(e) =>
                        setAmounts((prev) => ({ ...prev, [id]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
              {!hasClient && debtAmount > 0 && (
                <AlertBlock
                  message={`Paiement partiel : sélectionnez un client pour la dette de ${formatAmount(debtAmount, "FCFA")}.`}
                />
              )}
            </div>
          )}

          <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Banknote className="h-3.5 w-3.5" />
              Récapitulatif
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Encaissé caisse</span>
              <span className="font-bold text-emerald-600">{formatAmount(totalPaid, "FCFA")}</span>
            </div>
            {debtAmount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">À crédit</span>
                <span className="font-bold text-amber-600">{formatAmount(debtAmount, "FCFA")}</span>
              </div>
            )}
            {change > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Rendu monnaie</span>
                <span className="font-bold text-primary">{formatAmount(change, "FCFA")}</span>
              </div>
            )}
            {payments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {payments.map((p) => (
                  <StatusBadge
                    key={p.method}
                    preset="paymentMethod"
                    value={p.method}
                    className="text-[10px]"
                  >
                    {formatAmount(p.amount, "FCFA")}
                  </StatusBadge>
                ))}
              </div>
            )}
          </div>

          {creditExceeded && (
            <AlertBlock message="Plafond de crédit dépassé pour ce client." />
          )}
        </div>

        <DialogFooter className="shrink-0 flex-row gap-2 border-t bg-muted/20 p-4 sm:p-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 flex-1 rounded-xl font-semibold"
          >
            Annuler
          </Button>
          <Button
            className="h-11 flex-1 rounded-xl font-semibold"
            disabled={!canValidate}
            onClick={() => onConfirm(payments, debtAmount)}
          >
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Valider la vente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ClientCreditSummary({
  client,
  formatAmount,
}: {
  client: Client
  formatAmount: (amount: number, code?: "FCFA") => string
}) {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="rounded-lg bg-background p-2.5">
        <p className="text-muted-foreground">Dette actuelle</p>
        <p className="font-bold">{formatAmount(client.currentDebt, "FCFA")}</p>
      </div>
      <div className="rounded-lg bg-background p-2.5">
        <p className="text-muted-foreground">Plafond crédit</p>
        <p className="font-bold">
          {client.creditCeiling > 0
            ? formatAmount(client.creditCeiling, "FCFA")
            : "Non limité"}
        </p>
      </div>
    </div>
  )
}

function AlertBlock({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
