
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  deleteDoc,
  writeBatch,
  onSnapshot,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AppNotification } from "@/lib/types";
import { stripUndefined } from "@/lib/firestore-utils";

const COLLECTION_NAME = "notifications";
const MAX_NOTIFICATIONS = 50;

function applyNotificationFilters(
  notifications: AppNotification[],
  filters: { storeId?: string; userId?: string }
): AppNotification[] {
  let notes = notifications;

  if (filters.storeId) {
    notes = notes.filter((n) => !n.storeId || n.storeId === filters.storeId);
  }

  if (filters.userId) {
    notes = notes.filter((n) => !n.userId || n.userId === filters.userId);
  }

  return notes;
}

export const NotificationService = {
  /**
   * Notifications in-app persistées dans Firestore (pas de push FCM).
   */
  async createNotification(data: Omit<AppNotification, "id" | "timestamp" | "read">) {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const notification: AppNotification = {
      ...data,
      id: newDocRef.id,
      read: false,
      timestamp: serverTimestamp(),
    };
    await setDoc(newDocRef, stripUndefined(notification));
    return notification;
  },

  async markAsRead(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { read: true });
  },

  async markAllAsRead(ids: string[]) {
    if (ids.length === 0) return;
    const batch = writeBatch(db);
    ids.forEach((id) => batch.update(doc(db, COLLECTION_NAME, id), { read: true }));
    await batch.commit();
  },

  async deleteNotification(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  async hasExpirationAlert(productId: string, expirationDate: string): Promise<boolean> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("type", "==", "EXPIRATION_ALERT"),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.some((docSnap) => {
      const notification = docSnap.data() as AppNotification;
      return (
        notification.relatedProductId === productId &&
        notification.relatedExpirationDate === expirationDate
      );
    });
  },

  async clearAll(filters: { storeId?: string; userId?: string }) {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("timestamp", "desc"),
      limit(MAX_NOTIFICATIONS)
    );
    const snap = await getDocs(q);
    const targets = applyNotificationFilters(
      snap.docs.map((d) => d.data() as AppNotification),
      filters
    );

    if (targets.length === 0) return;

    const batch = writeBatch(db);
    targets.forEach((notification) => {
      batch.delete(doc(db, COLLECTION_NAME, notification.id));
    });
    await batch.commit();
  },

  subscribe(
    filters: { storeId?: string; userId?: string },
    callback: (notifications: AppNotification[]) => void,
    onError?: (error: Error) => void
  ) {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("timestamp", "desc"),
      limit(MAX_NOTIFICATIONS)
    );

    return onSnapshot(
      q,
      (snap) => {
        const notes = applyNotificationFilters(
          snap.docs.map((d) => d.data() as AppNotification),
          filters
        );
        callback(notes);
      },
      (error) => {
        console.error("[NotificationService.subscribe]", error);
        onError?.(error);
      }
    );
  },
};
