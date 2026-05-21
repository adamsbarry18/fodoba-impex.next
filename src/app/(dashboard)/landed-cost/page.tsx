
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { calculateLandedCost, type LandedCostOutput } from "@/lib/calculations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, Loader2, TrendingUp } from "lucide-react"
import { toast } from "sonner"

const formSchema = z.object({
  purchasePrice: z.coerce.number().min(0.01),
  purchaseCurrency: z.string().min(1),
  transportFees: z.coerce.number().min(0),
  customsDutyPercentage: z.coerce.number().min(0).max(100),
  otherFees: z.coerce.number().min(0),
  targetCurrency: z.string().min(1),
  exchangeRateToTargetCurrency: z.coerce.number().min(0.0001),
})

export default function LandedCostPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LandedCostOutput | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purchasePrice: 10,
      purchaseCurrency: "USD",
      transportFees: 2,
      customsDutyPercentage: 5,
      otherFees: 0.5,
      targetCurrency: "FCFA",
      exchangeRateToTargetCurrency: 600,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    // Simulating a small delay for better UX despite being local
    setTimeout(() => {
      const output = calculateLandedCost(values)
      setResult(output)
      setLoading(false)
      toast.success("Calcul effectué avec succès")
    }, 300)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Analyse du Coût de Revient</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Outil de calcul pour déterminer le coût total des marchandises importées en incluant les droits et la logistique.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border bg-card rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-border bg-muted/30">
            <CardTitle className="text-lg font-bold text-foreground">Paramètres de Calcul</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">Saisissez les détails de l'approvisionnement pour déterminer le coût final.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Prix Unitaire</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} className="h-10 bg-background border-border rounded-lg text-sm focus-visible:ring-primary/20" />
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
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Devise d'Origine</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 bg-background border-border rounded-lg text-sm focus:ring-primary/20">
                              <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-border shadow-md">
                            <SelectItem value="USD" className="text-xs">USD ($)</SelectItem>
                            <SelectItem value="EUR" className="text-xs">EUR (€)</SelectItem>
                            <SelectItem value="CNY" className="text-xs">CNY (¥)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="transportFees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Logistique & Transport</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="h-10 bg-background border-border rounded-lg text-sm focus-visible:ring-primary/20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customsDutyPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Droits de Douane (%)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="h-10 bg-background border-border rounded-lg text-sm focus-visible:ring-primary/20" />
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
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Autres Frais</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} className="h-10 bg-background border-border rounded-lg text-sm focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <FormField
                    control={form.control}
                    name="targetCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Devise de Destination</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 bg-background border-border rounded-lg text-sm focus:ring-primary/20">
                              <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-border shadow-md">
                            <SelectItem value="FCFA" className="text-xs">FCFA</SelectItem>
                            <SelectItem value="GNF" className="text-xs">GNF</SelectItem>
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
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Taux de Change</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" {...field} className="h-10 bg-background border-border rounded-lg text-sm focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormDescription className="text-[10px] text-muted-foreground mt-1">Valeur pour 1 unité d'origine</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-sm transition-all text-sm" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                  Lancer le Calcul
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {result ? (
            <>
              <Card className="border border-primary/20 bg-primary/5 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-primary">Coût de Revient Total</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-headline text-foreground">
                      {result.totalLandedCostInTargetCurrency.toLocaleString()}
                    </span>
                    <span className="text-xl font-semibold text-primary">
                      {form.getValues().targetCurrency}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center text-xs text-muted-foreground font-medium">
                    <TrendingUp className="w-4 h-4 mr-1 text-primary" />
                    Taux utilisé: 1 {form.getValues().purchaseCurrency} = {result.exchangeRateUsed} {form.getValues().targetCurrency}
                  </div>
                </CardContent>
              </Card>

              <Card className="border bg-card rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="p-6 border-b border-border bg-muted/30">
                  <CardTitle className="text-base font-bold text-foreground">Détails des Coûts</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">Valeurs en {form.getValues().purchaseCurrency} (Devise d'origine)</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border border-dashed text-sm">
                    <span className="text-muted-foreground">Prix d'Achat de Base</span>
                    <span className="font-semibold text-foreground">{result.costBreakdown.purchasePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border border-dashed text-sm">
                    <span className="text-muted-foreground">Transport & Logistique</span>
                    <span className="font-semibold text-destructive">+{result.costBreakdown.transportFees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border border-dashed text-sm">
                    <span className="text-muted-foreground">Droits de Douane ({form.getValues().customsDutyPercentage}%)</span>
                    <span className="font-semibold text-destructive">+{result.costBreakdown.customsDuty.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border border-dashed text-sm">
                    <span className="text-muted-foreground">Autres Frais de Dossier</span>
                    <span className="font-semibold text-destructive">+{result.costBreakdown.otherFees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 font-bold text-foreground text-base">
                    <span>Sous-total</span>
                    <span>{result.totalLandedCostInOriginalCurrency.toFixed(2)} {form.getValues().purchaseCurrency}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-12 text-center bg-card shadow-sm">
              <div className="bg-muted/50 p-4 rounded-xl border border-border mb-4">
                <Calculator className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground">En attente de saisie</h3>
              <p className="text-xs text-muted-foreground max-w-[280px] mt-2">
                Remplissez les paramètres à gauche et lancez le calcul pour voir l'analyse détaillée.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
