"use client"

import { AppLogo } from "@/components/layout/app-logo"
import { AUTH_HIGHLIGHTS } from "@/lib/auth-utils"
import { cn } from "@/lib/utils"
import { useT } from "@/i18n/context"

interface AuthPageShellProps {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function AuthPageShell({
  title,
  description,
  children,
  footer,
  className,
}: AuthPageShellProps) {
  const t = useT()

  return (
    <div className="flex min-h-screen w-full">
      <aside
        className={cn(
          "relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:w-[44%] xl:w-[48%]"
        )}
        aria-hidden
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-black/10 blur-3xl"
          aria-hidden
        />

        <div className="relative flex items-center gap-4">
          <div className="shrink-0 rounded-full bg-white p-1.5 shadow-lg shadow-black/10 ring-1 ring-white/40">
            <AppLogo size="hero" className="ring-0 shadow-none" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-headline text-xl font-bold tracking-tight xl:text-2xl">
              {t("common.appName")}
            </p>
            <p className="text-sm text-primary-foreground/75">{t("sidebar.importExport")}</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <div className="space-y-2">
            <h2 className="font-headline text-2xl font-bold leading-tight xl:text-3xl">
              {t("auth.heroTitle")}
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-primary-foreground/80">
              {t("auth.heroDesc")}
            </p>
          </div>

          <ul className="space-y-3">
            {AUTH_HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm font-medium">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                {t(label)}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          {t("auth.accessRestricted")}
        </p>
      </aside>

      <main
        className={cn(
          "flex flex-1 items-center justify-center bg-muted/30 p-4 sm:p-6",
          className
        )}
      >
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="rounded-full bg-white p-1.5 shadow-md ring-1 ring-border/50">
              <AppLogo size="2xl" className="ring-0 shadow-none" />
            </div>
            <p className="mt-4 font-headline text-xl font-bold tracking-tight text-foreground">
              {t("common.appName")}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("sidebar.importExport")}</p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
            <div className="mb-6 space-y-1.5">
              <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            {children}

            {footer ? <div className="mt-6 border-t pt-5">{footer}</div> : null}
          </div>
        </div>
      </main>
    </div>
  )
}
