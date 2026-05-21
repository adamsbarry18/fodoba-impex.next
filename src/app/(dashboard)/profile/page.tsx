
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useStore } from "@/lib/contexts/StoreContext"
import { UserService } from "@/services/user.service"
import { AuthService } from "@/services/auth.service"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  UserCircle, 
  Mail, 
  Shield, 
  Building2, 
  Phone, 
  Loader2,
  Key,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { userProfile } = useAuth()
  const { activeStore } = useStore()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    phone: ""
  })

  // Password change state
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false })
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" })

  useEffect(() => {
    if (userProfile) {
      setFormData({
        prenom: userProfile.prenom || "",
        nom: userProfile.nom || "",
        phone: userProfile.phone || ""
      })
    }
  }, [userProfile])

  const handleSave = async () => {
    if (!userProfile) return
    setLoading(true)
    try {
      await UserService.updateUserProfile(userProfile.uid, formData)
      toast.success("Profil mis à jour avec succès")
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!passData.current || !passData.new || !passData.confirm) {
      toast.error("Veuillez remplir tous les champs de mot de passe")
      return
    }
    if (passData.new !== passData.confirm) {
      toast.error("La confirmation ne correspond pas au nouveau mot de passe")
      return
    }
    if (passData.new.length < 6) {
      toast.error("Le nouveau mot de passe doit faire au moins 6 caractères")
      return
    }

    setPasswordLoading(true)
    try {
      await AuthService.changePassword(passData.current, passData.new)
      toast.success("Mot de passe mis à jour avec succès")
      setPassData({ current: "", new: "", confirm: "" })
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!userProfile) return null

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'manager': return 'Gérant';
      default: return 'Vendeur';
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {/* Header Title */}
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-2.5 rounded-2xl">
          <UserCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Mon profil</h1>
      </div>

      {/* Basic Info Card */}
      <Card className="border-none shadow-[0_10px_40px_rgba(0,0,0,0.04)] rounded-[24px] overflow-hidden bg-white">
        <CardContent className="p-8 md:p-12 space-y-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-gray-50 bg-primary flex items-center justify-center shadow-sm">
              <AvatarImage src={userProfile.photoURL} />
              <AvatarFallback className="bg-transparent text-white font-bold text-3xl">
                {userProfile.prenom?.[0].toUpperCase()}{userProfile.nom?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{userProfile.prenom} {userProfile.nom}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 text-gray-500 text-[14px] font-medium">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {userProfile.email}
                </div>
                <Badge variant="secondary" className="bg-secondary text-gray-600 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border-none text-[12px]">
                  <Shield className="w-3.5 h-3.5" />
                  {getRoleLabel(userProfile.role)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-[24px] p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-[0.1em] text-[11px]">
              <Building2 className="w-4 h-4" />
              Boutique active (travail courant)
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">{activeStore?.name || "Aucune boutique sélectionnée"}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed max-w-xl">
                Changez de magasin via le menu en haut de l'écran. L'accès couvre toutes les boutiques ({userProfile.boutiqueIds?.length || 0} enregistrée{userProfile.boutiqueIds?.length > 1 ? 's' : ''}).
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <Label className="text-[14px] font-bold text-gray-700 ml-1">Prénom</Label>
                <Input 
                  value={formData.prenom}
                  onChange={e => setFormData({...formData, prenom: e.target.value})}
                  className="h-12 bg-gray-50 border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all text-[15px] px-5 font-medium"
                />
              </div>
              <div className="space-y-2.5">
                <Label className="text-[14px] font-bold text-gray-700 ml-1">Nom</Label>
                <Input 
                  value={formData.nom}
                  onChange={e => setFormData({...formData, nom: e.target.value})}
                  className="h-12 bg-gray-50 border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all text-[15px] px-5 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[14px] font-bold text-gray-700 ml-1">
                <Phone className="w-4 h-4 text-gray-400" />
                Téléphone
              </div>
              <Input 
                placeholder="+224 ..."
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="h-12 bg-gray-50 border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all text-[15px] px-5 font-medium"
              />
            </div>

            <Button 
              onClick={handleSave}
              disabled={loading}
              className="h-12 px-10 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 text-[15px]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Enregistrer les modifications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card className="border-none shadow-[0_10px_40px_rgba(0,0,0,0.04)] rounded-[24px] overflow-hidden bg-white">
        <CardContent className="p-8 md:p-12 space-y-8">
          <div className="flex items-center gap-3">
             <div className="bg-gray-100 p-2 rounded-lg">
                <Key className="w-5 h-5 text-gray-600" />
             </div>
             <h3 className="text-xl font-bold text-gray-900">Mot de passe</h3>
          </div>
          
          <p className="text-[14px] text-gray-500 leading-relaxed -mt-4 max-w-xl">
            Pour votre sécurité, votre mot de passe actuel est demandé avant toute modification.
          </p>

          <div className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <Label className="text-[14px] font-bold text-gray-700 ml-1">Mot de passe actuel</Label>
              <div className="relative">
                <Input 
                  type={showPass.current ? "text" : "password"}
                  value={passData.current}
                  onChange={e => setPassData({...passData, current: e.target.value})}
                  className="h-12 bg-gray-50 border-gray-100 rounded-xl pr-12"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass({...showPass, current: !showPass.current})}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[14px] font-bold text-gray-700 ml-1">Nouveau mot de passe</Label>
              <div className="relative">
                <Input 
                  type={showPass.new ? "text" : "password"}
                  value={passData.new}
                  onChange={e => setPassData({...passData, new: e.target.value})}
                  className="h-12 bg-gray-50 border-gray-100 rounded-xl pr-12"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass({...showPass, new: !showPass.new})}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[14px] font-bold text-gray-700 ml-1">Confirmer le nouveau mot de passe</Label>
              <div className="relative">
                <Input 
                  type={showPass.confirm ? "text" : "password"}
                  value={passData.confirm}
                  onChange={e => setPassData({...passData, confirm: e.target.value})}
                  className="h-12 bg-gray-50 border-gray-100 rounded-xl pr-12"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass({...showPass, confirm: !showPass.confirm})}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              onClick={handleUpdatePassword}
              disabled={passwordLoading}
              className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Mettre à jour le mot de passe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
