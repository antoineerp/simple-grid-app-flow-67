
import { secureGet } from "@/services/core/apiInterceptor";
import { toast } from "@/components/ui/use-toast";

// Interface pour la réponse de l'API
interface TableApiResponse {
  status: string;
  tables: string[];
  user_id: string;
  count: number;
  message: string;
}

/**
 * Vérifie que l'utilisateur dispose de toutes les tables nécessaires
 * @param userId Identifiant de l'utilisateur
 * @returns Promise qui résout à true si tout est correct
 */
export const verifyUserTables = async (userId: string): Promise<boolean> => {
  if (!userId) {
    console.error("Impossible de vérifier les tables sans ID utilisateur");
    return false;
  }
  
  try {
    console.log(`Vérification des tables pour l'utilisateur ${userId}`);
    
    // Récupérer la liste des tables de l'utilisateur
    const response = await secureGet<TableApiResponse>(`test.php?action=tables&userId=${encodeURIComponent(userId)}`);
    
    if (!response.tables || !Array.isArray(response.tables)) {
      throw new Error("Format de réponse invalide pour la liste des tables");
    }
    
    console.log(`${response.count} tables trouvées pour l'utilisateur ${userId}`);
    
    // Liste des tables requises
    const requiredTables = [
      `documents_${userId}`,
      `exigences_${userId}`,
      `membres_${userId}`,
      `pilotage_${userId}`,
      `bibliotheque_${userId}`
    ];
    
    // Vérifier que toutes les tables requises existent
    const missingTables = requiredTables.filter(table => 
      !response.tables.some(userTable => userTable === table)
    );
    
    if (missingTables.length > 0) {
      console.warn(`Tables manquantes pour l'utilisateur ${userId}:`, missingTables);
      
      // Créer les tables manquantes
      await createMissingTables(userId, missingTables);
      return false;
    }
    
    console.log(`Toutes les tables requises existent pour l'utilisateur ${userId}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la vérification des tables pour l'utilisateur ${userId}:`, error);
    toast({
      variant: "destructive",
      title: "Erreur de vérification des tables",
      description: error instanceof Error ? error.message : "Erreur lors de la vérification des tables utilisateur",
    });
    return false;
  }
};

/**
 * Crée les tables manquantes pour un utilisateur
 */
const createMissingTables = async (userId: string, missingTables: string[]): Promise<boolean> => {
  try {
    console.log(`Création des tables manquantes pour l'utilisateur ${userId}:`, missingTables);
    
    // Appeler l'endpoint de mise à jour des tables
    const response = await secureGet(`db-update.php?userId=${encodeURIComponent(userId)}`);
    
    toast({
      title: "Tables utilisateur mises à jour",
      description: `Les tables manquantes ont été créées pour l'utilisateur ${userId}`,
    });
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la création des tables pour ${userId}:`, error);
    toast({
      variant: "destructive",
      title: "Erreur de création des tables",
      description: error instanceof Error ? error.message : "Erreur lors de la création des tables utilisateur",
    });
    return false;
  }
};

/**
 * Vérifie et corrige périodiquement les tables de l'utilisateur
 */
export const setupTableVerificationInterval = (userId: string, intervalMinutes = 60): () => void => {
  console.log(`Configuration de la vérification périodique des tables pour ${userId} (${intervalMinutes} minutes)`);
  
  // Exécuter une vérification immédiate
  verifyUserTables(userId).catch(console.error);
  
  // Configurer l'intervalle de vérification périodique
  const interval = setInterval(() => {
    verifyUserTables(userId).catch(console.error);
  }, intervalMinutes * 60 * 1000);
  
  // Retourner une fonction pour arrêter l'intervalle
  return () => clearInterval(interval);
};
