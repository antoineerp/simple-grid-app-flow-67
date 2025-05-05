
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';

/**
 * Initialise les données d'un utilisateur depuis les données du gestionnaire
 * Cette fonction est utilisée dans le contexte d'administration pour importer 
 * les données de référence du gestionnaire vers un utilisateur spécifique
 */
export const adminImportFromManager = async (): Promise<boolean> => {
  try {
    const apiUrl = getApiUrl();
    const userId = localStorage.getItem('userId') || '';
    
    const response = await fetch(`${apiUrl}/user-init.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Erreur lors de l'initialisation des données utilisateur:", data.message);
      return false;
    }
    
    console.log("Données utilisateur initialisées avec succès");
    return data.success || true;
    
  } catch (error) {
    console.error("Erreur lors de l'initialisation des données utilisateur:", error);
    return false;
  }
};

/**
 * Vérifie l'existence d'une table spécifique pour un utilisateur
 */
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const apiUrl = getApiUrl();
    const userId = localStorage.getItem('userId') || '';
    
    const response = await fetch(`${apiUrl}/table-check.php?userId=${userId}&table=${tableName}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Erreur lors de la vérification de la table:", data.message);
      return false;
    }
    
    return data.exists || false;
    
  } catch (error) {
    console.error("Erreur lors de la vérification de la table:", error);
    return false;
  }
};
