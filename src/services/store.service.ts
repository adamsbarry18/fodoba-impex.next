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
import { normalizeStoreCode, validateStoreCodeFormat } from "@/lib/store-utils";
import { UserService } from "./user.service";

const COLLECTION_NAME = "stores";

export const StoreService = {
  async isCodeAvailable(code: string, excludeId?: string): Promise<boolean> {
    const normalized = normalizeStoreCode(code);
    const q = query(
      collection(db, COLLECTION_NAME),
      where("code", "==", normalized),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return true;
    if (excludeId && snap.docs[0]?.id === excludeId) return true;
    return false;
  },

  async createStore(data: Omit<Store, "id" | "createdAt">) {
    const formatError = validateStoreCodeFormat(data.code);
    if (formatError) throw new Error(formatError);

    const code = normalizeStoreCode(data.code);
    const available = await this.isCodeAvailable(code);
    if (!available) throw new Error(`Le code « ${code} » est déjà utilisé.`);

    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const store: Store = {
      ...data,
      code,
      id: newDocRef.id,
      createdAt: serverTimestamp(),
    };
    await setDoc(newDocRef, store);
    await UserService.logAudit(
      "CREATE_STORE",
      `Création de la boutique ${code} - ${data.name}`,
      newDocRef.id
    );
    return store;
  },

  async updateStore(id: string, data: Partial<Store>) {
    if (data.code) {
      const formatError = validateStoreCodeFormat(data.code);
      if (formatError) throw new Error(formatError);

      const code = normalizeStoreCode(data.code);
      const available = await this.isCodeAvailable(code, id);
      if (!available) throw new Error(`Le code « ${code} » est déjà utilisé.`);
      data = { ...data, code };
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
    await UserService.logAudit(
      "UPDATE_STORE",
      `Mise à jour de la boutique ${id}`,
      id
    );
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
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { active });
    await UserService.logAudit(
      active ? "ACTIVATE_STORE" : "SUSPEND_STORE",
      `Changement de statut boutique ${id}`,
      id
    );
  }
};
