
import { fetchWithErrorHandling } from '@/config/apiConfig';
import { getApiUrl } from '@/config/apiConfig';
import { getCurrentUser } from '../core/databaseConnectionService';

/**
 * Service pour interagir directement avec la base de données Infomaniak
 * Ce service contourne complètement le localStorage et envoie toutes les requêtes directement à la base
 */

/**
 * Exécute une requête SQL directement sur la base de données
 */
export const executeQuery = async (query: string, params: any[] = []): Promise<any> => {
  try {
    const API_URL = getApiUrl();
    
    const response = await fetchWithErrorHandling(`${API_URL}/test.php?action=execute_query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        params,
        user: getCurrentUser()
      })
    });
    
    return response;
  } catch (error) {
    console.error("Erreur lors de l'exécution de la requête:", error);
    throw error;
  }
};

/**
 * Récupère les données d'une table spécifique
 */
export const getTableData = async (tableName: string): Promise<any[]> => {
  try {
    const user = getCurrentUser();
    const fullTableName = `${tableName}_${user}`;
    
    const query = `SELECT * FROM ${fullTableName}`;
    const result = await executeQuery(query);
    
    return result && result.data ? result.data : [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des données de ${tableName}:`, error);
    return [];
  }
};

/**
 * Vérifie si une table existe et la crée si nécessaire
 */
export const ensureTableExists = async (tableName: string, schema: string): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const user = getCurrentUser();
    
    const response = await fetchWithErrorHandling(`${API_URL}/test.php?action=ensure_table`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tableName: `${tableName}_${user}`,
        schema,
        user
      })
    });
    
    return response && response.success;
  } catch (error) {
    console.error(`Erreur lors de la vérification/création de la table ${tableName}:`, error);
    return false;
  }
};

/**
 * Liste toutes les tables d'un utilisateur
 */
export const getUserTables = async (userId: string = getCurrentUser()): Promise<string[]> => {
  try {
    const API_URL = getApiUrl();
    
    const response = await fetchWithErrorHandling(`${API_URL}/test.php?action=list_tables&userId=${userId}`);
    
    return response && response.tables ? response.tables : [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des tables de l'utilisateur ${userId}:`, error);
    return [];
  }
};

export const directDbService = {
  executeQuery,
  getTableData,
  ensureTableExists,
  getUserTables
};

export default directDbService;
