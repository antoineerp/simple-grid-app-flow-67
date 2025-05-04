
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';

/**
 * Service pour nettoyer les tables d'un utilisateur lors de sa suppression
 */

/**
 * Supprime toutes les tables associées à un utilisateur
 * @param userId - L'identifiant technique de l'utilisateur
 * @returns Promise<boolean> - Vrai si la suppression a réussi
 */
export const cleanupUserTables = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Début du nettoyage des tables pour l'utilisateur: ${userId}`);
    
    if (!userId || !userId.startsWith('p71x6d_')) {
      console.error(`Identifiant utilisateur invalide: ${userId}`);
      return false;
    }
    
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/cleanup-user-tables.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        action: 'cleanup',
        confirmDelete: true
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Erreur lors du nettoyage des tables: ${errorData.message || response.statusText}`);
      return false;
    }
    
    const result = await response.json();
    console.log(`Résultat du nettoyage des tables: ${JSON.stringify(result)}`);
    
    return result.success === true;
  } catch (error) {
    console.error(`Erreur lors du nettoyage des tables utilisateur: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
};
