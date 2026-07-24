"use client"

import Link from "next/link"
import { Store as StoreIcon, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useT } from "@/i18n/context"

type FirstStoreOnboardingProps = {
  userName?: string
}

export function FirstStoreOnboarding({ userName }: FirstStoreOnboardingProps) {
  const t = useT()

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <StoreIcon className="h-7 w-7 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {userName ? (
            <>
              {t("onboarding.welcomePrefix")}{" "}
              <span className="text-primary">{userName}</span>
            </>
          ) : (
            t("onboarding.welcome")
          )}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t("onboarding.firstStoreDesc")}
        </p>
      </div>

      <Card className="w-full rounded-2xl border border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-start gap-3 text-left">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">{t("onboarding.firstStoreHint")}</p>
          </div>
          <Button asChild size="lg" className="w-full rounded-xl font-semibold">
            <Link href="/admin/stores/new?setup=1">
              {t("onboarding.createStoreCta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
