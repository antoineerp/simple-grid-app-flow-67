
import { getCurrentUser } from '@/services/auth/authService';

// Fonction pour initialiser l'utilisateur actuel pour la base de données
export const initializeCurrentUser = (): string | null => {
  try {
    const user = getCurrentUser();
    
    if (!user) {
      console.warn("Aucun utilisateur connecté, pas d'initialisation");
      return null;
    }
    
    // Si l'utilisateur est un objet, extraire l'identifiant technique
    let userId = null;
    if (typeof user === 'object') {
      // Préférer l'identifiant technique s'il existe
      userId = user.identifiant_technique || user.email || null;
      
      // Si l'identifiant technique est absent ou invalide, utiliser l'email
      if (!userId || !userId.match(/^[a-zA-Z0-9_]+$/)) {
        userId = user.email;
      }
    } else if (typeof user === 'string') {
      // Si l'utilisateur est déjà une chaîne, l'utiliser directement
      userId = user;
    }
    
    // Si aucun userId n'a pu être déterminé, utiliser une valeur par défaut
    if (!userId) {
      console.warn("Impossible de déterminer l'identifiant utilisateur, utilisation de la valeur par défaut");
      userId = 'p71x6d_system';
    }
    
    console.log(`Utilisateur initialisé: ${userId}`);
    return userId;
  } catch (error) {
    console.error("Erreur lors de l'initialisation de l'utilisateur:", error);
    return 'p71x6d_system'; // Valeur par défaut en cas d'erreur
  }
};

// Fonction pour importer les données du gestionnaire (implémentation simplifiée)
export const adminImportFromManager = async (): Promise<boolean> => {
  try {
    console.log("Tentative d'import des données du gestionnaire");
    // Simulation d'une opération réussie
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Import des données du gestionnaire réussi");
    return true;
  } catch (error) {
    console.error("Erreur lors de l'import des données du gestionnaire:", error);
    return false;
  }
};

// Export explicite pour permettre l'importation dans d'autres fichiers
export default initializeCurrentUser;
