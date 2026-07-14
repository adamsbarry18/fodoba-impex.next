
"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { SupplierService } from "@/services/supplier.service"
import { Supplier, SupplierPayment, Purchase } from "@/lib/types"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Edit,
  Loader2,
  Truck,
  MapPin,
  Globe,
  History,
  Wallet,
  FileText,
  AlertTriangle,
  PlusCircle,
  Receipt,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useStore } from "@/lib/contexts/StoreContext"
import { useCurrency } from "@/hooks/use-currency"
import { StatusBadge } from "@/components/ui/status-badge"
import { SupplierPaymentDialog } from "@/components/suppliers/supplier-payment-dialog"
import {
  formatPurchaseRef,
  PURCHASE_STATUS_ICONS,
  toPurchaseDate,
} from "@/lib/purchase-utils"
import { getPaymentMethodLabel } from "@/lib/constants/payment-methods"
import { cn } from "@/lib/utils"

export default function SupplierDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userProfile } = useAuth()
  const { availableStores, activeStore, loading: storeLoading } = useStore()
  const { formatAmount } = useCurrency()

  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [payments, setPayments] = useState<SupplierPayment[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("history")

  const authorizedStoreIds = useMemo(
    () => availableStores.map((store) => store.id),
    [availableStores]
  )

  const loadData = useCallback(async () => {
    const supplierId = params.id as string
    setLoading(true)

    try {
      const supplierData = await SupplierService.getSupplier(supplierId)

      if (!supplierData) {
        toast.error("Fournisseur introuvable")
        router.push("/suppliers")
        return
      }

      setSupplier(supplierData)

      if (authorizedStoreIds.length === 0) {
        setPayments([])
        setPurchases([])
        return
      }

      const [paymentsData, purchasesData] = await Promise.all([
        SupplierService.getSupplierPayments(supplierId, authorizedStoreIds),
        SupplierService.getSupplierPurchases(supplierId, authorizedStoreIds),
      ])

      setPayments(paymentsData)
      setPurchases(purchasesData)
    } catch {
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
    if (searchParams.get("action") === "payment" && supplier && supplier.currentDebt > 0) {
      setPaymentDialogOpen(true)
    }
  }, [searchParams, supplier])

  const handlePayment = async (data: {
    amount: number
    method: SupplierPayment["method"]
    notes: string
  }) => {
    if (!supplier || !activeStore || !userProfile) return

    setPaymentLoading(true)
    try {
      await SupplierService.recordPayment({
        supplierId: supplier.id,
        amount: data.amount,
        method: data.method,
        storeId: activeStore.id,
        user: userProfile,
        notes: data.notes,
      })
      toast.success("Règlement enregistré")
      setPaymentDialogOpen(false)
      await loadData()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du règlement")
    } finally {
      setPaymentLoading(false)
    }
  }

  const receivedPurchases = useMemo(
    () => purchases.filter((p) => p.status === "RECEIVED"),
    [purchases]
  )

  const totalPurchased = useMemo(
    () => receivedPurchases.reduce((acc, p) => acc + p.totalFCFA, 0),
    [receivedPurchases]
  )

  const totalPaid = useMemo(
    () => payments.reduce((acc, p) => acc + p.amount, 0),
    [payments]
  )

  const lastPurchase = purchases[0] ?? null
  const lastPayment = payments[0] ?? null

  if (storeLoading || loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  if (!supplier) return null

  const hasDebt = supplier.currentDebt > 0

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">{supplier.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <StatusBadge preset="supplierType" value={supplier.type} className="text-[10px]" />
              <span className="flex items-center">
                <MapPin className="mr-1 h-3 w-3" />
                {supplier.country}
                {supplier.city && `, ${supplier.city}`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="rounded-xl font-semibold" asChild>
            <Link href={`/suppliers/${supplier.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier le profil
            </Link>
          </Button>
          <Button variant="outline" className="rounded-xl font-semibold" asChild>
            <Link href={`/purchases/new?supplierId=${supplier.id}`}>
              <Truck className="mr-2 h-4 w-4" />
              Nouvel achat
            </Link>
          </Button>
          {hasDebt && (
            <Button
              className="rounded-xl font-semibold"
              onClick={() => setPaymentDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Régler
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Type</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <StatusBadge preset="supplierType" value={supplier.type} />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Devise : {supplier.defaultCurrency}
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-2xl border bg-card shadow-sm",
            hasDebt && "border-destructive/30 bg-destructive/5"
          )}
        >
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Encours</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div
              className={cn(
                "font-headline text-xl font-bold",
                hasDebt ? "text-destructive" : "text-emerald-600"
              )}
            >
              {formatAmount(supplier.currentDebt, "FCFA")}
            </div>
            {hasDebt && (
              <p className="mt-1 flex items-center text-[10px] font-bold text-destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Règlement en attente
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">
              Conditions de paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg font-medium">
              {supplier.paymentTerms || "Non défini"}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {purchases.length} commande{purchases.length !== 1 ? "s" : ""} enregistrée
              {purchases.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">
              Dernière activité
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-sm font-medium">
              {lastPayment
                ? format(lastPayment.timestamp.toDate(), "dd MMM yyyy", { locale: fr })
                : lastPurchase
                  ? format(
                      (toPurchaseDate(lastPurchase.timestamp) ?? new Date()),
                      "dd MMM yyyy",
                      { locale: fr }
                    )
                  : "Aucune"}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {lastPayment
                ? "Dernier règlement"
                : lastPurchase
                  ? "Dernière commande"
                  : "Historique vide"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="history" className="flex items-center gap-2 rounded-lg">
            <History className="h-4 w-4" />
            Historique achats
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2 rounded-lg">
            <Wallet className="h-4 w-4" />
            Règlements
          </TabsTrigger>
          <TabsTrigger value="statement" className="flex items-center gap-2 rounded-lg">
            <FileText className="h-4 w-4" />
            Relevé de compte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="text-base">Journal des commandes</CardTitle>
              <CardDescription className="text-xs">
                Commandes et réceptions pour ce fournisseur.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {purchases.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                  <Truck className="h-10 w-10 opacity-30" />
                  <p className="font-medium">Aucune commande enregistrée</p>
                  <Button asChild className="mt-2 rounded-xl">
                    <Link href={`/purchases/new?supplierId=${supplier.id}`}>
                      <Truck className="mr-2 h-4 w-4" />
                      Créer un achat
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchases.map((purchase) => {
                    const date = toPurchaseDate(purchase.timestamp)
                    const StatusIcon = PURCHASE_STATUS_ICONS[purchase.status]

                    return (
                      <Link
                        key={purchase.id}
                        href={`/purchases/${purchase.id}`}
                        className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="space-y-1">
                          <p className="font-mono font-bold">{formatPurchaseRef(purchase.id)}</p>
                          <p className="text-xs text-muted-foreground">
                            {date
                              ? format(date, "dd MMM yyyy à HH:mm", { locale: fr })
                              : "—"}{" "}
                            · {purchase.storeName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-headline font-bold">
                            {purchase.totalFCFA.toLocaleString("fr-FR")} FCFA
                          </p>
                          <StatusBadge
                            preset="purchaseStatus"
                            value={purchase.status}
                            icon={<StatusIcon className="h-3 w-3" />}
                            className="mt-1 text-[10px]"
                          />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 p-4 sm:p-6">
              <div>
                <CardTitle className="text-base">Journal des règlements</CardTitle>
                <CardDescription className="text-xs">
                  Virements et paiements pour solde de dettes.
                </CardDescription>
              </div>
              {hasDebt && (
                <Button
                  size="sm"
                  className="rounded-xl font-semibold"
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nouveau règlement
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                  <Wallet className="h-10 w-10 opacity-30" />
                  <p className="font-medium">Aucun règlement enregistré</p>
                  {hasDebt && (
                    <Button
                      className="mt-2 rounded-xl"
                      onClick={() => setPaymentDialogOpen(true)}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Régler la dette
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-xl border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-emerald-100 p-2">
                          <Wallet className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-600">
                            −{payment.amount.toLocaleString("fr-FR")} FCFA
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(payment.timestamp.toDate(), "dd MMM yyyy à HH:mm", {
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge tone="slate" className="text-[10px]">
                          {getPaymentMethodLabel(payment.method)}
                        </StatusBadge>
                        {payment.notes && (
                          <p className="mt-1 max-w-[160px] truncate text-[10px] italic text-muted-foreground">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statement" className="space-y-4">
          <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="text-base">Relevé de compte</CardTitle>
              <CardDescription className="text-xs">
                Synthèse des flux financiers avec ce fournisseur.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center">
                  <Receipt className="mb-2 h-5 w-5 text-muted-foreground" />
                  <span className="mb-1 text-xs uppercase text-muted-foreground">
                    Total réceptionné
                  </span>
                  <span className="font-headline text-3xl font-bold text-destructive">
                    {totalPurchased.toLocaleString("fr-FR")}
                  </span>
                  <span className="text-xs text-muted-foreground">FCFA</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center">
                  <Wallet className="mb-2 h-5 w-5 text-muted-foreground" />
                  <span className="mb-1 text-xs uppercase text-muted-foreground">
                    Total réglé
                  </span>
                  <span className="font-headline text-3xl font-bold text-emerald-600">
                    {totalPaid.toLocaleString("fr-FR")}
                  </span>
                  <span className="text-xs text-muted-foreground">FCFA</span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-between gap-4 rounded-xl border bg-muted/20 p-6 sm:flex-row">
                <div>
                  <h3 className="text-lg font-bold">Solde restant dû</h3>
                  <p className="text-sm text-muted-foreground">
                    Arrêté au {format(new Date(), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div
                  className={cn(
                    "font-headline text-4xl font-bold",
                    hasDebt ? "text-destructive" : "text-emerald-600"
                  )}
                >
                  {formatAmount(supplier.currentDebt, "FCFA")}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SupplierPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        supplier={supplier}
        processing={paymentLoading}
        onSubmit={handlePayment}
      />
    </div>
  )
}
