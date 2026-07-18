import { z } from "zod"
import type { LucideIcon } from "lucide-react"
import { ShoppingCart, Package, Wallet } from "lucide-react"

export type AuthErrorContext = "login" | "reset" | "changePassword"

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "auth.validation.emailRequired")
    .email("auth.validation.emailInvalid"),
  password: z.string().min(1, "auth.validation.passwordRequired"),
})

export type LoginFormValues = z.infer<typeof LoginSchema>

export const AUTH_HIGHLIGHTS: { icon: LucideIcon; label: string }[] = [
  { icon: ShoppingCart, label: "auth.highlight.pos" },
  { icon: Package, label: "auth.highlight.stock" },
  { icon: Wallet, label: "auth.highlight.cash" },
]

export function mapAuthErrorCode(
  code: string | undefined,
  context: AuthErrorContext = "login"
): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      if (context === "login") return "auth.error.wrongCredentials"
      if (context === "changePassword") return "auth.error.wrongCurrentPassword"
      return "auth.error.invalidCredentials"
    case "auth/user-disabled":
      return "auth.error.userDisabled"
    case "auth/too-many-requests":
      return "auth.error.tooManyRequests"
    case "auth/invalid-email":
      return "auth.error.invalidEmail"
    case "auth/requires-recent-login":
      return "auth.error.requiresRecentLogin"
    case "auth/weak-password":
      return "auth.error.weakPassword"
    default:
      if (context === "reset") {
        return "auth.error.resetFailed"
      }
      return "auth.error.generic"
  }
}
