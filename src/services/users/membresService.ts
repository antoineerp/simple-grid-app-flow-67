
import { Membre } from '@/types/membres';
import { getCurrentUserId } from '@/services/core/userService';

/**
 * Service pour la gestion des membres (ressources humaines)
 * Version simplifiée qui utilise uniquement le stockage local
 */
export const getMembres = async (forceRefresh: boolean = false): Promise<Membre[]> => {
  const userId = getCurrentUserId();
  
  try {
    // Uniquement chercher dans le localStorage
    const localData = localStorage.getItem(`membres_${userId || 'default'}`);
    
    if (localData) {
      const parsedData = JSON.parse(localData);
      console.log("Utilisation des données locales pour les membres");
      return Array.isArray(parsedData) ? parsedData : [];
    } else {
      console.log("Aucune données locales pour les membres");
      return [];
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des membres:", error);
    return [];
  }
};

/**
 * Synchronise les membres avec le stockage local uniquement
 */
export const syncMembres = async (membres?: Membre[]): Promise<boolean> => {
  try {
    if (!Array.isArray(membres)) {
      console.error("syncMembres: L'argument membres n'est pas un tableau valide");
      return false;
    }
    
    const userId = getCurrentUserId();
    
    // Enregistrer uniquement en local
    localStorage.setItem(`membres_${userId || 'default'}`, JSON.stringify(membres));
    console.log(`${membres.length} membres enregistrés localement`);
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'enregistrement local des membres:", error);
    return false;
  }
};

export const clearMembresCache = (): void => {
  console.log("Cache membres effacé");
};
