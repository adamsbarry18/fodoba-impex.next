
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
  limit,
  startAfter,
  DocumentSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Product, StockLevel } from "@/lib/types";
import { stripUndefined } from "@/lib/firestore-utils";
import { computeInitialStockTotal } from "@/lib/product-utils";
import {
  buildDecomposedStock,
  buildStockLevelPayload,
  normalizeStockLevel,
  type DecomposedStock,
} from "@/lib/stock-utils";
import { AppNotificationHelper } from "@/lib/notifications/app-notification-helper";

const COLLECTION_NAME = "products";
const STOCKS_COLLECTION = "stocks";

export const ProductService = {
  async createProduct(data: Omit<Product, "id" | "createdAt">) {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const product: Product = {
      ...data,
      id: newDocRef.id,
      createdAt: serverTimestamp(),
    };
    await setDoc(newDocRef, stripUndefined(product));
    void AppNotificationHelper.notifyProductExpiration({ product });
    return product;
  },

  async createProductWithInitialStock(
    data: Omit<Product, "id" | "createdAt">,
    options: {
      storeId: string
      initialStockPackaging?: number
      detailStock?: number
    }
  ) {
    const product = await this.createProduct(data);
    const totalStock = computeInitialStockTotal(
      options.initialStockPackaging ?? 0,
      data.unitsPerPack ?? 1,
      options.detailStock ?? 0
    );

    if (totalStock > 0) {
      await this.setStockDecomposed(
        product.id,
        options.storeId,
        options.initialStockPackaging ?? 0,
        options.detailStock ?? 0,
        data.unitsPerPack ?? 1
      );
    }

    void AppNotificationHelper.notifyProductExpiration({
      product,
      storeId: options.storeId,
    });

    return product;
  },

  /** Enregistre l'image dans public/uploads/ et retourne l'URL relative (ex. /uploads/products/…). */
  async uploadProductImage(productId: string, file: File): Promise<string> {
    const maxSize = 4.5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("Image too large (max 4.5 MB)");
    }
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image");
    }

    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("file", file);

    const response = await fetch("/api/uploads/product-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(body?.message || "Upload failed");
    }

    const { url } = (await response.json()) as { url: string };
    return url;
  },

  async updateProduct(id: string, data: Partial<Product>, options?: { storeId?: string }) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, stripUndefined(data));
    const product = await this.getProduct(id);
    if (product) {
      void AppNotificationHelper.notifyProductExpiration({
        product,
        storeId: options?.storeId,
      });
    }
  },

  async getProduct(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Product) : null;
  },

  /**
   * Version optimisée pour prototype (évite les index composites)
   */
  async listProducts(filters?: { categoryId?: string; active?: boolean }, pageSize = 25, lastVisible?: DocumentSnapshot) {
    let constraints: any[] = [];

    // Filtres d'égalité simples (ne nécessitent pas d'index si pas de orderBy sur un autre champ)
    if (filters?.categoryId) {
      constraints.push(where("categoryId", "==", filters.categoryId));
    }
    if (filters?.active !== undefined) {
      constraints.push(where("active", "==", filters.active));
    }

    // On n'ajoute le orderBy QUE s'il n'y a pas d'autres filtres pour éviter l'erreur d'index manquant
    if (constraints.length === 0) {
      constraints.push(orderBy("name", "asc"));
    }
    
    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }
    
    constraints.push(limit(pageSize));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const snap = await getDocs(q);
    
    let products = snap.docs.map(doc => doc.data() as Product);
    
    // Tri en mémoire si on a des filtres (car le orderBy a été omis de la requête)
    if (constraints.length > 0 && !constraints.some(c => c.type === 'orderBy')) {
      products.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return {
      products,
      lastVisible: snap.docs[snap.docs.length - 1],
    };
  },

  async searchProducts(searchTerm: string) {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("active", "==", true),
      limit(50)
    );
    const snap = await getDocs(q);
    const all = snap.docs.map(doc => doc.data() as Product);
    return all.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.sku.toLowerCase().includes(term) || 
      p.barcode?.toLowerCase().includes(term)
    );
  },

  /** Recherche exacte code-barres / SKU / ID produit (scan). */
  async findProductByCode(code: string): Promise<Product | null> {
    const trimmed = code.trim();
    if (!trimmed) return null;

    const byBarcode = query(
      collection(db, COLLECTION_NAME),
      where("active", "==", true),
      where("barcode", "==", trimmed),
      limit(1)
    );
    const barcodeSnap = await getDocs(byBarcode);
    if (!barcodeSnap.empty) {
      return barcodeSnap.docs[0].data() as Product;
    }

    const bySku = query(
      collection(db, COLLECTION_NAME),
      where("active", "==", true),
      where("sku", "==", trimmed),
      limit(1)
    );
    const skuSnap = await getDocs(bySku);
    if (!skuSnap.empty) {
      return skuSnap.docs[0].data() as Product;
    }

    const idRef = doc(db, COLLECTION_NAME, trimmed);
    const idSnap = await getDoc(idRef);
    if (idSnap.exists()) {
      const product = idSnap.data() as Product;
      if (product.active) return product;
    }

    const fuzzy = await this.searchProducts(trimmed);
    const exactFuzzy = fuzzy.find(
      (p) =>
        p.barcode?.toLowerCase() === trimmed.toLowerCase() ||
        p.sku.toLowerCase() === trimmed.toLowerCase() ||
        p.id === trimmed
    );
    return exactFuzzy ?? fuzzy[0] ?? null;
  },

  async getStockLevel(productId: string, storeId: string): Promise<number> {
    const record = await this.getStockRecord(productId, storeId);
    return record?.quantity ?? 0;
  },

  async getStockRecord(
    productId: string,
    storeId: string,
    unitsPerPack = 1
  ): Promise<DecomposedStock> {
    const stockId = `${storeId}_${productId}`;
    const docRef = doc(db, STOCKS_COLLECTION, stockId);
    const snap = await getDoc(docRef);
    return normalizeStockLevel(
      snap.exists() ? (snap.data() as StockLevel) : null,
      unitsPerPack
    );
  },

  async getStockLevelsForProducts(productIds: string[], storeId: string): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    await Promise.all(productIds.map(async (pid) => {
      results[pid] = await this.getStockLevel(pid, storeId);
    }));
    return results;
  },

  async setStockDecomposed(
    productId: string,
    storeId: string,
    packagingQty: number,
    detailQty: number,
    unitsPerPack = 1
  ) {
    const decomposed = buildDecomposedStock(packagingQty, detailQty, unitsPerPack);
    const stockId = `${storeId}_${productId}`;
    const docRef = doc(db, STOCKS_COLLECTION, stockId);
    await setDoc(docRef, {
      ...buildStockLevelPayload(productId, storeId, decomposed),
      lastUpdated: serverTimestamp(),
    });
  },

  async setStockLevel(productId: string, storeId: string, quantity: number) {
    const stockId = `${storeId}_${productId}`;
    const docRef = doc(db, STOCKS_COLLECTION, stockId);
    const stock: StockLevel = {
      productId,
      storeId,
      quantity: Math.max(0, quantity),
      lastUpdated: serverTimestamp(),
    };
    await setDoc(docRef, stock);
  },

  async updateStockLevel(productId: string, storeId: string, delta: number) {
    const stockId = `${storeId}_${productId}`;
    const docRef = doc(db, STOCKS_COLLECTION, stockId);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      const current = snap.data() as StockLevel;
      await updateDoc(docRef, { 
        quantity: Math.max(0, current.quantity + delta),
        lastUpdated: serverTimestamp()
      });
    } else {
      const newStock: StockLevel = {
        productId,
        storeId,
        quantity: Math.max(0, delta),
        lastUpdated: serverTimestamp()
      };
      await setDoc(docRef, newStock);
    }
  }
};
