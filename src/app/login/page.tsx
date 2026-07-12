"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/lib/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Loader2, LogIn, Mail, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { PasswordField } from "@/components/auth/password-field"
import { LoginSchema, type LoginFormValues } from "@/lib/auth-utils"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true)
    try {
      await login(values.email.trim(), values.password)
      toast.success("Connexion réussie")
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Impossible de se connecter."
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell
      title="Connexion"
      description="Accédez à votre espace de gestion commerciale."
      footer={
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Connexion sécurisée — en cas de problème, contactez votre administrateur.
        </p>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel required className="text-sm font-medium">
                  Email professionnel
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      type="email"
                      placeholder="nom@fodoba.com"
                      autoComplete="email"
                      className="h-11 rounded-xl pl-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-2">
                  <FormLabel required className="text-sm font-medium">
                    Mot de passe
                  </FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <FormControl>
                  <PasswordField
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="mt-2 h-11 w-full rounded-xl font-semibold"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LogIn className="mr-2 h-4 w-4" aria-hidden />
            )}
            Se connecter
          </Button>
        </form>
      </Form>
    </AuthPageShell>
  )
}
