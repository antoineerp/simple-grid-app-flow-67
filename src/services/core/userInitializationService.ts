
import { getCurrentUser } from './databaseConnectionService';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';

/**
 * Service pour l'initialisation des données utilisateur
 */

/**
 * Importe des données depuis un compte gestionnaire
 */
export const adminImportFromManager = async (): Promise<boolean> => {
  try {
    console.log("Tentative d'importation depuis le gestionnaire...");
    
    // Logique d'import à implémenter selon les besoins
    // Actuellement simulé avec un délai
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'import depuis le gestionnaire:", error);
    return false;
  }
};

/**
 * Crée les tables nécessaires pour un nouvel utilisateur
 * Cette fonction est appelée après la création d'un utilisateur
 */
export const createUserTables = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Création des tables pour l'utilisateur: ${userId}`);
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/users.php?action=create_tables_for_user&userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error(`Échec de la création des tables pour l'utilisateur ${userId}:`, data.message);
      return false;
    }
    
    console.log(`Tables créées avec succès pour l'utilisateur ${userId}:`, data.tables_created);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la création des tables pour l'utilisateur ${userId}:`, error);
    return false;
  }
};

