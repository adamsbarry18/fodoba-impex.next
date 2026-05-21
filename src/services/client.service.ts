
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
  where,
  runTransaction
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Client, ClientPayment, UserProfile } from "@/lib/types";
import { CashService } from "./cash.service";

const COLLECTION_NAME = "clients";
const PAYMENTS_COLLECTION = "client_payments";

export const ClientService = {
  async createClient(data: Omit<Client, "id" | "createdAt" | "currentDebt">) {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const client: Client = {
      ...data,
      id: newDocRef.id,
      currentDebt: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(newDocRef, client);
    return client;
  },

  async updateClient(id: string, data: Partial<Client>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  },

  async getClient(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Client) : null;
  },

  async listClients() {
    const q = query(collection(db, COLLECTION_NAME), orderBy("name", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as Client);
  },

  async recordPayment(params: {
    clientId: string,
    amount: number,
    method: ClientPayment["method"],
    storeId: string,
    user: UserProfile,
    notes?: string
  }) {
    const { clientId, amount, method, storeId, user, notes } = params;
    
    const session = await CashService.getActiveSession(storeId);
    if (!session) throw new Error("Veuillez ouvrir la caisse pour enregistrer un remboursement.");

    return await runTransaction(db, async (transaction) => {
      const clientRef = doc(db, COLLECTION_NAME, clientId);
      const clientSnap = await transaction.get(clientRef);
      
      if (!clientSnap.exists()) throw new Error("Client introuvable");
      
      const client = clientSnap.data() as Client;
      const newDebt = Math.max(0, client.currentDebt - amount);
      
      transaction.update(clientRef, { currentDebt: newDebt });
      
      const paymentRef = doc(collection(db, PAYMENTS_COLLECTION));
      const payment: ClientPayment = {
        id: paymentRef.id,
        clientId,
        amount,
        method,
        timestamp: serverTimestamp(),
        storeId,
        performedBy: user.uid,
        notes: notes || ""
      };
      
      transaction.set(paymentRef, payment);

      await CashService.recordMovement(transaction, {
        sessionId: session.id,
        storeId,
        type: "IN",
        source: "CLIENT_PAYMENT",
        amount,
        method,
        user,
        relatedDocId: paymentRef.id,
        description: `Remboursement: ${client.name}`
      });
      
      return payment;
    });
  },

  async getClientPayments(clientId: string) {
    const q = query(
      collection(db, PAYMENTS_COLLECTION), 
      where("clientId", "==", clientId),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as ClientPayment);
  },

  async getClientSales(clientId: string) {
    const q = query(
      collection(db, "sales"), 
      where("clientId", "==", clientId),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as any);
  }
};
