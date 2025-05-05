
import { toast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { DatabaseHelper } from '@/services/sync/DatabaseHelper';

/**
 * Service pour initialiser les tables et données d'un utilisateur
 */
export async function initializeUserTables(userId: string): Promise<boolean> {
  try {
    console.log(`Initialisation des tables pour l'utilisateur: ${userId}`);
    
    // Vérifier le format de l'identifiant utilisateur
    if (!userId || typeof userId !== 'string' || !userId.startsWith('p71x6d_')) {
      console.error(`Format d'identifiant invalide: ${userId}`);
      return false;
    }
    
    // Initialiser la structure de base de données
    const dbHelper = new DatabaseHelper();
    const result = await dbHelper.updateDatabaseStructure(userId, false);
    
    if (!result.success) {
      console.error("Échec de la mise à jour de la structure de la base de données:", result.message);
      return false;
    }
    
    // Initialiser les données d'exemple si c'est un nouvel utilisateur
    const initResult = await initializeUserData(userId);
    
    console.log(`Initialisation terminée pour ${userId}, résultat:`, initResult);
    return true;
    
  } catch (error) {
    console.error("Erreur lors de l'initialisation des tables utilisateur:", error);
    toast({
      variant: "destructive",
      title: "Erreur d'initialisation",
      description: "Impossible d'initialiser les tables utilisateur."
    });
    return false;
  }
}

/**
 * Initialise les données de l'utilisateur en copiant depuis le compte de référence (gestionnaire)
 */
async function initializeUserData(userId: string): Promise<boolean> {
  try {
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/user-init.php`;
    
    console.log(`Initialisation des données utilisateur depuis ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      // Essayer l'URL alternative
      const alternativeUrl = `/sites/qualiopi.ch/api/user-init.php`;
      console.log(`Tentative avec URL alternative: ${alternativeUrl}`);
      
      const altResponse = await fetch(alternativeUrl, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      
      if (!altResponse.ok) {
        throw new Error(`Erreur HTTP: ${altResponse.status}`);
      }
      
      const result = await altResponse.json();
      return result.success;
    }
    
    const result = await response.json();
    return result.success;
    
  } catch (error) {
    console.error("Erreur lors de l'initialisation des données utilisateur:", error);
    return false;
  }
}

/**
 * Vérifie si les tables de l'utilisateur ont déjà été initialisées
 */
export async function checkUserTablesInitialized(userId: string): Promise<boolean> {
  try {
    // Vérifier si la table documents existe pour cet utilisateur
    const API_URL = getApiUrl();
    const checkEndpoint = `${API_URL}/table-check.php?userId=${userId}&table=documents`;
    
    const response = await fetch(checkEndpoint, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result.exists;
    
  } catch (error) {
    console.error("Erreur lors de la vérification des tables utilisateur:", error);
    return false;
  }
}

/**
 * Journal des modifications utilisateur
 */
export async function logUserActivity(
  userId: string,
  action: 'create' | 'update' | 'delete',
  resourceType: 'document' | 'exigence' | 'membre',
  resourceId: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    const API_URL = getApiUrl();
    const logEndpoint = `${API_URL}/activity-log.php`;
    
    await fetch(logEndpoint, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        action,
        resourceType,
        resourceId,
        details: details || {},
        timestamp: new Date().toISOString()
      })
    });
    
    console.log(`Activité journalisée: ${action} ${resourceType} ${resourceId} par ${userId}`);
    
  } catch (error) {
    console.error("Erreur lors de la journalisation de l'activité utilisateur:", error);
    // Ne pas bloquer le flux principal en cas d'erreur de journalisation
  }
}
