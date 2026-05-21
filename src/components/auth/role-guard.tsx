
"use client"

import { ReactNode } from "react";
import { Permission } from "@/lib/auth/permissions";
import { usePermissions } from "@/hooks/use-permissions";

interface RoleGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

/**
 * Composant Wrapper pour protéger des éléments d'interface.
 * Utilisation : <RoleGuard permission="manage:catalog"> <MonBouton /> </RoleGuard>
 */
export function RoleGuard({ 
  children, 
  permission, 
  permissions, 
  requireAll = false,
  fallback = null 
}: RoleGuardProps) {
  const { can } = usePermissions();

  if (permission && !can(permission)) {
    return <>{fallback}</>;
  }

  if (permissions) {
    const hasAccess = requireAll 
      ? permissions.every(p => can(p))
      : permissions.some(p => can(p));
    
    if (!hasAccess) return <>{fallback}</>;
  }

  return <>{children}</>;
}
