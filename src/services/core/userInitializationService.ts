
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { databaseHelper } from '@/services/sync/DatabaseHelper';

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

/**
 * Initialise les tables nécessaires pour un utilisateur
 */
export const initializeUserTables = async (): Promise<boolean> => {
  try {
    // Utiliser l'utilitaire DatabaseHelper pour mettre à jour toutes les tables
    const result = await databaseHelper.updateDatabaseStructure();
    return result.success;
  } catch (error) {
    console.error("Erreur lors de l'initialisation des tables utilisateur:", error);
    return false;
  }
};

/**
 * Vérifie si les tables utilisateur sont initialisées
 */
export const checkUserTablesInitialized = async (): Promise<boolean> => {
  try {
    // Vérifier l'existence des tables principales
    const documentsTableExists = await checkTableExists('documents');
    const exigencesTableExists = await checkTableExists('exigences');
    
    return documentsTableExists && exigencesTableExists;
  } catch (error) {
    console.error("Erreur lors de la vérification des tables utilisateur:", error);
    return false;
  }
};

/**
 * Journalise l'activité d'un utilisateur
 */
export const logUserActivity = async (
  action: string, 
  details: string = ''
): Promise<boolean> => {
  try {
    const apiUrl = getApiUrl();
    const userId = localStorage.getItem('userId') || '';
    
    // Pas besoin d'enregistrer l'activité si pas d'utilisateur connecté
    if (!userId) return false;
    
    const response = await fetch(`${apiUrl}/activity-log.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        userId,
        action,
        details,
        timestamp: new Date().toISOString()
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Erreur lors de la journalisation de l'activité:", data.message);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error("Erreur lors de la journalisation de l'activité:", error);
    return false;
  }
};
