
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ExchangeRate, CurrencyCode, UserProfile } from "@/lib/types";
import { UserService } from "./user.service";
import { CURRENCY_ORDER, DEFAULT_RATES, validateRate } from "@/lib/currency-utils";

const COLLECTION_NAME = "currencies";

export const CurrencyService = {
  async getRates(): Promise<Record<CurrencyCode, number>> {
    const rates = await this.getExchangeRates();
    return rates.reduce(
      (acc, rate) => {
        acc[rate.code] = rate.rateToRef;
        return acc;
      },
      { ...DEFAULT_RATES } as Record<CurrencyCode, number>
    );
  },

  async getExchangeRates(): Promise<ExchangeRate[]> {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    const stored = new Map<CurrencyCode, ExchangeRate>();

    snap.docs.forEach((docSnap) => {
      const data = docSnap.data() as ExchangeRate;
      stored.set(data.code, data);
    });

    return CURRENCY_ORDER.map((code) => {
      if (stored.has(code)) return stored.get(code)!;
      return {
        code,
        rateToRef: DEFAULT_RATES[code],
        lastUpdated: null,
        updatedBy: code === "FCFA" ? "Système" : "-",
      };
    });
  },

  async updateRate(code: CurrencyCode, rate: number, user: UserProfile) {
    if (code === "FCFA") {
      throw new Error("La devise de référence ne peut pas être modifiée.");
    }

    const validationError = validateRate(rate);
    if (validationError) throw new Error(validationError);
    
    const docRef = doc(db, COLLECTION_NAME, code);
    const data: ExchangeRate = {
      code,
      rateToRef: rate,
      lastUpdated: serverTimestamp(),
      updatedBy: `${user.prenom} ${user.nom}`,
    };

    await setDoc(docRef, data, { merge: true });
    
    await UserService.logAudit(
      "UPDATE_EXCHANGE_RATE", 
      `Mise à jour du taux ${code} à ${rate} par ${user.prenom}`, 
      code
    );
  }
};
