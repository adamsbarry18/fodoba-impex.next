
"use client"

import { useState } from "react"
import { useCurrency } from "@/hooks/use-currency"
import { CurrencyService } from "@/services/currency.service"
import { useAuth } from "@/lib/contexts/AuthContext"
import { CurrencyCode } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Coins, 
  Save, 
  Loader2, 
  Info, 
  TrendingUp, 
  ArrowRightLeft,
  DollarSign,
  Euro,
  CircleDollarSign
} from "lucide-react"
import { toast } from "sonner"

export default function CurrenciesAdminPage() {
  const { rates, refreshRates, loading, formatAmount } = useCurrency()
  const { userProfile } = useAuth()
  const [updating, setUpdating] = useState<string | null>(null)
  
  // Local state for edits
  const [editRates, setEditRates] = useState<Record<string, string>>({
    GNF: "",
    USD: "",
    EUR: ""
  })

  const handleUpdate = async (code: CurrencyCode) => {
    if (!userProfile || !editRates[code]) return
    
    setUpdating(code)
    try {
      await CurrencyService.updateRate(code, Number(editRates[code]), userProfile)
      toast.success(`Taux ${code} mis à jour.`)
      await refreshRates()
      setEditRates(prev => ({ ...prev, [code]: "" }))
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setUpdating(null)
    }
  }

  const CURRENCY_ICONS: Record<string, any> = {
    GNF: <Coins className="w-4 h-4" />,
    USD: <DollarSign className="w-4 h-4" />,
    EUR: <Euro className="w-4 h-4" />,
    FCFA: <CircleDollarSign className="w-4 h-4" />
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Devises</h1>
        <p className="text-muted-foreground">Définissez les taux de change officiels pour le réseau FODOBA IMPEX.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Taux de Change Actuels
              </CardTitle>
              <CardDescription>Valeur de 1 unité par rapport au FCFA (Référence).</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Devise</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Taux (1 unit = x FCFA)</TableHead>
                    <TableHead className="text-right">Mise à jour</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-accent/5">
                    <TableCell className="font-bold flex items-center gap-2">
                      {CURRENCY_ICONS.FCFA} Franc CFA
                    </TableCell>
                    <TableCell><Badge variant="outline">FCFA</Badge></TableCell>
                    <TableCell className="text-right font-mono font-bold">1.00 (REF)</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground italic">Système</TableCell>
                  </TableRow>
                  {(["GNF", "USD", "EUR"] as CurrencyCode[]).map((code) => (
                    <TableRow key={code}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {CURRENCY_ICONS[code]} {code === "GNF" ? "Franc Guinéen" : code === "USD" ? "Dollar US" : "Euro"}
                      </TableCell>
                      <TableCell><Badge variant="secondary">{code}</Badge></TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {rates[code]?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="space-y-1">
                            <div className="flex items-center justify-end gap-2">
                               <Input 
                                 type="number" 
                                 step="0.0001" 
                                 placeholder="Nouveau taux..." 
                                 className="h-8 w-32 text-right"
                                 value={editRates[code]}
                                 onChange={e => setEditRates(prev => ({ ...prev, [code]: e.target.value }))}
                               />
                               <Button 
                                 size="sm" 
                                 className="h-8 w-8 p-0" 
                                 onClick={() => handleUpdate(code)}
                                 disabled={updating === code || !editRates[code]}
                               >
                                 {updating === code ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                               </Button>
                            </div>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" /> Rappel de fonctionnement
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed">
              Le FCFA est la devise pivot. Toutes les transactions (Ventes, Achats) saisies dans une autre devise sont converties et stockées en FCFA pour garantir la cohérence des rapports financiers consolidés. La mise à jour des taux impacte les futures saisies mais ne modifie pas l'historique des ventes passées.
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-4 space-y-6">
           <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-accent" /> Simulateur
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Montant à tester</Label>
                  <Input type="number" placeholder="100" defaultValue="100" id="test-amount" />
                </div>
                <div className="space-y-3 pt-2">
                   <p className="text-xs font-bold uppercase text-muted-foreground">Équivalences FCFA</p>
                   <div className="space-y-2">
                      <div className="flex justify-between p-2 rounded bg-card border text-sm">
                        <span>100 USD</span>
                        <span className="font-bold text-accent">{formatAmount(100 * rates.USD, "FCFA")}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-card border text-sm">
                        <span>100 EUR</span>
                        <span className="font-bold text-accent">{formatAmount(100 * rates.EUR, "FCFA")}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-card border text-sm">
                        <span>100 GNF</span>
                        <span className="font-bold text-accent">{formatAmount(100 * rates.GNF, "FCFA")}</span>
                      </div>
                   </div>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}
