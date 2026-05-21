
"use client"

import React, { createContext, useContext, useEffect, useState } from "react";
import { Store } from "@/lib/types";
import { useAuth } from "./AuthContext";
import { StoreService } from "@/services/store.service";

interface StoreContextType {
  activeStore: Store | null;
  availableStores: Store[];
  setActiveStoreById: (id: string) => void;
  loading: boolean;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { userProfile, isAdmin, isManager } = useAuth();
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshStores = async () => {
    if (!userProfile) {
      setAvailableStores([]);
      setActiveStore(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let stores: Store[] = [];
      // CDC Section 2.1 : L'Admin et le Gérant peuvent naviguer entre les boutiques
      if (isAdmin || isManager) {
        const result = await StoreService.listStores(100);
        stores = result.stores;
      } else if (userProfile.boutiqueIds?.length > 0) {
        stores = await StoreService.getStoresByIds(userProfile.boutiqueIds);
      }

      setAvailableStores(stores);

      // Restaurer la boutique active de la session si possible
      const savedId = localStorage.getItem("activeStoreId");
      const found = stores.find(s => s.id === savedId) || stores[0] || null;
      setActiveStore(found);
    } catch (error) {
      console.error("Erreur lors du chargement des boutiques:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStores();
  }, [userProfile, isAdmin, isManager]);

  const setActiveStoreById = (id: string) => {
    const store = availableStores.find(s => s.id === id);
    if (store) {
      setActiveStore(store);
      localStorage.setItem("activeStoreId", id);
    }
  };

  return (
    <StoreContext.Provider value={{ 
      activeStore, 
      availableStores, 
      setActiveStoreById, 
      loading,
      refreshStores
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
