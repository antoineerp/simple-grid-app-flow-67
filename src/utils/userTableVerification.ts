
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Vérifie si les tables d'un utilisateur existent et les crée si nécessaire
 * Cette fonction centralise toutes les vérifications de tables pour maintenir la cohérence
 */
export const verifyUserTables = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Vérification des tables pour l'utilisateur: ${userId}`);
    const API_URL = getApiUrl();
    
    // Utiliser l'API unifiée pour vérifier et créer les tables
    const response = await fetch(`${API_URL}/users.php?action=create_tables_for_user&userId=${encodeURIComponent(userId)}&_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // Traitement des erreurs côté serveur
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Réponse non-JSON reçue:', textResponse);
        throw new Error("Le serveur a renvoyé une réponse non-JSON. Contactez l'administrateur.");
      }
      
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "La vérification des tables a échoué");
    }
    
    console.log(`Tables vérifiées pour l'utilisateur ${userId}:`, data.tables_created || []);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la vérification des tables pour ${userId}:`, error);
    throw error;
  }
};

/**
 * Compare les tables locales avec les tables de la base de données
 * et retourne les incohérences
 */
export const compareUserTables = async (userId: string, localTables: string[]): Promise<{
  missing: string[];
  extra: string[];
  consistent: boolean;
}> => {
  try {
    const API_URL = getApiUrl();
    
    // Récupérer les tables depuis la base de données
    const response = await fetch(`${API_URL}/test.php?action=tables&userId=${encodeURIComponent(userId)}&_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status} lors de la récupération des tables`);
    }
    
    const data = await response.json();
    
    if (!data.tables || !Array.isArray(data.tables)) {
      throw new Error("Format de réponse invalide pour les tables");
    }
    
    const dbTables = data.tables;
    
    // Comparer les tables
    const missing = dbTables.filter(table => !localTables.includes(table));
    const extra = localTables.filter(table => !dbTables.includes(table));
    
    return {
      missing,
      extra,
      consistent: missing.length === 0 && extra.length === 0
    };
  } catch (error) {
    console.error(`Erreur lors de la comparaison des tables pour ${userId}:`, error);
    throw error;
  }
};

/**
 * Vérifie et synchronise toutes les tables pour tous les utilisateurs
 */
export const syncAllUserTables = async (): Promise<{
  success: boolean;
  results: Array<{
    userId: string;
    success: boolean;
    tablesCreated?: string[];
    error?: string;
  }>;
}> => {
  try {
    // Récupérer la liste des utilisateurs
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/users.php?_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status} lors de la récupération des utilisateurs`);
    }
    
    const data = await response.json();
    
    if (!data.records || !Array.isArray(data.records)) {
      throw new Error("Format de réponse invalide pour les utilisateurs");
    }
    
    const users = data.records;
    const results = [];
    
    // Vérifier les tables pour chaque utilisateur
    for (const user of users) {
      try {
        await verifyUserTables(user.identifiant_technique);
        results.push({
          userId: user.identifiant_technique,
          success: true
        });
      } catch (error) {
        results.push({
          userId: user.identifiant_technique,
          success: false,
          error: error instanceof Error ? error.message : "Erreur inconnue"
        });
      }
    }
    
    return {
      success: results.every(result => result.success),
      results
    };
  } catch (error) {
    console.error("Erreur lors de la synchronisation de toutes les tables:", error);
    throw error;
  }
};

/**
 * Configure une vérification périodique des tables utilisateur
 * @param userId Identifiant technique de l'utilisateur
 * @param intervalMinutes Intervalle en minutes entre les vérifications
 * @returns Fonction pour arrêter la vérification périodique
 */
export const setupTableVerificationInterval = (userId: string, intervalMinutes: number = 60): (() => void) => {
  console.log(`Configuration de la vérification périodique des tables pour ${userId} toutes les ${intervalMinutes} minutes`);
  
  // Convertir les minutes en millisecondes
  const intervalMs = intervalMinutes * 60 * 1000;
  
  // Définir l'intervalle
  const interval = setInterval(async () => {
    try {
      console.log(`Vérification périodique des tables pour ${userId}...`);
      await verifyUserTables(userId);
      console.log(`Vérification périodique terminée pour ${userId}`);
    } catch (error) {
      console.error(`Erreur lors de la vérification périodique des tables pour ${userId}:`, error);
    }
  }, intervalMs);
  
  // Retourner une fonction pour nettoyer l'intervalle
  return () => {
    console.log(`Arrêt de la vérification périodique des tables pour ${userId}`);
    clearInterval(interval);
  };
};
