
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
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Supplier } from "@/lib/types";

const COLLECTION_NAME = "suppliers";

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
    return snap.docs.map(doc => doc.data() as Supplier);
  },

  async deleteSupplier(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  async getSupplierPurchases(supplierId: string) {
    // Note: Pour l'instant on retourne un tableau vide car le module achats n'est pas encore implémenté
    // Dans le futur, on cherchera dans la collection 'purchases'
    return [];
  }
};
