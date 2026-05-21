
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  runTransaction,
  serverTimestamp,
  startAfter,
  DocumentSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { StockMovement, StockLevel, Product, Store, UserProfile } from "@/lib/types";

const MOVEMENTS_COLLECTION = "inventory_movements";
const STOCKS_COLLECTION = "stocks";

export const InventoryService = {
  async recordMovement(params: {
    productId: string,
    storeId: string,
    type: StockMovement["type"],
    delta: number,
    user: UserProfile,
    reason?: string,
    relatedDocId?: string
  }) {
    const { productId, storeId, type, delta, user, reason, relatedDocId } = params;
    const stockId = `${storeId}_${productId}`;
    const stockRef = doc(db, STOCKS_COLLECTION, stockId);
    const movementRef = doc(collection(db, MOVEMENTS_COLLECTION));
    const productRef = doc(db, "products", productId);
    const storeRef = doc(db, "stores", storeId);

    return await runTransaction(db, async (transaction) => {
      const stockSnap = await transaction.get(stockRef);
      const productSnap = await transaction.get(productRef);
      const storeSnap = await transaction.get(storeRef);

      if (!productSnap.exists()) throw new Error("Produit introuvable");
      if (!storeSnap.exists()) throw new Error("Boutique introuvable");

      const product = productSnap.data() as Product;
      const store = storeSnap.data() as Store;
      const currentQty = stockSnap.exists() ? (stockSnap.data() as StockLevel).quantity : 0;
      const newQty = currentQty + delta;

      if (newQty < 0) {
        throw new Error(`Stock insuffisant pour ${product.name}. Disponible: ${currentQty}`);
      }

      transaction.set(stockRef, {
        productId,
        storeId,
        quantity: newQty,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      const movementData: any = {
        id: movementRef.id,
        productId,
        productName: product.name,
        storeId,
        storeName: store.name,
        type,
        delta,
        previousStock: currentQty,
        newStock: newQty,
        performedBy: user.uid,
        performedByName: `${user.prenom} ${user.nom}`,
        timestamp: serverTimestamp()
      };

      if (reason) movementData.reason = reason;
      if (relatedDocId) movementData.relatedDocId = relatedDocId;

      transaction.set(movementRef, movementData);
      return movementData as StockMovement;
    });
  },

  async transferStock(params: {
    productId: string,
    fromStoreId: string,
    toStoreId: string,
    quantity: number,
    user: UserProfile,
    reason?: string
  }) {
    const { productId, fromStoreId, toStoreId, quantity, user, reason } = params;
    if (quantity <= 0) throw new Error("La quantité doit être supérieure à 0");
    if (fromStoreId === toStoreId) throw new Error("Les boutiques source et destination doivent être différentes");

    const fromStockId = `${fromStoreId}_${productId}`;
    const toStockId = `${toStoreId}_${productId}`;
    const fromStockRef = doc(db, STOCKS_COLLECTION, fromStockId);
    const toStockRef = doc(db, STOCKS_COLLECTION, toStockId);
    const productRef = doc(db, "products", productId);
    const fromStoreRef = doc(db, "stores", fromStoreId);
    const toStoreRef = doc(db, "stores", toStoreId);

    return await runTransaction(db, async (transaction) => {
      const fromStockSnap = await transaction.get(fromStockRef);
      const toStockSnap = await transaction.get(toStockRef);
      const productSnap = await transaction.get(productRef);
      const fromStoreSnap = await transaction.get(fromStoreRef);
      const toStoreSnap = await transaction.get(toStoreRef);

      if (!productSnap.exists()) throw new Error("Produit introuvable");
      if (!fromStoreSnap.exists() || !toStoreSnap.exists()) throw new Error("Boutique introuvable");

      const product = productSnap.data() as Product;
      const fromStore = fromStoreSnap.data() as Store;
      const toStore = toStoreSnap.data() as Store;
      
      const currentFromQty = fromStockSnap.exists() ? (fromStockSnap.data() as StockLevel).quantity : 0;
      const currentToQty = toStockSnap.exists() ? (toStockSnap.data() as StockLevel).quantity : 0;

      if (currentFromQty < quantity) {
        throw new Error(`Stock insuffisant dans ${fromStore.name}. Disponible: ${currentFromQty}`);
      }

      transaction.set(fromStockRef, {
        productId,
        storeId: fromStoreId,
        quantity: currentFromQty - quantity,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      transaction.set(toStockRef, {
        productId,
        storeId: toStoreId,
        quantity: currentToQty + quantity,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      const moveOutRef = doc(collection(db, MOVEMENTS_COLLECTION));
      const moveOutData: any = {
        id: moveOutRef.id,
        productId,
        productName: product.name,
        storeId: fromStoreId,
        storeName: fromStore.name,
        type: "TRANSFER_OUT",
        delta: -quantity,
        previousStock: currentFromQty,
        newStock: currentFromQty - quantity,
        reason: reason || `Transfert vers ${toStore.name}`,
        performedBy: user.uid,
        performedByName: `${user.prenom} ${user.nom}`,
        timestamp: serverTimestamp()
      };
      transaction.set(moveOutRef, moveOutData);

      const moveInRef = doc(collection(db, MOVEMENTS_COLLECTION));
      const moveInData: any = {
        id: moveInRef.id,
        productId,
        productName: product.name,
        storeId: toStoreId,
        storeName: toStore.name,
        type: "TRANSFER_IN",
        delta: quantity,
        previousStock: currentToQty,
        newStock: currentToQty + quantity,
        reason: reason || `Transfert depuis ${fromStore.name}`,
        performedBy: user.uid,
        performedByName: `${user.prenom} ${user.nom}`,
        timestamp: serverTimestamp()
      };
      transaction.set(moveInRef, moveInData);
    });
  },

  async listMovements(filters: { storeId?: string, productId?: string }, pageSize = 20, lastVisible?: DocumentSnapshot) {
    let constraints: any[] = [];

    if (filters.storeId) {
      constraints.push(where("storeId", "==", filters.storeId));
    }
    if (filters.productId) {
      constraints.push(where("productId", "==", filters.productId));
    }

    if (constraints.length === 0) {
      constraints.push(orderBy("timestamp", "desc"));
    }

    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    constraints.push(limit(pageSize));

    const q = query(collection(db, MOVEMENTS_COLLECTION), ...constraints);
    const snap = await getDocs(q);
    
    let movements = snap.docs.map(doc => doc.data() as StockMovement);
    
    if (constraints.length > 0 && !constraints.some(c => c.type === 'orderBy')) {
      movements.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
    }

    return {
      movements,
      lastVisible: snap.docs[snap.docs.length - 1]
    };
  }
};
