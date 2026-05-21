
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
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Trésorerie & Caisse</h1>
          <p className="text-xs text-muted-foreground mt-1">Cycle quotidien et rapprochement pour <span className="font-semibold text-foreground">{activeStore?.name}</span>.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {activeSession ? (
            <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-10 px-4 border border-border bg-background hover:bg-muted text-foreground font-semibold rounded-xl text-xs transition-all flex-1 md:flex-none">
                  <ArrowRightLeft className="w-4 h-4 mr-2" /> Opération de Caisse
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl border bg-background shadow-lg p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-muted/30 border-b border-border">
                  <DialogTitle className="text-xl font-bold text-foreground">Alimentation / Retrait</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-1">Enregistrez un mouvement de fonds exceptionnel (hors vente/dépense).</DialogDescription>
                </DialogHeader>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Type d'opération</Label>
                      <Select value={fundData.type} onValueChange={(v: any) => setFundData({...fundData, type: v})}>
                        <SelectTrigger className="h-10 rounded-lg bg-background border-border text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-md">
                          <SelectItem value="IN" className="text-xs">Alimentation (+)</SelectItem>
                          <SelectItem value="OUT" className="text-xs">Retrait (-)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Ligne de caisse</Label>
                      <Select value={fundData.method} onValueChange={(v) => setFundData({...fundData, method: v})}>
                        <SelectTrigger className="h-10 rounded-lg bg-background border-border text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-md">
                          {PAYMENT_METHODS.map(m => (
                            <SelectItem key={m} value={m} className="text-xs">
                              {m.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Montant (FCFA)</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={fundData.amount} 
                      onChange={e => setFundData({...fundData, amount: e.target.value})}
                      className="h-10 bg-background border-border rounded-lg font-bold text-[15px] focus-visible:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Motif du mouvement</Label>
                    <Input 
                      placeholder="Ex: Apport fonds de roulement, retrait personnel..." 
                      value={fundData.reason} 
                      onChange={e => setFundData({...fundData, reason: e.target.value})}
                      className="h-10 bg-background border-border rounded-lg text-sm focus-visible:ring-primary/20"
                    />
                  </div>
                </div>
                
                <DialogFooter className="p-6 bg-muted/20 border-t border-border flex flex-row items-center justify-end gap-3">
                  <Button variant="outline" className="h-10 px-4 rounded-xl text-xs font-semibold" onClick={() => setIsFundDialogOpen(false)}>Annuler</Button>
                  <Button 
                    className="h-10 px-6 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-sm flex-1 md:flex-none"
                    onClick={handleFundMovement}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Valider le mouvement
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button onClick={handleOpenCash} disabled={processing} className="bg-primary hover:bg-primary/90 text-white font-semibold h-10 px-6 rounded-xl shadow-sm transition-all text-xs flex-1 md:flex-none">
              <Unlock className="w-4 h-4 mr-2" /> Ouvrir la Caisse
            </Button>
          )}
        </div>
      </div>

      {!activeSession ? (
        <Card className="border bg-card rounded-2xl shadow-sm overflow-hidden bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-background p-5 rounded-2xl border border-border shadow-sm mb-4">
              <Lock className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Caisse Fermée</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2">
              Aucune session de caisse n'est actuellement ouverte. Ouvrez la caisse pour enregistrer des ventes ou des dépenses.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-12 items-start">
          <div className="md:col-span-8 space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {PAYMENT_METHODS.map(method => (
                <Card key={method} className="border bg-card rounded-2xl shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider truncate">
                      {method.replace('_', ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-xl font-bold font-headline text-foreground">
                      {(activeSession.expectedBalances[method] || 0).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border bg-card rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <div className="bg-primary/10 p-1.5 rounded-lg">
                    <History className="w-4 h-4 text-primary" />
                  </div>
                  Journal de Session
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[450px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="py-4 pl-6 text-xs uppercase tracking-wider text-muted-foreground">Heure</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Source / Motif</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Mode</TableHead>
                        <TableHead className="text-right pr-6 text-xs uppercase tracking-wider text-muted-foreground">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">
                            Aucun mouvement enregistré.
                          </TableCell>
                        </TableRow>
                      ) : (
                        movements.map(m => (
                          <TableRow key={m.id} className="group hover:bg-muted/30 transition-colors">
                            <TableCell className="py-4 pl-6 font-mono text-xs text-muted-foreground">
                              {format(m.timestamp.toDate(), "HH:mm:ss")}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col py-0.5">
                                <span className="text-xs font-semibold text-foreground uppercase tracking-tight">
                                  {m.source.replace('_', ' ')}
                                </span>
                                <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                  {m.description}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-semibold text-[9px] bg-background text-muted-foreground border-border">
                                {m.method}
                              </Badge>
                            </TableCell>
                            <TableCell className={cn(
                              "text-right pr-6 font-headline font-bold text-[14px]",
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

          <Card className="md:col-span-4 border border-primary/20 bg-primary/5 rounded-2xl shadow-sm overflow-hidden sticky top-6">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <div className="bg-background p-1.5 rounded-lg border border-border shadow-sm">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                Clôture de Session
              </CardTitle>
              <CardDescription className="text-xs text-primary/70 mt-1">Saisissez les montants réellement comptés.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {PAYMENT_METHODS.map(method => {
                const expected = activeSession.expectedBalances[method] || 0;
                const actual = Number(actualBalances[method]) || 0;
                const variance = actual - expected;

                return (
                  <div key={method} className="space-y-1.5 p-3 rounded-xl bg-background border border-border shadow-sm">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                        {method.replace('_', ' ')}
                      </Label>
                      <span className="text-[9px] font-bold text-primary/70">THÉORIQUE: {expected.toLocaleString()}</span>
                    </div>
                    <div className="relative">
                      <Input 
                        type="number" 
                        placeholder="Compter..." 
                        className="h-10 bg-background border-border rounded-lg focus-visible:ring-primary/20 font-bold text-foreground pr-14 text-sm"
                        value={actualBalances[method]}
                        onChange={e => setActualBalances(prev => ({ ...prev, [method]: e.target.value }))}
                      />
                      {actualBalances[method] && (
                        <div className={cn(
                          "absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded",
                          variance === 0 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
                        )}>
                          {variance === 0 ? "OK" : `${variance > 0 ? '+' : ''}${variance.toLocaleString()}`}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Notes de clôture</Label>
                <Input 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Observations, écarts..." 
                  className="h-10 bg-background border-border rounded-lg text-sm"
                />
              </div>
            </CardContent>
            <CardContent className="p-6 pt-0">
              <Button 
                className="w-full h-11 text-[13px] font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm flex items-center justify-center gap-2" 
                onClick={handleCloseCash} 
                disabled={processing}
              >
                {processing ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Lock className="mr-2 w-4 h-4" />}
                Clôturer la Journée
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border bg-card rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-border gap-4">
          <div>
            <CardTitle className="text-base font-bold text-foreground">Historique des Sessions</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">Dernières clôtures du réseau FODOBA IMPEX.</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-10 px-4 border border-border bg-background hover:bg-muted text-foreground font-semibold rounded-xl text-xs flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4 text-muted-foreground" /> Rapport Consolidé
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="py-4 pl-6 text-xs uppercase tracking-wider text-muted-foreground">Période</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Caissier</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground">Attendu</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground">Réel</TableHead>
                <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground">Écarts</TableHead>
                <TableHead className="pr-6 text-xs uppercase tracking-wider text-muted-foreground">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((session) => {
                const totalExpected = Object.values(session.expectedBalances).reduce((a, b) => a + b, 0);
                const totalActual = session.actualBalances ? Object.values(session.actualBalances).reduce((a, b) => a + b, 0) : totalExpected;
                const totalVariance = session.variances ? Object.values(session.variances).reduce((a, b) => a + b, 0) : 0;

                return (
                  <TableRow key={session.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="py-4 pl-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">
                          {format(session.openedAt.toDate(), "dd MMM yyyy", { locale: fr })}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {format(session.openedAt.toDate(), "HH:mm")} → {session.closedAt ? format(session.closedAt.toDate(), "HH:mm") : "En cours"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{session.openedByName}</TableCell>
                    <TableCell className="text-right font-headline font-bold text-foreground">{totalExpected.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-headline font-bold text-muted-foreground">{totalActual.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={totalVariance === 0 ? "outline" : "destructive"} className={cn(
                        "text-[9px] font-bold rounded px-1.5 py-0.5",
                        totalVariance === 0 ? "border-emerald-500/20 text-emerald-600 bg-emerald-500/5" : ""
                      )}>
                        {totalVariance === 0 ? "CONFORME" : `${totalVariance > 0 ? '+' : ''}${totalVariance}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6">
                      <Badge variant="secondary" className={cn(
                        "font-bold text-[9px] rounded px-1.5 py-0.5",
                        session.status === "OPEN" ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-border"
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
