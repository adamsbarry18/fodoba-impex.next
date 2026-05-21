
"use client"

import { useAuth } from "@/lib/contexts/AuthContext";

/**
 * Hook personnalisé pour accéder facilement au contexte d'authentification.
 */
export function useAuthContext() {
  return useAuth();
}
