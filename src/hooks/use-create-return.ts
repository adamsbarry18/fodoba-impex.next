"use client"

import { useRouter } from "next/navigation"
import {
  buildUrlAfterCreate,
  readReturnContext,
} from "@/lib/navigation/return-to"

export function useCreateReturn(defaultPath: string, defaultSelectedParam: string) {
  const router = useRouter()

  const redirectAfterCreate = (createdId: string) => {
    const { returnTo, selectedParam } = readReturnContext(defaultSelectedParam)
    if (returnTo) {
      router.push(buildUrlAfterCreate(returnTo, selectedParam, createdId))
      return
    }
    router.push(defaultPath)
  }

  const { returnTo } = readReturnContext(defaultSelectedParam)
  const cancelHref = returnTo || defaultPath

  return {
    returnTo,
    redirectAfterCreate,
    cancelHref,
    hasReturnTo: Boolean(returnTo),
  }
}
