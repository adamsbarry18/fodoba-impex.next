
"use client"

import React, { createContext, useContext, useEffect, useState } from "react";
import { CurrencyCode } from "@/lib/types";
import { CurrencyService } from "@/services/currency.service";
import { useAuth } from "./AuthContext";

interface CurrencyContextType {
  rates: Record<CurrencyCode, number>;
  loading: boolean;
  refreshRates: () => Promise<void>;
  formatAmount: (amount: number, code?: CurrencyCode) => string;
  convertToRef: (amount: number, from: CurrencyCode) => number;
  convertFromRef: (amount: number, to: CurrencyCode) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [rates, setRates] = useState<Record<CurrencyCode, number>>({
    FCFA: 1.0,
    GNF: 0.065,
    USD: 600,
    EUR: 656
  });
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  const refreshRates = async () => {
    setLoading(true);
    try {
      const latestRates = await CurrencyService.getRates();
      setRates(latestRates);
    } catch (error) {
      console.error("Error loading exchange rates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      refreshRates();
    }
  }, [userProfile]);

  /**
   * Convertit un montant d'une devise vers la référence (FCFA).
   */
  const convertToRef = (amount: number, from: CurrencyCode): number => {
    if (from === "FCFA") return amount;
    return amount * (rates[from] || 1);
  };

  /**
   * Convertit un montant de la référence (FCFA) vers une autre devise.
   */
  const convertFromRef = (amount: number, to: CurrencyCode): number => {
    if (to === "FCFA") return amount;
    const rate = rates[to] || 1;
    return amount / rate;
  };

  /**
   * Formate un montant selon les standards de la devise.
   */
  const formatAmount = (amount: number, code: CurrencyCode = "FCFA"): string => {
    const formatter = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: code === "FCFA" ? "XOF" : code,
      minimumFractionDigits: (code === "FCFA" || code === "GNF") ? 0 : 2,
      maximumFractionDigits: (code === "FCFA" || code === "GNF") ? 0 : 2,
    });

    let result = formatter.format(amount);
    
    // Correction pour le sigle FCFA qui n'est pas tjs bien supporté par Intl (XOF)
    if (code === "FCFA") {
      result = result.replace('F CFA', 'FCFA').replace('XOF', 'FCFA');
    }
    
    return result;
  };

  return (
    <CurrencyContext.Provider value={{ 
      rates, 
      loading, 
      refreshRates, 
      formatAmount,
      convertToRef,
      convertFromRef
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
