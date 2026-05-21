import { Loader2, Store } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="bg-primary/10 p-6 rounded-2xl animate-pulse">
            <Store className="h-12 w-12 text-primary" />
          </div>
          <Loader2 className="absolute -bottom-2 -right-2 h-8 w-8 text-primary animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-headline font-bold text-[#111827]">OmniStock Nexus</h2>
          <p className="text-sm text-gray-400 mt-2 font-medium tracking-wide uppercase text-[10px]">Sécurisation de la connexion en cours...</p>
        </div>
      </div>
    </div>
  )
}
