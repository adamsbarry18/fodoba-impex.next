"use client"

import { AddEntityButton } from "@/components/forms/add-entity-button"
import { EntityType } from "@/lib/navigation/return-to"

interface FieldWithAddProps {
  entity: EntityType
  returnTo: string
  children: React.ReactNode
}

export function FieldWithAdd({ entity, returnTo, children }: FieldWithAddProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">{children}</div>
      <AddEntityButton entity={entity} returnTo={returnTo} />
    </div>
  )
}
