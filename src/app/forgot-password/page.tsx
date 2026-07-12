"use client"

import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AppLogo } from "@/components/layout/app-logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      toast.success("Email de réinitialisation envoyé !");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8f9fa] p-4">
      <Card className="w-full max-w-[440px] border-none shadow-[0_10px_40px_rgba(0,0,0,0.04)] rounded-[24px] overflow-hidden bg-white">
        <CardContent className="p-8 md:p-12">
          {/* Logo Section */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <AppLogo size="md" />
            <span className="font-headline font-bold text-2xl tracking-tight text-[#111827]">FODOBA IMPEX</span>
          </div>

          <div className="mb-10">
            <h1 className="text-[28px] font-bold text-[#111827] mb-2 leading-tight">Réinitialisation</h1>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              Saisissez votre email professionnel pour recevoir un lien sécurisé.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="email" required className="text-[14px] font-semibold text-[#374151] ml-0.5">Email professionnel</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nom@fodoba.com" 
                  className="pl-12 h-12 bg-white border-[#e5e7eb] rounded-xl focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary transition-all text-[15px]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button 
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-[16px] transition-all rounded-xl mt-4 shadow-lg shadow-primary/20" 
              type="submit" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 v-5 animate-spin mr-2" /> : "Envoyer le lien"}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <Button variant="link" asChild className="text-gray-500 hover:text-primary text-[14px] font-medium transition-colors">
              <Link href="/login" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
