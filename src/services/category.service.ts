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
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Category } from "@/lib/types";
import { stripUndefined } from "@/lib/firestore-utils";

const COLLECTION_NAME = "categories";

export const CategoryService = {
  async createCategory(data: Omit<Category, "id">) {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const category: Category = {
      ...data,
      id: newDocRef.id,
      createdAt: serverTimestamp(),
    };
    await setDoc(newDocRef, stripUndefined(category));
    return category;
  },

  async updateCategory(id: string, data: Partial<Category>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, stripUndefined(data));
  },

  async getCategory(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Category) : null;
  },

  async listCategories() {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("name", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as Category);
  },

  async deleteCategory(id: string) {
    // Note: In a real system, check if category is used by products first
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  async toggleStatus(id: string, active: boolean) {
    await this.updateCategory(id, { active });
  }
};
