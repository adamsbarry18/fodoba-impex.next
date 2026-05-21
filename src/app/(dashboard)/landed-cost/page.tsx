
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Analyse du Coût de Revient</h1>
        <p className="text-muted-foreground">
          Outil de calcul pour déterminer le coût total des marchandises importées en incluant les droits et la logistique.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres de Calcul</CardTitle>
            <CardDescription>Saisissez les détails de l'approvisionnement pour déterminer le coût final.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix Unitaire</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
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
                        <FormLabel>Devise d'Origine</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="CNY">CNY (¥)</SelectItem>
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
                      <FormLabel>Logistique & Transport</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
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
                        <FormLabel>Droits de Douane (%)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
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
                        <FormLabel>Autres Frais</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="targetCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Devise de Destination</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FCFA">FCFA</SelectItem>
                            <SelectItem value="GNF">GNF</SelectItem>
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
                        <FormLabel>Taux de Change</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" {...field} />
                        </FormControl>
                        <FormDescription>Valeur pour 1 unité d'origine</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
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
              <Card className="border-accent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Coût de Revient Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-headline">
                      {result.totalLandedCostInTargetCurrency.toLocaleString()}
                    </span>
                    <span className="text-xl font-medium text-accent">
                      {form.getValues().targetCurrency}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4 mr-1 text-accent" />
                    Taux utilisé: 1 {form.getValues().purchaseCurrency} = {result.exchangeRateUsed} {form.getValues().targetCurrency}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Détails des Coûts</CardTitle>
                  <CardDescription>Valeurs en {form.getValues().purchaseCurrency} (Devise d'origine)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-dashed">
                    <span className="text-sm text-muted-foreground">Prix d'Achat de Base</span>
                    <span className="font-medium">{result.costBreakdown.purchasePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-dashed">
                    <span className="text-sm text-muted-foreground">Transport & Logistique</span>
                    <span className="font-medium text-destructive">+{result.costBreakdown.transportFees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-dashed">
                    <span className="text-sm text-muted-foreground">Droits de Douane ({form.getValues().customsDutyPercentage}%)</span>
                    <span className="font-medium text-destructive">+{result.costBreakdown.customsDuty.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-dashed">
                    <span className="text-sm text-muted-foreground">Autres Frais de Dossier</span>
                    <span className="font-medium text-destructive">+{result.costBreakdown.otherFees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 font-bold">
                    <span>Sous-total</span>
                    <span>{result.totalLandedCostInOriginalCurrency.toFixed(2)} {form.getValues().purchaseCurrency}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center bg-muted/20">
              <Calculator className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">En attente de saisie</h3>
              <p className="text-sm text-muted-foreground/60 max-w-[250px]">
                Remplissez les paramètres à gauche et lancez le calcul pour voir l'analyse détaillée.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
