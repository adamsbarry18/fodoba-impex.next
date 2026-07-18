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
import { useT } from "@/i18n/context"

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
  const t = useT()
  const label = t(route.labelKey)

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
          {label}
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
      title={label}
      aria-label={label}
    >
      <Link href={href}>
        <Plus className="h-4 w-4" />
      </Link>
    </Button>
  )
}

