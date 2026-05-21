"use client"

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, query, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { AuthService } from "@/services/auth.service";
import { UserProfile } from "@/lib/types";
import { toast } from "sonner";

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSeller: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string, user: User) => {
    if (!db) {
      throw new Error("Base de données non configurée. Vérifiez votre fichier .env");
    }
    
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Logique de Bootstrap : Si aucun utilisateur n'existe, on crée le premier Admin
      const usersSnap = await getDocs(query(collection(db, "users"), limit(1)));
      
      if (usersSnap.empty) {
        const initialProfile: UserProfile = {
          uid: uid,
          email: user.email || "",
          nom: "Admin",
          prenom: "Initial",
          role: "admin",
          boutiqueIds: [],
          actif: true,
        };
        await setDoc(userDocRef, initialProfile);
        toast.info("Premier compte détecté : Profil configuré en tant que Admin.");
        return initialProfile;
      }
      
      throw new Error("Compte non configuré dans Firestore. Contactez l'administrateur.");
    }
    
    const profile = { uid, ...userDoc.data() } as UserProfile;
    if (!profile.actif) {
      throw new Error("Votre compte a été suspendu. Contactez l'administrateur.");
    }
    return profile;
  };

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth n'est pas initialisé. Vérifiez votre configuration.");
      setLoading(false);
      return;
    }

    const unsubscribe = AuthService.subscribeToAuthChanges(async (user) => {
      if (user) {
        try {
          const profile = await fetchProfile(user.uid, user);
          setCurrentUser(user);
          setUserProfile(profile);
        } catch (error: any) {
          toast.error(error.message);
          await AuthService.logout();
          setCurrentUser(null);
          setUserProfile(null);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    isAdmin: userProfile?.role === "admin",
    isManager: userProfile?.role === "manager",
    isSeller: userProfile?.role === "seller",
    login: AuthService.login.bind(AuthService),
    logout: AuthService.logout.bind(AuthService),
    resetPassword: AuthService.resetPassword.bind(AuthService),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
