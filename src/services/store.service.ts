import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  DocumentSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Store } from "@/lib/types";

const COLLECTION_NAME = "stores";

export const StoreService = {
  async createStore(data: Omit<Store, "id">) {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const store: Store = {
      ...data,
      id: newDocRef.id,
      createdAt: serverTimestamp(),
    };
    await setDoc(newDocRef, store);
    return store;
  },

  async updateStore(id: string, data: Partial<Store>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  },

  async getStore(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Store) : null;
  },

  async listStores(pageSize = 10, lastVisible?: DocumentSnapshot) {
    let q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const snap = await getDocs(q);
    const stores = snap.docs.map(doc => doc.data() as Store);
    return {
      stores,
      lastVisible: snap.docs[snap.docs.length - 1],
    };
  },

  async getStoresByIds(ids: string[]) {
    if (!ids.length) return [];
    // Firestore limited to 10 in 'in' queries, we handle it simply for small sets
    const q = query(collection(db, COLLECTION_NAME), where("id", "in", ids));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as Store);
  },

  async toggleStoreStatus(id: string, active: boolean) {
    await this.updateStore(id, { active });
  }
};
