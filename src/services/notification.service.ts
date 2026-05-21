
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  deleteDoc,
  writeBatch,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AppNotification } from "@/lib/types";

const COLLECTION_NAME = "notifications";

export const NotificationService = {
  /**
   * Crée une nouvelle notification
   */
  async createNotification(data: Omit<AppNotification, "id" | "timestamp" | "read">) {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const notification: AppNotification = {
      ...data,
      id: newDocRef.id,
      read: false,
      timestamp: serverTimestamp(),
    };
    await setDoc(newDocRef, notification);
    return notification;
  },

  /**
   * Marquer comme lu
   */
  async markAsRead(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { read: true });
  },

  /**
   * Supprimer une notification
   */
  async deleteNotification(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  /**
   * Supprimer toutes les notifications d'un utilisateur/boutique
   */
  async clearAll(filters: { storeId?: string, userId?: string }) {
    let q = query(collection(db, COLLECTION_NAME));
    if (filters.storeId) q = query(q, where("storeId", "==", filters.storeId));
    if (filters.userId) q = query(q, where("userId", "==", filters.userId));
    
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  },

  /**
   * S'abonner aux notifications en temps réel
   */
  subscribe(filters: { storeId?: string, userId?: string }, callback: (notifications: AppNotification[]) => void) {
    let q = query(collection(db, COLLECTION_NAME), orderBy("timestamp", "desc"), limit(50));
    
    // Note: Pour un prototype, on filtre en mémoire si possible ou on utilise des index si configurés.
    // Ici on simplifie pour éviter les erreurs d'index composite.
    
    return onSnapshot(q, (snap) => {
      let notes = snap.docs.map(d => d.data() as AppNotification);
      
      if (filters.storeId) {
        notes = notes.filter(n => n.storeId === filters.storeId || !n.storeId);
      }
      
      callback(notes);
    });
  }
};
