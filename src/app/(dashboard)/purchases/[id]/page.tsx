
"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { PurchaseService } from "@/services/purchase.service"
import { StoreService } from "@/services/store.service"
import { PrintService } from "@/services/print.service"
import { Purchase } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Package,
  Calendar,
  User,
  Printer,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useStore } from "@/lib/contexts/StoreContext"
import { formatPurchaseRef, getLandedCostUnit, PURCHASE_STATUS_ICONS } from "@/lib/purchase-utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { PurchaseReceptionDialog } from "@/components/purchases/purchase-reception-dialog"

export default function PurchaseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { userProfile } = useAuth()
  const { activeStore } = useStore()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [printingPdf, setPrintingPdf] = useState(false)
  const [receptionOpen, setReceptionOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    const fetchPurchase = async () => {
      setLoading(true)
      try {
        const data = await PurchaseService.getPurchase(params.id as string)
        if (cancelled) return
        if (data) {
          setPurchase(data)
        } else {
          toast.error("Commande introuvable")
          router.push("/purchases")
        }
      } catch {
        if (!cancelled) toast.error("Erreur de chargement")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPurchase()
    return () => {
      cancelled = true
    }
  }, [params.id, router])

  const reloadPurchase = useCallback(async () => {
    const data = await PurchaseService.getPurchase(params.id as string)
    if (data) setPurchase(data)
  }, [params.id])

  const handleReception = async () => {
    if (!purchase || !userProfile) return

    setProcessing(true)
    try {
      await PurchaseService.validateReception(purchase.id, userProfile)
      toast.success("Marchandises réceptionnées avec succès")
      setReceptionOpen(false)
      await reloadPurchase()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la réception")
    } finally {
      setProcessing(false)
    }
  }

  const handlePrintPurchaseOrder = async () => {
    if (!purchase) return

    setPrintingPdf(true)
    try {
      const store =
        activeStore?.id === purchase.storeId
          ? activeStore
          : await StoreService.getStore(purchase.storeId)

      if (!store) {
        toast.error("Boutique introuvable pour générer le bon de commande")
        return
      }

      await PrintService.generatePurchaseOrder(purchase, store)
      toast.success("Bon de commande téléchargé")
    } catch {
      toast.error("Erreur lors de la génération du PDF")
    } finally {
      setPrintingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  if (!purchase) return null

  const isReceived = purchase.status === "RECEIVED"
  const canReceive = purchase.status === "ORDERED"
  const StatusIcon = PURCHASE_STATUS_ICONS[purchase.status]

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl" asChild>
            <Link href="/purchases">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Commande {formatPurchaseRef(purchase.id)}
            </h1>
            <p className="text-muted-foreground">
              Approvisionnement : {purchase.supplierName}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="rounded-xl font-semibold"
            onClick={handlePrintPurchaseOrder}
            disabled={printingPdf}
          >
            {printingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            Bon de commande
          </Button>
          {canReceive && (
            <Button
              className="rounded-xl bg-emerald-600 font-semibold hover:bg-emerald-700"
              onClick={() => setReceptionOpen(true)}
              disabled={processing}
            >
              <Package className="mr-2 h-4 w-4" />
              Valider la réception
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm md:col-span-2">
          <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
            <CardTitle className="text-base">Liste des articles</CardTitle>
            <CardDescription className="text-xs">
              Produits inclus dans cette expédition.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            {purchase.items.map((item, idx) => {
              const landedCostUnit = getLandedCostUnit(item, purchase)

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border bg-muted/5 p-4"
                >
                  <div className="space-y-1">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} unités à {item.unitCost.toLocaleString("fr-FR")}{" "}
                      {item.currency}
                      {item.currency !== "FCFA" && ` (Taux : ${item.exchangeRate})`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-headline font-bold">
                      {(item.quantity * item.unitCost * item.exchangeRate).toLocaleString("fr-FR")}{" "}
                      FCFA
                    </p>
                    {isReceived && (
                      <Badge
                        variant="outline"
                        className="mt-1 border-emerald-200 text-[10px] text-emerald-600"
                      >
                        Revient unit. : {Math.round(landedCostUnit).toLocaleString("fr-FR")} FCFA
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl border bg-card shadow-sm">
            <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
              <CardTitle className="text-base">Statut et informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut actuel</span>
                <StatusBadge
                  preset="purchaseStatus"
                  value={purchase.status}
                  icon={<StatusIcon className="h-3 w-3" />}
                  className="text-[10px]"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" /> Date création
                </span>
                <span>{format(purchase.timestamp.toDate(), "dd/MM/yyyy")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" /> Créé par
                </span>
                <span className="font-medium">{purchase.performedByName}</span>
              </div>
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Sous-total items</span>
                  <span>{purchase.subtotalFCFA.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div className="flex justify-between text-sm text-destructive">
                  <span>Frais annexes</span>
                  <span>+{purchase.expensesTotalFCFA.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>TOTAL FINAL</span>
                  <span>{purchase.totalFCFA.toLocaleString("fr-FR")} FCFA</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {canReceive && (
            <Card className="rounded-2xl border border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="flex items-start gap-3 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-bold text-amber-800 dark:text-amber-400">
                    Réception en attente
                  </p>
                  <p>
                    Validez la réception une fois la marchandise livrée pour mettre à jour le stock
                    et recalculer les coûts de revient.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {isReceived && (
            <Card className="rounded-2xl border border-emerald-200 bg-emerald-50">
              <CardContent className="flex items-start gap-3 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="space-y-1 text-xs text-emerald-800">
                  <p className="font-bold">Stock mis à jour !</p>
                  <p>
                    Les produits ont été injectés dans l&apos;inventaire de{" "}
                    <strong>{purchase.storeName}</strong>.
                  </p>
                  <p>
                    Le prix moyen pondéré (PMP) a été recalculé pour tous les articles de cette
                    commande.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {purchase.notes && (
            <Card className="rounded-2xl border bg-card shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs uppercase text-muted-foreground">
                  Notes de commande
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm">{purchase.notes}</CardContent>
            </Card>
          )}
        </div>
      </div>

      <PurchaseReceptionDialog
        open={receptionOpen}
        onOpenChange={setReceptionOpen}
        purchase={purchase}
        processing={processing}
        onConfirm={handleReception}
      />
    </div>
  )
}
