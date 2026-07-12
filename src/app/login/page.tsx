"use client"

import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Connexion réussie");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8f9fa] p-4 overflow-hidden">
      <Card className="w-full max-w-[420px] border-none shadow-[0_10px_40px_rgba(0,0,0,0.04)] rounded-[24px] overflow-hidden bg-white">
        <CardContent className="p-6 md:p-10">
          {/* Logo Section - Centered */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-primary rounded-xl p-2 shadow-sm shadow-primary/20">
              <img src="/images/logo.png" alt="FODOBA IMPEX" className="w-6 h-6" />
            </div>
            <span className="font-headline font-bold text-xl tracking-tight text-[#111827]">FODOBA IMPEX</span>
          </div>

          {/* Description Section - Left Aligned */}
          <div className="mb-6">
            <p className="text-[14px] text-gray-500 leading-relaxed">
              Saisissez vos identifiants pour accéder à votre espace commercial.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-semibold text-[#374151] ml-0.5">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nom@fodoba.com" 
                className="h-11 bg-white border-[#e5e7eb] rounded-xl focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary transition-all text-[14px] px-4"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-0.5">
                <Label htmlFor="password" title="Mot de passe" className="text-[13px] font-semibold text-[#374151]">Mot de passe</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="h-11 bg-white border-[#e5e7eb] rounded-xl focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary transition-all text-[14px] px-4 pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold text-[15px] transition-all rounded-xl mt-2 shadow-lg shadow-primary/20" 
              type="submit" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
