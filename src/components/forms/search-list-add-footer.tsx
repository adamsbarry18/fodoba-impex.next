"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import {
  ENTITY_ROUTES,
  EntityType,
  buildCreateEntityUrl,
} from "@/lib/navigation/return-to"

interface SearchListAddFooterProps {
  entity: EntityType
  returnTo: string
}

export function SearchListAddFooter({ entity, returnTo }: SearchListAddFooterProps) {
  const route = ENTITY_ROUTES[entity]
  const href = buildCreateEntityUrl(route.create, returnTo, route.param)

  return (
    <div className="border-t border-border bg-muted/20 p-2">
      <Link
        href={href}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-primary transition-colors hover:bg-muted"
      >
        <Plus className="h-3.5 w-3.5 shrink-0" />
        {route.label}
      </Link>
    </div>
  )
}
