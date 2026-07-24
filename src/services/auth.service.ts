
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { mapAuthErrorCode, type AuthErrorContext } from "@/lib/auth-utils";

function getAuthErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

/**
 * Service gérant les interactions directes avec Firebase Authentication.
 */
export const AuthService = {
  /**
   * Connecte un utilisateur avec email et mot de passe.
   */
  async login(email: string, pass: string) {
    if (!auth) throw new Error("Firebase Auth n'est pas configuré.");
    try {
      return await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: unknown) {
      throw this.handleAuthError(error, "login");
    }
  },

  /**
   * Déconnecte l'utilisateur actuel.
   */
  async logout() {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
    } catch {
      throw new Error("Erreur lors de la déconnexion.");
    }
  },

  /**
   * Envoie un email de réinitialisation de mot de passe.
   */
  async resetPassword(email: string) {
    if (!auth) throw new Error("Firebase Auth n'est pas configuré.");
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
      throw this.handleAuthError(error, "reset");
    }
  },

  /**
   * Modifie le mot de passe de l'utilisateur connecté.
   * Nécessite une ré-authentification préalable.
   */
  async changePassword(currentPass: string, newPass: string) {
    if (!auth?.currentUser) throw new Error("Utilisateur non identifié.");
    const user = auth.currentUser;
    
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPass);
      await reauthenticateWithCredential(user, credential);
      await firebaseUpdatePassword(user, newPass);
    } catch (error: unknown) {
      throw this.handleAuthError(error, "changePassword");
    }
  },

  /**
   * Observe les changements d'état d'authentification.
   */
  subscribeToAuthChanges(callback: (user: User | null) => void) {
    if (!auth) return () => {}; // Retourne une fonction vide si non initialisé
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Traduit les codes d'erreur Firebase en messages compréhensibles.
   */
  handleAuthError(error: unknown, context: AuthErrorContext = "login"): Error {
    return new Error(mapAuthErrorCode(getAuthErrorCode(error), context));
  }
};
