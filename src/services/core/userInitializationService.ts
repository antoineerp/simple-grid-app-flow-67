
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { getDatabaseConnectionCurrentUser } from './databaseConnectionService';
import { Utilisateur } from '@/services';

export const adminImportFromManager = async (): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const currentUser = getDatabaseConnectionCurrentUser();
    
    // Si aucun utilisateur n'est connecté, renvoyer une erreur
    if (!currentUser) {
      throw new Error("Aucun utilisateur connecté pour l'import des données");
    }
    
    console.log(`Tentative d'import des données pour l'utilisateur: ${currentUser}`);
    
    const response = await fetch(`${API_URL}/manager-import`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetUser: currentUser
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Erreur pendant l'import depuis le gestionnaire:", error);
    throw error;
  }
};

// Fonction pour initialiser les tables d'un utilisateur
export const initializeUserTables = async (userId: string): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    
    // 1. Créer les tables de base pour l'utilisateur
    const dbUpdateUrl = `${API_URL}/db-update.php?userId=${encodeURIComponent(userId)}`;
    const dbUpdateResponse = await fetch(dbUpdateUrl, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!dbUpdateResponse.ok) {
      console.error(`Erreur lors de la création des tables: ${dbUpdateResponse.status}`);
      return false;
    }
    
    console.log("Tables de base créées avec succès pour l'utilisateur", userId);
    
    // 2. Importer les données du gestionnaire
    const importUrl = `${API_URL}/manager-import`;
    const importResponse = await fetch(importUrl, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ targetUser: userId })
    });
    
    if (!importResponse.ok) {
      console.warn(`Import des données du gestionnaire non réussi: ${importResponse.status}`);
      return false;
    }
    
    console.log("Données importées du gestionnaire avec succès pour l'utilisateur", userId);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'initialisation des tables utilisateur:", error);
    return false;
  }
};
