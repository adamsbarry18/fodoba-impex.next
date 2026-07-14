
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  where,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Supplier, SupplierPayment, Purchase, UserProfile } from "@/lib/types";
import { CashService } from "./cash.service";

const COLLECTION_NAME = "suppliers";
const PAYMENTS_COLLECTION = "supplier_payments";
const PURCHASES_COLLECTION = "purchases";

function getTimestampSortValue(timestamp: unknown): number {
  if (!timestamp || typeof timestamp !== "object") return 0;
  if ("seconds" in timestamp && typeof (timestamp as { seconds: number }).seconds === "number") {
    return (timestamp as { seconds: number }).seconds;
  }
  if ("toDate" in timestamp && typeof (timestamp as { toDate: () => Date }).toDate === "function") {
    return (timestamp as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
}

async function fetchBySupplierAndStores<T extends { timestamp?: unknown }>(
  collectionName: string,
  supplierId: string,
  storeIds: string[],
  fieldName: "supplierId" = "supplierId"
): Promise<T[]> {
  if (!storeIds.length) return [];

  const uniqueStoreIds = [...new Set(storeIds)];
  const results = await Promise.all(
    uniqueStoreIds.map(async (storeId) => {
      const q = query(
        collection(db, collectionName),
        where(fieldName, "==", supplierId),
        where("storeId", "==", storeId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => docSnap.data() as T);
    })
  );

  return results
    .flat()
    .sort((a, b) => getTimestampSortValue(b.timestamp) - getTimestampSortValue(a.timestamp));
}

export const SupplierService = {
  async createSupplier(data: Omit<Supplier, "id" | "createdAt" | "currentDebt">) {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const supplier: Supplier = {
      ...data,
      id: newDocRef.id,
      currentDebt: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(newDocRef, supplier);
    return supplier;
  },

  async updateSupplier(id: string, data: Partial<Supplier>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  },

  async getSupplier(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Supplier) : null;
  },

  async listSuppliers() {
    const q = query(collection(db, COLLECTION_NAME), orderBy("name", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => docSnap.data() as Supplier);
  },

  async deleteSupplier(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  async recordPayment(params: {
    supplierId: string;
    amount: number;
    method: SupplierPayment["method"];
    storeId: string;
    user: UserProfile;
    notes?: string;
  }) {
    const { supplierId, amount, method, storeId, user, notes } = params;

    const session = await CashService.getActiveSession(storeId);
    if (!session) {
      throw new Error("Veuillez ouvrir la caisse pour enregistrer un règlement.");
    }

    return await runTransaction(db, async (transaction) => {
      const supplierRef = doc(db, COLLECTION_NAME, supplierId);
      const supplierSnap = await transaction.get(supplierRef);

      if (!supplierSnap.exists()) throw new Error("Fournisseur introuvable");

      const supplier = supplierSnap.data() as Supplier;
      const newDebt = Math.max(0, supplier.currentDebt - amount);

      transaction.update(supplierRef, { currentDebt: newDebt });

      const paymentRef = doc(collection(db, PAYMENTS_COLLECTION));
      const payment: SupplierPayment = {
        id: paymentRef.id,
        supplierId,
        amount,
        method,
        timestamp: serverTimestamp(),
        storeId,
        performedBy: user.uid,
        notes: notes || "",
      };

      transaction.set(paymentRef, payment);

      await CashService.recordMovement(transaction, {
        sessionId: session.id,
        storeId,
        type: "OUT",
        source: "PURCHASE_PAYMENT",
        amount,
        method,
        user,
        relatedDocId: paymentRef.id,
        description: `Règlement: ${supplier.name}`,
      });

      return payment;
    });
  },

  async getSupplierPayments(supplierId: string, storeIds: string[]) {
    return fetchBySupplierAndStores<SupplierPayment>(
      PAYMENTS_COLLECTION,
      supplierId,
      storeIds
    );
  },

  async getSupplierPurchases(supplierId: string, storeIds: string[]) {
    return fetchBySupplierAndStores<Purchase>(
      PURCHASES_COLLECTION,
      supplierId,
      storeIds
    );
  },
};
