
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { calculateLandedCost, type LandedCostOutput } from "@/lib/calculations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calculator,
  Loader2,
  TrendingUp,
  Coins,
  Truck,
  Globe,
  Info,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { useCurrency } from "@/hooks/use-currency"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  getCostBreakdownRows,
  LANDED_COST_DEFAULTS,
  LandedCostFormSchema,
  PURCHASE_CURRENCIES,
  suggestExchangeRate,
  TARGET_CURRENCIES,
  type LandedCostFormValues,
} from "@/lib/landed-cost-utils"
import { cn } from "@/lib/utils"

export default function LandedCostPage() {
  const { rates, formatAmount } = useCurrency()
  const [result, setResult] = useState<LandedCostOutput | null>(null)

  const form = useForm<LandedCostFormValues>({
    resolver: zodResolver(LandedCostFormSchema),
    defaultValues: LANDED_COST_DEFAULTS,
  })

  const purchaseCurrency = form.watch("purchaseCurrency")
  const targetCurrency = form.watch("targetCurrency")

  useEffect(() => {
    const suggested = suggestExchangeRate(purchaseCurrency, targetCurrency, rates)
    if (suggested) {
      form.setValue("exchangeRateToTargetCurrency", Math.round(suggested * 10000) / 10000)
    }
  }, [purchaseCurrency, targetCurrency, rates, form])

  const onSubmit = (values: LandedCostFormValues) => {
    const output = calculateLandedCost(values)
    setResult(output)
    toast.success("Calcul effectué")
  }

  const breakdownRows = result
    ? getCostBreakdownRows(result, form.getValues().customsDutyPercentage)
    : []

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyse du coût de revient</h1>
          <p className="text-sm text-muted-foreground">
            Simulateur d&apos;import - prix d&apos;achat, logistique, douanes et conversion devise.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Coins className="h-4 w-4 text-primary" />
                  Acquisition
                </CardTitle>
                <CardDescription className="text-xs">
                  Prix unitaire et devise d&apos;origine de l&apos;approvisionnement.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Prix unitaire</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
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
                    name="purchaseCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Devise d&apos;origine</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            {PURCHASE_CURRENCIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                  <Truck className="h-4 w-4 text-primary" />
                  Frais logistiques & douaniers
                </CardTitle>
                <CardDescription className="text-xs">
                  Coûts annexes exprimés dans la devise d&apos;origine.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <FormField
                  control={form.control}
                  name="transportFees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Transport & logistique</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="customsDutyPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Droits de douane (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
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
                    name="otherFees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Autres frais</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
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
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4 text-primary" />
                  Conversion devise
                </CardTitle>
                <CardDescription className="text-xs">
                  Taux appliqué pour 1 unité de la devise d&apos;origine.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="targetCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Devise de destination</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            {TARGET_CURRENCIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
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
                    name="exchangeRateToTargetCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Taux de change</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.0001"
                            min="0.0001"
                            className="h-10 rounded-xl font-mono"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-[10px]">
                          1 {purchaseCurrency} = {field.value} {targetCurrency}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>
                    Le taux est pré-rempli depuis les cours FODOBA lorsque disponible. Outil
                    indicatif - à valider avec votre service achats.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full rounded-xl font-semibold"
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Calculator className="mr-2 h-4 w-4" />
                  )}
                  Lancer le calcul
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-4 space-y-4">
              {result ? (
                <>
                  <Card className="overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 shadow-sm">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        Coût de revient total
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold font-headline">
                          {targetCurrency === "FCFA"
                            ? formatAmount(result.totalLandedCostInTargetCurrency, "FCFA")
                            : result.totalLandedCostInTargetCurrency.toLocaleString("fr-FR")}
                        </span>
                        {targetCurrency !== "FCFA" && (
                          <span className="text-lg font-semibold text-primary">
                            {targetCurrency}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        1 {purchaseCurrency} = {result.exchangeRateUsed} {targetCurrency}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <CardHeader className="border-b bg-muted/20 p-4">
                      <CardTitle className="text-sm font-bold">Détail des coûts</CardTitle>
                      <CardDescription className="text-[10px]">
                        En {purchaseCurrency} (devise d&apos;origine)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 p-4">
                      {breakdownRows.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between border-b border-dashed py-2 text-sm last:border-0"
                        >
                          <span className="text-muted-foreground">{row.label}</span>
                          <StatusBadge
                            tone={row.additive ? "warning" : "slate"}
                            className="font-mono text-[10px]"
                          >
                            {row.additive ? "+" : ""}
                            {row.value.toFixed(2)}
                          </StatusBadge>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 font-bold">
                        <span>Sous-total</span>
                        <span>
                          {result.totalLandedCostInOriginalCurrency.toFixed(2)} {purchaseCurrency}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl font-semibold"
                    onClick={() => {
                      setResult(null)
                      form.reset(LANDED_COST_DEFAULTS)
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Nouveau calcul
                  </Button>
                </>
              ) : (
                <Card className="rounded-2xl border border-dashed bg-card shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <Calculator className="mb-4 h-12 w-12 text-muted-foreground/30" />
                    <p className="font-semibold">En attente de calcul</p>
                    <p className="mt-2 max-w-[240px] text-xs text-muted-foreground">
                      Renseignez les paramètres et lancez le calcul pour afficher le coût de
                      revient détaillé.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
