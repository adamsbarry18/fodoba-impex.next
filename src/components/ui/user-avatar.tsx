"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  getUserAvatarSeed,
  getUserAvatarStyle,
  getUserInitials,
} from "@/lib/user-utils"

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-20 w-20 text-lg",
} as const

export interface UserAvatarUser {
  uid?: string
  email?: string
  prenom: string
  nom: string
  photoURL?: string
}

interface UserAvatarProps {
  user: UserAvatarUser
  size?: keyof typeof SIZE_CLASSES
  className?: string
  fallbackClassName?: string
}

export function UserAvatar({
  user,
  size = "md",
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const avatarStyle = getUserAvatarStyle(getUserAvatarSeed(user))

  return (
    <Avatar className={cn(SIZE_CLASSES[size], className)}>
      {user.photoURL ? <AvatarImage src={user.photoURL} alt="" /> : null}
      <AvatarFallback
        className={cn("font-bold", fallbackClassName)}
        style={avatarStyle}
      >
        {getUserInitials(user)}
      </AvatarFallback>
    </Avatar>
  )
}
