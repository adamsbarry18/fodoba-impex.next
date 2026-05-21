
"use client"

import { useState, useEffect } from "react"
import { CashService } from "@/services/cash.service"
import { CashSession, CashMovement } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Wallet, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  ArrowDownToLine, 
  Loader2, 
  Lock, 
  Unlock,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Info
} from "lucide-react"
import { useStore } from "@/lib/contexts/StoreContext"
import { useAuth } from "@/lib/contexts/AuthContext"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { runTransaction } from "firebase/firestore"
import { db } from "@/lib/firebase/client"

const PAYMENT_METHODS = ["CASH", "ORANGE_MONEY", "MOBILE_MONEY", "CARD", "TRANSFER"];

export default function ReconciliationPage() {
  const { activeStore } = useStore()
  const { userProfile } = useAuth()
  
  const [activeSession, setActiveSession] = useState<CashSession | null>(null)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [history, setHistory] = useState<CashSession[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Reconciliation form
  const [actualBalances, setActualBalances] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState("")

  // Fund Movement Form
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false)
  const [fundData, setFundData] = useState({
    type: "IN" as "IN" | "OUT",
    method: "CASH",
    amount: "",
    reason: ""
  })

  const loadData = async () => {
    if (!activeStore) return
    setLoading(true)
    try {
      const [session, pastSessions] = await Promise.all([
        CashService.getActiveSession(activeStore.id),
        CashService.listSessions(activeStore.id, 10)
      ])
      setActiveSession(session)
      setHistory(pastSessions)
      
      if (session) {
        const moves = await CashService.getMovements(session.id)
        setMovements(moves)
        const initialActual: Record<string, string> = {}
        PAYMENT_METHODS.forEach(m => initialActual[m] = "")
        setActualBalances(initialActual)
      }
    } catch (error) {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeStore])

  const handleOpenCash = async () => {
    if (!activeStore || !userProfile) return
    const initialBalances: Record<string, number> = {}
    PAYMENT_METHODS.forEach(m => initialBalances[m] = 0)
    
    setProcessing(true)
    try {
      await CashService.openSession(activeStore.id, userProfile, initialBalances)
      toast.success("Caisse ouverte avec succès")
      loadData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleCloseCash = async () => {
    if (!activeSession || !userProfile) return
    
    const formattedActual: Record<string, number> = {}
    PAYMENT_METHODS.forEach(m => formattedActual[m] = Number(actualBalances[m]) || 0)

    setProcessing(true)
    try {
      await CashService.closeSession(activeSession.id, userProfile, formattedActual, notes)
      toast.success("Caisse clôturée. Rapport de session généré.")
      loadData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleFundMovement = async () => {
    if (!activeStore || !userProfile || !activeSession || !fundData.amount || !fundData.reason) {
      toast.error("Veuillez remplir tous les champs.")
      return
    }

    setProcessing(true)
    try {
      await runTransaction(db, async (transaction) => {
        await CashService.recordMovement(transaction, {
          sessionId: activeSession.id,
          storeId: activeStore.id,
          type: fundData.type,
          source: fundData.type === "IN" ? "FUND_ENTRY" : "FUND_WITHDRAWAL",
          amount: Number(fundData.amount),
          method: fundData.method,
          user: userProfile,
          description: fundData.reason
        })
      })
      toast.success("Mouvement de fonds enregistré.")
      setIsFundDialogOpen(false)
      setFundData({ type: "IN", method: "CASH", amount: "", reason: "" })
      loadData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground font-medium">Synchronisation des flux financiers...</p>
    </div>
  )

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#111827]">Trésorerie & Caisse</h2>
          <p className="text-muted-foreground text-[15px]">Cycle quotidien et rapprochement pour <strong>{activeStore?.name}</strong>.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {activeSession ? (
            <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-12 px-6 rounded-xl font-bold border-gray-200">
                  <ArrowRightLeft className="w-4 h-4 mr-2" /> Opération de Caisse
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-[24px]">
                <DialogHeader>
                  <DialogTitle className="text-xl">Alimentation / Retrait</DialogTitle>
                  <DialogDescription>Enregistrez un mouvement de fonds exceptionnel (hors vente/dépense).</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-gray-700">Type d'opération</Label>
                      <Select value={fundData.type} onValueChange={(v: any) => setFundData({...fundData, type: v})}>
                        <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="IN">Alimentation (+)</SelectItem>
                          <SelectItem value="OUT">Retrait (-)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-gray-700">Ligne de caisse</Label>
                      <Select value={fundData.method} onValueChange={(v) => setFundData({...fundData, method: v})}>
                        <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-700">Montant (FCFA)</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={fundData.amount} 
                      onChange={e => setFundData({...fundData, amount: e.target.value})}
                      className="h-11 bg-gray-50 border-gray-100 rounded-xl font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-700">Motif du mouvement</Label>
                    <Input 
                      placeholder="Ex: Apport fonds de roulement, retrait personnel..." 
                      value={fundData.reason} 
                      onChange={e => setFundData({...fundData, reason: e.target.value})}
                      className="h-11 bg-gray-50 border-gray-100 rounded-xl"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" className="h-12 px-6 rounded-xl font-bold" onClick={() => setIsFundDialogOpen(false)}>Annuler</Button>
                  <Button 
                    className="h-12 px-8 bg-primary hover:bg-primary/90 rounded-xl font-bold flex-1"
                    onClick={handleFundMovement}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                    Valider le mouvement
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button onClick={handleOpenCash} disabled={processing} className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all">
              <Unlock className="w-4 h-4 mr-2" /> Ouvrir la Caisse
            </Button>
          )}
        </div>
      </div>

      {!activeSession ? (
        <Card className="border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/50 rounded-[32px] overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-white p-6 rounded-3xl shadow-sm mb-6 ring-1 ring-gray-100">
              <Lock className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Caisse Fermée</h3>
            <p className="text-gray-400 max-w-md mt-2 font-medium">
              Aucune session de caisse n'est actuellement ouverte. Ouvrez la caisse pour enregistrer des ventes ou des dépenses.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-12 items-start">
          <div className="md:col-span-8 space-y-8">
             <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {PAYMENT_METHODS.map(method => (
                  <Card key={method} className="border-none shadow-sm ring-1 ring-gray-100 bg-white rounded-2xl">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate">{method.replace('_', ' ')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-xl font-bold font-headline text-gray-900">{(activeSession.expectedBalances[method] || 0).toLocaleString()}</div>
                    </CardContent>
                  </Card>
                ))}
             </div>

             <Card className="border-none shadow-sm ring-1 ring-gray-100 bg-white rounded-[24px] overflow-hidden">
               <CardHeader className="p-6 border-b border-gray-50">
                 <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="bg-primary/10 p-2 rounded-xl">
                      <History className="w-5 h-5 text-primary" />
                    </div>
                    Journal de Session
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                  <ScrollArea className="h-[450px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="pl-6">Heure</TableHead>
                          <TableHead>Source / Motif</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead className="text-right pr-6">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movements.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-20 text-gray-400 italic">Aucun mouvement enregistré.</TableCell></TableRow>
                        ) : (
                          movements.map(m => (
                            <TableRow key={m.id} className="hover:bg-gray-50/30 transition-colors">
                              <TableCell className="text-[11px] font-bold text-gray-400 pl-6">{format(m.timestamp.toDate(), "HH:mm:ss")}</TableCell>
                              <TableCell>
                                <div className="flex flex-col py-1">
                                  <span className="text-[12px] font-bold text-gray-900 uppercase tracking-tight">{m.source.replace('_', ' ')}</span>
                                  <span className="text-[11px] text-gray-400 line-clamp-1 font-medium">{m.description}</span>
                                </div>
                              </TableCell>
                              <TableCell><Badge variant="outline" className="text-[9px] font-bold bg-white text-gray-500 border-gray-200">{m.method}</Badge></TableCell>
                              <TableCell className={cn(
                                "text-right font-headline font-bold pr-6 text-[15px]",
                                m.type === 'IN' ? 'text-emerald-600' : 'text-destructive'
                              )}>
                                {m.type === 'IN' ? '+' : '-'}{m.amount.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
               </CardContent>
             </Card>
          </div>

          <Card className="md:col-span-4 border-none shadow-xl ring-1 ring-primary/10 bg-primary/5 rounded-[32px] overflow-hidden sticky top-6">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                Clôture de Session
              </CardTitle>
              <CardDescription className="text-primary/60 font-medium">Saisissez les montants réellement comptés.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-4">
               {PAYMENT_METHODS.map(method => {
                  const expected = activeSession.expectedBalances[method] || 0;
                  const actual = Number(actualBalances[method]) || 0;
                  const variance = actual - expected;

                  return (
                    <div key={method} className="space-y-2 p-4 rounded-2xl bg-white/80 border border-white shadow-sm">
                      <div className="flex justify-between items-center">
                        <Label className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">{method.replace('_', ' ')}</Label>
                        <span className="text-[10px] font-bold text-primary/60">THÉORIQUE: {expected.toLocaleString()}</span>
                      </div>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="Compter..." 
                          className="h-11 bg-white border-transparent rounded-xl focus:ring-4 focus:ring-primary/10 font-bold text-gray-900 pr-12"
                          value={actualBalances[method]}
                          onChange={e => setActualBalances(prev => ({ ...prev, [method]: e.target.value }))}
                        />
                        {actualBalances[method] && (
                          <div className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-md",
                            variance === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                          )}>
                            {variance === 0 ? "OK" : `${variance > 0 ? '+' : ''}${variance.toLocaleString()}`}
                          </div>
                        )}
                      </div>
                    </div>
                  )
               })}

               <div className="space-y-2 pt-4">
                  <Label className="text-[13px] font-bold text-primary/80 ml-1">Notes de clôture</Label>
                  <Input 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="Observations, écarts..." 
                    className="h-12 bg-white/50 border-white rounded-xl focus:bg-white transition-all"
                  />
               </div>
            </CardContent>
            <CardContent className="p-8 pt-0">
               <Button 
                className="w-full h-14 text-[15px] font-bold bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2" 
                onClick={handleCloseCash} 
                disabled={processing}
               >
                 {processing ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : <Lock className="mr-2 w-5 h-5" />}
                 Clôturer la Journée
               </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-none shadow-sm ring-1 ring-gray-100 bg-white rounded-[24px] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-gray-50">
          <div>
            <CardTitle className="text-lg font-bold">Historique des Sessions</CardTitle>
            <CardDescription className="font-medium">Dernières clôtures du réseau FODOBA IMPEX.</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl font-bold border-gray-200">
            <ArrowDownToLine className="w-4 h-4 mr-2 text-gray-400" /> Rapport Consolidé
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="pl-6">Période</TableHead>
                <TableHead>Caissier</TableHead>
                <TableHead className="text-right">Attendu</TableHead>
                <TableHead className="text-right">Réel</TableHead>
                <TableHead className="text-center">Écarts</TableHead>
                <TableHead className="pr-6">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((session) => {
                const totalExpected = Object.values(session.expectedBalances).reduce((a, b) => a + b, 0);
                const totalActual = session.actualBalances ? Object.values(session.actualBalances).reduce((a, b) => a + b, 0) : totalExpected;
                const totalVariance = session.variances ? Object.values(session.variances).reduce((a, b) => a + b, 0) : 0;

                return (
                  <TableRow key={session.id} className="hover:bg-gray-50/30 transition-colors">
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-gray-900">{format(session.openedAt.toDate(), "dd MMM yyyy", { locale: fr })}</span>
                        <span className="text-[10px] font-medium text-gray-400">
                          {format(session.openedAt.toDate(), "HH:mm")} → {session.closedAt ? format(session.closedAt.toDate(), "HH:mm") : "En cours"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[13px] font-medium text-gray-600">{session.openedByName}</TableCell>
                    <TableCell className="text-right font-headline font-bold text-gray-900">{totalExpected.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-headline font-bold text-gray-600">{totalActual.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={totalVariance === 0 ? "outline" : "destructive"} className={cn(
                        "text-[10px] font-bold rounded-lg px-2.5",
                        totalVariance === 0 ? "border-emerald-200 text-emerald-600" : ""
                      )}>
                        {totalVariance === 0 ? "CONFORME" : `${totalVariance > 0 ? '+' : ''}${totalVariance}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6">
                      <Badge variant="secondary" className={cn(
                        "font-bold text-[10px] rounded-lg px-2.5 py-1",
                        session.status === "OPEN" ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                      )}>
                        {session.status === "OPEN" ? "OUVERTE" : "CLÔTURÉE"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
