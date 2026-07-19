import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import { NotificationService } from "@/services/notification.service"
import type { AppNotification, Product, Sale, Store } from "@/lib/types"
import { getStockAlertLevel } from "@/lib/notifications/stock-alert"
import {
  getDaysUntilExpiration,
  shouldNotifyExpiration,
} from "@/lib/expiration-utils"

type CreatePayload = Omit<AppNotification, "id" | "timestamp" | "read">

export interface StockChangePayload {
  productId: string
  productName: string
  previousStock: number
  newStock: number
}

async function safeCreate(payload: CreatePayload): Promise<void> {
  try {
    await NotificationService.createNotification(payload)
  } catch (error) {
    console.error("[AppNotificationHelper]", error)
  }
}

export const AppNotificationHelper = {
  async notifySaleCompleted(params: { sale: Sale; store: Store }): Promise<void> {
    const ref = params.sale.id.slice(-6).toUpperCase()
    await safeCreate({
      type: "SALE",
      title: "Vente enregistrée",
      message: `Vente #${ref} - ${params.sale.total.toLocaleString("fr-FR")} FCFA (${params.store.name})`,
      storeId: params.store.id,
      userId: params.sale.sellerId,
    })
  },

  async notifyStockChanges(params: {
    storeId: string
    changes: StockChangePayload[]
  }): Promise<void> {
    for (const change of params.changes) {
      const productSnap = await getDoc(doc(db, "products", change.productId))
      if (!productSnap.exists()) continue

      const product = productSnap.data() as Product
      const alertLevel = getStockAlertLevel(
        change.previousStock,
        change.newStock,
        product.lowStockThreshold
      )
      if (!alertLevel) continue

      const message =
        alertLevel === "out"
          ? `${change.productName} - rupture de stock (0 unité)`
          : `${change.productName} - stock bas (${change.newStock} restant, seuil ${product.lowStockThreshold})`

      await safeCreate({
        type: "STOCK_ALERT",
        title: alertLevel === "out" ? "Rupture de stock" : "Alerte stock bas",
        message,
        storeId: params.storeId,
      })
    }
  },

  async notifyPurchaseReceived(params: {
    purchaseId: string
    supplierName: string
    totalFCFA: number
    storeId: string
    userId?: string
  }): Promise<void> {
    await safeCreate({
      type: "PURCHASE",
      title: "Réception achat",
      message: `Commande #${params.purchaseId.slice(-6).toUpperCase()} - ${params.supplierName} (${params.totalFCFA.toLocaleString("fr-FR")} FCFA)`,
      storeId: params.storeId,
      userId: params.userId,
    })
  },

  async notifyProductExpiration(params: {
    product: Product
    storeId?: string
  }): Promise<void> {
    const { product, storeId } = params
    if (!product.expirationDate || !shouldNotifyExpiration(product.expirationDate)) return

    const alreadyNotified = await NotificationService.hasExpirationAlert(
      product.id,
      product.expirationDate
    )
    if (alreadyNotified) return

    const days = getDaysUntilExpiration(product.expirationDate)
    if (days === null) return

    const message =
      days < 0
        ? `${product.name} - expiré depuis ${Math.abs(days)} jour(s) (${product.expirationDate})`
        : days === 0
          ? `${product.name} - expire aujourd'hui (${product.expirationDate})`
          : `${product.name} - expire dans ${days} jour(s) (${product.expirationDate})`

    await safeCreate({
      type: "EXPIRATION_ALERT",
      title: days < 0 ? "Produit expiré" : "Expiration proche",
      message,
      storeId,
      relatedProductId: product.id,
      relatedExpirationDate: product.expirationDate,
    })
  },

  async scanProductExpirations(products: Product[], storeId?: string): Promise<void> {
    const targets = products.filter(
      (product) => product.expirationDate && shouldNotifyExpiration(product.expirationDate)
    )

    await Promise.all(
      targets.map((product) => this.notifyProductExpiration({ product, storeId }))
    )
  },
}
