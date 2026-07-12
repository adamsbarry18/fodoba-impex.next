import { AppLogo } from "@/components/layout/app-logo"
import { cn } from "@/lib/utils"

interface LoadingScreenProps {
  /** Titre affiché sous le logo */
  title?: string
  /** Message de statut pour l'utilisateur et les lecteurs d'écran */
  message?: string
  /** Plein écran (overlay) ou bloc inline */
  fullScreen?: boolean
  className?: string
}

export function LoadingScreen({
  title = "FODOBA IMPEX",
  message = "Vérification de votre session…",
  fullScreen = true,
  className,
}: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
      className={cn(
        "flex items-center justify-center",
        fullScreen
          ? "fixed inset-0 z-50 bg-muted/50 backdrop-blur-[2px]"
          : "min-h-[12rem] w-full rounded-2xl bg-muted/30",
        className
      )}
    >
      <div className="flex flex-col items-center gap-5 rounded-2xl border bg-card/95 px-10 py-8 shadow-lg">
        <div className="relative flex h-[5.5rem] w-[5.5rem] items-center justify-center">
          <div
            className="absolute inset-0 animate-spin rounded-full border-2 border-primary/15 border-t-primary"
            aria-hidden
          />
          <AppLogo size="lg" className="relative z-10 shadow-sm" />
        </div>

        <div className="space-y-1.5 text-center">
          <h2 className="font-headline text-xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-xs font-medium text-muted-foreground">{message}</p>
        </div>
      </div>

      <span className="sr-only">{message}</span>
    </div>
  )
}
