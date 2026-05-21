
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

const COLLECTION_NAME = "currencies";

export const CurrencyService = {
  async getRates(): Promise<Record<CurrencyCode, number>> {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    const rates: Record<string, number> = {
      FCFA: 1.0,
      GNF: 0.065,
      USD: 600,
      EUR: 655.957
    };

    snap.docs.forEach(doc => {
      const data = doc.data() as ExchangeRate;
      rates[data.code] = data.rateToRef;
    });

    return rates as Record<CurrencyCode, number>;
  },

  async updateRate(code: CurrencyCode, rate: number, user: UserProfile) {
    if (code === "FCFA") throw new Error("La devise de référence ne peut pas être modifiée.");
    
    const docRef = doc(db, COLLECTION_NAME, code);
    const data: ExchangeRate = {
      code,
      rateToRef: rate,
      lastUpdated: serverTimestamp(),
      updatedBy: `${user.prenom} ${user.nom}`
    };

    await setDoc(docRef, data, { merge: true });
    
    await UserService.logAudit(
      "UPDATE_EXCHANGE_RATE", 
      `Mise à jour du taux ${code} à ${rate} par ${user.prenom}`, 
      code
    );
  }
};
