
"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { ClientService } from "@/services/client.service"
import { Client, ClientPayment, Sale } from "@/lib/types"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Edit, 
  Loader2, 
  Phone, 
  MapPin, 
  History,
  CreditCard,
  PlusCircle,
  AlertTriangle,
  Receipt,
  Download,
  Wallet
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useStore } from "@/lib/contexts/StoreContext"
import { SaleTicketButton } from "@/components/sales/sale-ticket-button"

export default function ClientDetailsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { userProfile } = useAuth()
  const { availableStores, activeStore, loading: storeLoading } = useStore()
  const [client, setClient] = useState<Client | null>(null)
  const [payments, setPayments] = useState<ClientPayment[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("history")

  const authorizedStoreIds = useMemo(
    () => availableStores.map((store) => store.id),
    [availableStores]
  )
  
  // Payment Form
  const [amount, setAmount] = useState<string>("")
  const [method, setMethod] = useState<ClientPayment["method"]>("CASH")
  const [notes, setNotes] = useState("")

  const loadData = useCallback(async () => {
    const clientId = params.id as string
    setLoading(true)

    try {
      const clientData = await ClientService.getClient(clientId)

      if (!clientData) {
        toast.error("Client introuvable")
        router.push("/clients")
        return
      }

      setClient(clientData)

      if (authorizedStoreIds.length === 0) {
        setPayments([])
        setSales([])
        return
      }

      const [paymentsData, salesData] = await Promise.all([
        ClientService.getClientPayments(clientId, authorizedStoreIds),
        ClientService.getClientSales(clientId, authorizedStoreIds),
      ])

      setPayments(paymentsData)
      setSales(salesData)
    } catch (error) {
      console.error("Erreur chargement client:", error)
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [authorizedStoreIds, params.id, router])

  useEffect(() => {
    if (storeLoading) return
    void loadData()
  }, [storeLoading, loadData])

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "payments" || tab === "statement" || tab === "history") {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get("action") === "payment" && client && client.currentDebt > 0) {
      setPaymentDialogOpen(true)
    }
  }, [searchParams, client])

  const handlePayment = async () => {
    if (!amount || Number(amount) <= 0) return toast.error("Montant invalide")
    if (!activeStore || !userProfile) return
    setPaymentLoading(true)
    try {
      await ClientService.recordPayment({
        clientId: client!.id,
        amount: Number(amount),
        method,
        storeId: activeStore.id,
        user: userProfile,
        notes
      })
      toast.success("Remboursement enregistré")
      setAmount("")
      setNotes("")
      setPaymentDialogOpen(false)
      loadData()
    } catch (error) {
      toast.error("Erreur lors du paiement")
    } finally {
      setPaymentLoading(false)
    }
  }

  if (storeLoading || loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin" />
      </div>
    )
  }
  if (!client) return null

  const isOverLimit = client.currentDebt > client.creditCeiling && client.creditCeiling > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clients">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {client.phone}</span>
              <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {client.address}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${client.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" /> Modifier
            </Link>
          </Button>
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" /> Remboursement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enregistrer un Remboursement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-muted/30 p-4 rounded-lg flex items-center justify-between border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Dette Totale</p>
                    <p className="text-2xl font-headline font-bold text-destructive">{client.currentDebt.toLocaleString()} FCFA</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label required>Montant versé</Label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label required>Mode de paiement</Label>
                  <Select onValueChange={(v: any) => setMethod(v)} value={method}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Espèces</SelectItem>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                      <SelectItem value="CARD">Carte Bancaire</SelectItem>
                      <SelectItem value="TRANSFER">Virement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Commentaire / Référence</Label>
                  <Input 
                    placeholder="N° de reçu, bordereau..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handlePayment} disabled={paymentLoading}>
                  {paymentLoading ? <Loader2 className="animate-spin mr-2" /> : <Wallet className="mr-2" />}
                  Valider l'encaissement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Statistics Cards */}
        <Card className="bg-muted/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Type de Profil</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold capitalize">{client.type}</div>
            <Badge variant="outline" className="mt-1">{client.status}</Badge>
          </CardContent>
        </Card>

        <Card className={isOverLimit ? "border-destructive bg-destructive/5" : "bg-muted/5"}>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Encours Client</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={`text-xl font-headline font-bold ${client.currentDebt > 0 ? "text-destructive" : ""}`}>
              {client.currentDebt.toLocaleString()} FCFA
            </div>
            {isOverLimit && (
              <div className="flex items-center text-[10px] text-destructive mt-1 font-bold">
                <AlertTriangle className="w-3 h-3 mr-1" /> PLAFOND DÉPASSÉ
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Plafond Crédit</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-headline font-bold">{client.creditCeiling.toLocaleString()} FCFA</div>
            <div className="text-[10px] text-muted-foreground mt-1">Autorisation de découvert</div>
          </CardContent>
        </Card>

        <Card className="bg-muted/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Dernière activité</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-sm font-medium">
              {payments.length > 0 
                ? format(payments[0].timestamp.toDate(), "dd MMM yyyy", { locale: fr })
                : "Aucune"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">Dernier paiement enregistré</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" /> Historique Achats
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Remboursements
          </TabsTrigger>
          <TabsTrigger value="statement" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Relevé de compte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dernières Ventes</CardTitle>
              <CardDescription>Achats effectués par ce client sur l'ensemble du réseau.</CardDescription>
            </CardHeader>
            <CardContent>
              {sales.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Aucune vente enregistrée.</div>
              ) : (
                <div className="space-y-4">
                  {sales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between rounded-xl border p-3">
                      <div className="flex flex-col">
                        <span className="font-bold">Facture #{sale.id.slice(-6).toUpperCase()}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(sale.timestamp.toDate(), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-headline font-bold">{sale.total.toLocaleString()} FCFA</div>
                          <Badge variant={sale.debtAmount > 0 ? "destructive" : "outline"} className="text-[10px]">
                            {sale.debtAmount > 0 ? "Crédit" : "Payé"}
                          </Badge>
                        </div>
                        <SaleTicketButton sale={sale} stores={availableStores} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Journal des Paiements</CardTitle>
              <CardDescription>Historique des versements pour réduction de dette.</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Aucun versement enregistré.</div>
              ) : (
                <div className="space-y-4">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-full">
                          <Wallet className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-600">+{p.amount.toLocaleString()} FCFA</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(p.timestamp.toDate(), "dd MMM yyyy à HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{p.method}</Badge>
                        <p className="text-[10px] text-muted-foreground mt-1 italic">{p.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statement" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Analyse de Solde</CardTitle>
                <CardDescription>Vue d'ensemble des créances FODOBA IMPEX.</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" /> Exporter PDF
              </Button>
            </CardHeader>
            <CardContent className="space-y-8">
               <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase text-muted-foreground mb-1">Total Crédit Accordé</span>
                    <span className="text-3xl font-headline font-bold text-destructive">
                      {sales.reduce((acc, s) => acc + (s.debtAmount || 0), 0).toLocaleString()}
                    </span>
                 </div>
                 <div className="p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase text-muted-foreground mb-1">Total Remboursé</span>
                    <span className="text-3xl font-headline font-bold text-emerald-600">
                      {payments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
                    </span>
                 </div>
               </div>

               <div className="bg-muted/20 p-6 rounded-xl border flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Solde Restant Dû</h3>
                    <p className="text-sm text-muted-foreground">Arrêté au {format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                  </div>
                  <div className="text-4xl font-headline font-bold text-destructive">
                    {client.currentDebt.toLocaleString()} FCFA
                  </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
