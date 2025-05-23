
import { fetchWithErrorHandling } from '@/config/apiConfig';
import { getApiUrl } from '@/config/apiConfig';
import { userService } from '@/services/users/userService';

/**
 * Vérifie et crée si nécessaire les tables pour un utilisateur spécifique
 */
export const verifyUserTables = async (userId: string): Promise<{ success: boolean; message: string; tables?: string[] }> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Vérification des tables pour l'utilisateur ${userId}...`);
    
    // Utiliser le point d'accès qui fonctionne
    const result = await fetchWithErrorHandling(`${API_URL}/test.php?action=create_tables_for_user&userId=${encodeURIComponent(userId)}`);
    
    if (result && result.success) {
      console.log(`Tables vérifiées avec succès pour ${userId}`);
      return {
        success: true,
        message: result.message || `Tables vérifiées avec succès pour ${userId}`,
        tables: result.tables_created || []
      };
    } else {
      console.error(`Erreur lors de la vérification des tables pour ${userId}:`, result);
      return {
        success: false,
        message: result?.message || `Échec de la vérification des tables pour ${userId}`
      };
    }
  } catch (error) {
    console.error(`Erreur lors de la vérification des tables pour ${userId}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : `Erreur lors de la vérification des tables pour ${userId}`
    };
  }
};

/**
 * Configure un intervalle pour vérifier régulièrement les tables des utilisateurs
 */
export const setupTableVerificationInterval = (userId: string | null, intervalMinutes = 30) => {
  if (!userId) return null;
  
  console.log(`Configuration de la vérification périodique des tables pour ${userId}...`);
  
  // Effectuer une vérification immédiate
  verifyUserTables(userId).catch(console.error);
  
  // Configurer l'intervalle pour les vérifications futures
  const intervalId = setInterval(() => {
    console.log(`Vérification périodique des tables pour ${userId}...`);
    verifyUserTables(userId).catch(console.error);
  }, intervalMinutes * 60 * 1000);
  
  return intervalId;
};

/**
 * Synchronise les tables pour tous les utilisateurs
 */
export const syncAllUserTables = async (): Promise<{ 
  success: boolean; 
  results: Array<{ userId: string; success: boolean; message: string; tables?: string[] }>
}> => {
  try {
    // Récupérer tous les utilisateurs
    const users = await userService.getAllUsers();
    const results = [];
    let allSuccess = true;
    
    console.log(`Vérification des tables pour ${users.length} utilisateurs...`);
    
    // Vérifier les tables pour chaque utilisateur
    for (const user of users) {
      if (!user.identifiant_technique) continue;
      
      const result = await verifyUserTables(user.identifiant_technique);
      results.push({
        userId: user.identifiant_technique,
        ...result
      });
      
      if (!result.success) {
        allSuccess = false;
      }
    }
    
    return {
      success: allSuccess,
      results
    };
  } catch (error) {
    console.error("Erreur lors de la synchronisation des tables pour tous les utilisateurs:", error);
    return {
      success: false,
      results: [{
        userId: 'global',
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue lors de la synchronisation"
      }]
    };
  }
};
