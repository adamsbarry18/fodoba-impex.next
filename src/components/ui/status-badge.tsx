import * as React from "react"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { BADGE_PRESETS, resolvePreset, toneFromString, type BadgeTone } from "@/lib/badge-tones"
import { cn } from "@/lib/utils"

type PresetKey = keyof typeof BADGE_PRESETS

interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  tone?: BadgeTone
  preset?: PresetKey
  value?: string
  /** Dérive une couleur stable à partir du texte affiché (utile pour catégories, audits…). */
  hashFromLabel?: boolean
  icon?: React.ReactNode
}

function StatusBadge({
  tone,
  preset,
  value,
  hashFromLabel,
  icon,
  children,
  className,
  ...props
}: StatusBadgeProps) {
  let resolvedTone: BadgeTone = tone ?? "outline"
  let label = children ?? value ?? ""

  if (preset && value) {
    const config = resolvePreset(preset, value)
    if (config) {
      resolvedTone = config.tone
      if (!children && config.label) label = config.label
    }
  }

  if (hashFromLabel && typeof label === "string" && label.length > 0) {
    resolvedTone = toneFromString(label)
  }

  return (
    <Badge variant={resolvedTone} className={cn("gap-1 capitalize", className)} {...props}>
      {icon}
      {label}
    </Badge>
  )
}

export { StatusBadge }
