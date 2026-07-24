"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { Store, UserProfile } from "@/lib/types"
import { useAuth } from "./AuthContext"
import { StoreService } from "@/services/store.service"
import { toast } from "sonner"
import {
  clearLegacyActiveStoreKey,
  clearStoreWelcomeSession,
  hasStoreWelcomeBeenShown,
  markStoreWelcomeShown,
  readSavedActiveStoreId,
  resolveActiveStore,
  type StoreSelectionSource,
  writeSavedActiveStoreId,
} from "@/lib/store-utils"

interface StoreContextType {
  activeStore: Store | null
  availableStores: Store[]
  setActiveStoreById: (id: string) => void
  loading: boolean
  refreshStores: () => Promise<void>
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

async function fetchStoresForProfile(
  profile: UserProfile,
  isAdmin: boolean
): Promise<Store[]> {
  if (isAdmin) {
    const result = await StoreService.listStores(100)
    return result.stores
  }
  if (profile.storeIds?.length > 0) {
    return StoreService.getStoresByIds(profile.storeIds)
  }
  return []
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { userProfile, isAdmin } = useAuth()
  const [activeStore, setActiveStore] = useState<Store | null>(null)
  const [availableStores, setAvailableStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const loadGenerationRef = useRef(0)
  const lastSelectionSourceRef = useRef<StoreSelectionSource | null>(null)
  const previousUidRef = useRef<string | null>(null)

  const notifyStoreSelection = useCallback(
    (profile: UserProfile, store: Store, source: StoreSelectionSource, storeCount: number) => {
      if (hasStoreWelcomeBeenShown(profile.uid)) return
      markStoreWelcomeShown(profile.uid)

      if (storeCount === 1 || source === "single") {
        toast.success(`Bienvenue - ${store.name}`, {
          description: "Votre boutique a été activée automatiquement.",
        })
        return
      }

      if (source === "saved") {
        toast.info(`Boutique active : ${store.name}`, {
          description: "Dernière boutique utilisée avant votre déconnexion.",
        })
        return
      }

      toast.info(`Boutique active : ${store.name}`, {
        description: "Changez de boutique depuis l'en-tête si nécessaire.",
      })
    },
    []
  )

  const applyStoreSelection = useCallback(
    (profile: UserProfile, stores: Store[]) => {
      const preferredDefaultId =
        profile.storeIds?.find((id) => stores.some((store) => store.id === id)) ?? null
      const { store, source } = resolveActiveStore(
        stores,
        readSavedActiveStoreId(profile.uid),
        preferredDefaultId
      )

      lastSelectionSourceRef.current = source
      setActiveStore(store)

      if (store) {
        writeSavedActiveStoreId(profile.uid, store.id)
        if (source) {
          notifyStoreSelection(profile, store, source, stores.length)
        }
      }
    },
    [notifyStoreSelection]
  )

  const loadStoresForUser = useCallback(async () => {
    const generation = ++loadGenerationRef.current

    if (!userProfile) {
      if (previousUidRef.current) {
        clearStoreWelcomeSession(previousUidRef.current)
      }
      previousUidRef.current = null
      lastSelectionSourceRef.current = null
      setAvailableStores([])
      setActiveStore(null)
      setLoading(false)
      clearLegacyActiveStoreKey()
      return
    }

    if (previousUidRef.current && previousUidRef.current !== userProfile.uid) {
      clearStoreWelcomeSession(previousUidRef.current)
    }
    previousUidRef.current = userProfile.uid

    setActiveStore(null)
    setLoading(true)

    try {
      const stores = await fetchStoresForProfile(userProfile, isAdmin)

      if (loadGenerationRef.current !== generation) return

      setAvailableStores(stores)
      applyStoreSelection(userProfile, stores)
    } catch (error) {
      if (loadGenerationRef.current !== generation) return
      console.error("Erreur lors du chargement des boutiques:", error)
      setAvailableStores([])
      setActiveStore(null)
    } finally {
      if (loadGenerationRef.current === generation) {
        setLoading(false)
      }
    }
  }, [userProfile, isAdmin, applyStoreSelection])

  const storeIdsKey = userProfile?.storeIds?.join(",") ?? ""

  useEffect(() => {
    void loadStoresForUser()
  }, [userProfile?.uid, isAdmin, storeIdsKey, loadStoresForUser])

  const setActiveStoreById = (id: string) => {
    const store = availableStores.find((s) => s.id === id)
    if (store && userProfile) {
      setActiveStore(store)
      writeSavedActiveStoreId(userProfile.uid, id)
      lastSelectionSourceRef.current = "saved"
    }
  }

  return (
    <StoreContext.Provider
      value={{
        activeStore,
        availableStores,
        setActiveStoreById,
        loading,
        refreshStores: loadStoresForUser,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider")
  }
  return context
}
