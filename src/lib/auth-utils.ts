import { z } from "zod"
import type { LucideIcon } from "lucide-react"
import { ShoppingCart, Package, Wallet } from "lucide-react"

export type AuthErrorContext = "login" | "reset" | "changePassword"

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis.")
    .email("Adresse email invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
})

export type LoginFormValues = z.infer<typeof LoginSchema>

export const AUTH_HIGHLIGHTS: { icon: LucideIcon; label: string }[] = [
  { icon: ShoppingCart, label: "Point de vente et encaissement" },
  { icon: Package, label: "Stock multi-boutiques en temps réel" },
  { icon: Wallet, label: "Caisse et trésorerie centralisées" },
]

export function mapAuthErrorCode(
  code: string | undefined,
  context: AuthErrorContext = "login"
): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      if (context === "login") return "Email ou mot de passe incorrect."
      if (context === "changePassword") return "Le mot de passe actuel est incorrect."
      return "Identifiants invalides."
    case "auth/user-disabled":
      return "Ce compte a été désactivé."
    case "auth/too-many-requests":
      return "Trop de tentatives. Veuillez réessayer plus tard."
    case "auth/invalid-email":
      return "Adresse email invalide."
    case "auth/requires-recent-login":
      return "Cette action nécessite une connexion récente. Veuillez vous reconnecter."
    case "auth/weak-password":
      return "Le nouveau mot de passe est trop faible (6 caractères min)."
    default:
      if (context === "reset") {
        return "Impossible d'envoyer l'email de réinitialisation. Vérifiez l'adresse saisie."
      }
      return "Une erreur de sécurité est survenue. Réessayez."
  }
}
