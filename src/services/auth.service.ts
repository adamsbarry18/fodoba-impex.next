
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
    } catch (error: any) {
      throw this.handleAuthError(error);
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
    } catch (error: any) {
      throw this.handleAuthError(error);
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
    } catch (error: any) {
      throw this.handleAuthError(error);
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
  handleAuthError(error: any): Error {
    switch (error.code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return new Error("Le mot de passe actuel est incorrect.");
      case "auth/user-disabled":
        return new Error("Ce compte a été désactivé.");
      case "auth/too-many-requests":
        return new Error("Trop de tentatives. Veuillez réessayer plus tard.");
      case "auth/requires-recent-login":
        return new Error("Cette action nécessite une connexion récente. Veuillez vous reconnecter.");
      case "auth/weak-password":
        return new Error("Le nouveau mot de passe est trop faible (6 caractères min).");
      default:
        return new Error("Une erreur de sécurité est survenue.");
    }
  }
};
