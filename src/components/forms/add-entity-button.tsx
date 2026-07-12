"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ENTITY_ROUTES,
  EntityType,
  buildCreateEntityUrl,
} from "@/lib/navigation/return-to"

interface AddEntityButtonProps {
  entity: EntityType
  returnTo: string
  className?: string
  size?: "icon" | "sm"
}

export function AddEntityButton({
  entity,
  returnTo,
  className,
  size = "icon",
}: AddEntityButtonProps) {
  const route = ENTITY_ROUTES[entity]
  const href = buildCreateEntityUrl(route.create, returnTo, route.param)

  if (size === "sm") {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("shrink-0 rounded-xl font-semibold", className)}
        asChild
      >
        <Link href={href}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {route.label}
        </Link>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("h-10 w-10 shrink-0 rounded-xl", className)}
      asChild
      title={route.label}
      aria-label={route.label}
    >
      <Link href={href}>
        <Plus className="h-4 w-4" />
      </Link>
    </Button>
  )
}
