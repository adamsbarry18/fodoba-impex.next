
import { 
  collection, 
  doc, 
  runTransaction,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter,
  DocumentSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Sale, SaleItem, UserProfile, Client, StockLevel, Store } from "@/lib/types";
import { CashService } from "./cash.service";
import { AppNotificationHelper } from "@/lib/notifications/app-notification-helper";

const COLLECTION_NAME = "sales";
const STOCKS_COLLECTION = "stocks";
const MOVEMENTS_COLLECTION = "inventory_movements";
const CLIENTS_COLLECTION = "clients";

export const SaleService = {
  async processSale(params: {
    store: Store,
    user: UserProfile,
    items: SaleItem[],
    clientId?: string,
    payments: { method: string, amount: number }[],
    discount: number,
    subtotal: number,
    total: number,
    debtAmount: number
  }) {
    const { store, user, items, clientId, payments, discount, subtotal, total, debtAmount } = params;

    // 1. Récupérer la session de caisse AVANT la transaction (interdiction de query dans runTransaction)
    const session = await CashService.getActiveSession(store.id);
    if (!session) throw new Error("Aucune session de caisse ouverte pour cette boutique.");

    const result = await runTransaction(db, async (transaction) => {
      // --- ÉTAPE 1 : TOUTES LES LECTURES (READS) ---
      
      // Lecture du client
      let client: Client | null = null;
      if (clientId && clientId !== "none") {
        const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
        const clientSnap = await transaction.get(clientRef);
        if (!clientSnap.exists()) throw new Error("Client introuvable");
        client = clientSnap.data() as Client;
      }

      // Lecture de tous les stocks nécessaires
      const stockRefs = items.map(item => doc(db, STOCKS_COLLECTION, `${store.id}_${item.productId}`));
      const stockSnaps = await Promise.all(stockRefs.map(ref => transaction.get(ref)));

      // --- ÉTAPE 2 : LOGIQUE ET VALIDATIONS ---

      if (client && debtAmount > 0 && client.creditCeiling > 0) {
        if (client.currentDebt + debtAmount > client.creditCeiling) {
          throw new Error(`Plafond de crédit dépassé pour ${client.name}. Max autorisé: ${client.creditCeiling} FCFA`);
        }
      }

      // Vérification des stocks lus
      const stockUpdates = items.map((item, index) => {
        const snap = stockSnaps[index];
        const currentQty = snap.exists() ? (snap.data() as StockLevel).quantity : 0;
        
        if (currentQty < item.quantity) {
          throw new Error(`Stock insuffisant pour ${item.name}. Disponible: ${currentQty}`);
        }
        
        return {
          ref: stockRefs[index],
          newQty: currentQty - item.quantity,
          previousStock: currentQty,
          item
        };
      });

      // --- ÉTAPE 3 : TOUTES LES ÉCRITURES (WRITES) ---

      // Mise à jour des stocks et mouvements
      for (const update of stockUpdates) {
        transaction.set(update.ref, { 
          quantity: update.newQty, 
          lastUpdated: serverTimestamp() 
        }, { merge: true });

        const moveRef = doc(collection(db, MOVEMENTS_COLLECTION));
        transaction.set(moveRef, {
          id: moveRef.id,
          productId: update.item.productId,
          productName: update.item.name,
          storeId: store.id,
          storeName: store.name,
          type: "SALE",
          delta: -update.item.quantity,
          previousStock: update.previousStock,
          newStock: update.newQty,
          performedBy: user.uid,
          performedByName: `${user.prenom} ${user.nom}`,
          timestamp: serverTimestamp()
        });
      }

      // Mise à jour de la dette client
      if (client && debtAmount > 0) {
        const clientRef = doc(db, CLIENTS_COLLECTION, client.id);
        transaction.update(clientRef, {
          currentDebt: client.currentDebt + debtAmount
        });
      }

      // Enregistrement de la vente
      const saleRef = doc(collection(db, COLLECTION_NAME));
      const amountPaid = payments.reduce((acc, p) => acc + p.amount, 0);
      
      const saleData: any = {
        id: saleRef.id,
        storeId: store.id,
        sellerId: user.uid,
        sellerName: `${user.prenom} ${user.nom}`,
        timestamp: serverTimestamp(),
        items,
        subtotal,
        discount,
        total,
        payments,
        amountPaid,
        debtAmount,
        status: "COMPLETED"
      };

      if (client) {
        saleData.clientId = client.id;
        saleData.clientName = client.name;
      }

      transaction.set(saleRef, saleData);

      // Mouvements de caisse
      for (const payment of payments) {
        if (payment.amount > 0) {
          await CashService.recordMovement(transaction, {
            sessionId: session.id,
            storeId: store.id,
            type: "IN",
            source: "SALE",
            amount: payment.amount,
            method: payment.method,
            user,
            relatedDocId: saleRef.id,
            description: `Vente #${saleRef.id.slice(-6).toUpperCase()}`
          });
        }
      }

      return {
        sale: saleData as Sale,
        stockChanges: stockUpdates.map((update) => ({
          productId: update.item.productId,
          productName: update.item.name,
          previousStock: update.previousStock,
          newStock: update.newQty,
        })),
      };
    });

    void AppNotificationHelper.notifySaleCompleted({ sale: result.sale, store });
    void AppNotificationHelper.notifyStockChanges({
      storeId: store.id,
      changes: result.stockChanges,
    });

    return result.sale;
  },

  async listRecentSales(storeId?: string, pageSize = 20, lastVisible?: DocumentSnapshot) {
    let constraints: any[] = [];
    if (storeId) {
      constraints.push(where("storeId", "==", storeId));
    }
    if (!storeId) {
      constraints.push(orderBy("timestamp", "desc"));
    }
    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }
    constraints.push(limit(pageSize));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const snap = await getDocs(q);
    let sales = snap.docs.map(doc => doc.data() as Sale);
    
    if (storeId) {
      sales.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
    }
    
    return {
      sales,
      lastVisible: snap.docs[snap.docs.length - 1]
    };
  }
};
