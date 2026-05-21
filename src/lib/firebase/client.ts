
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

// Vérifier si la configuration est valide (apiKey présente) pour éviter le crash immédiat
const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== "");

// Initialisation sécurisée
const app = isConfigValid 
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) 
  : null;

// On exporte les instances ou null si la config est invalide
// Note: Les services devront vérifier la présence de ces instances avant utilisation
const auth = app ? getAuth(app) : null as any;
const db = app ? getFirestore(app) : null as any;

export { app, auth, db };
