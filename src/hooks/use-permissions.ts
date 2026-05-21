
"use client"

import { useAuth } from "@/lib/contexts/AuthContext";
import { Permission, hasPermission, hasAnyPermission } from "@/lib/auth/permissions";

/**
 * Hook personnalisé pour gérer les autorisations dans les composants.
 */
export function usePermissions() {
  const { userProfile } = useAuth();
  const role = userProfile?.role;

  return {
    /** Vérifie une permission unique */
    can: (permission: Permission) => {
      if (!role) return false;
      return hasPermission(role, permission);
    },

    /** Vérifie si l'utilisateur peut faire l'une des actions */
    canAny: (permissions: Permission[]) => {
      if (!role) return false;
      return hasAnyPermission(role, permissions);
    },

    /** Helpers sémantiques basés*/
    canManageProducts: () => role && hasPermission(role, 'manage:catalog'),
    canManageSales: () => role && hasPermission(role, 'create:sale'),
    canViewGlobalReports: () => role && hasPermission(role, 'view:reports:global'),
    canReconcileCash: () => role && hasPermission(role, 'reconcile:cash'),
    canManageInventory: () => role && hasPermission(role, 'manage:transfers'),

    /** Raccourcis de rôle (à utiliser avec parcimonie, préférer les permissions) */
    role
  };
}
