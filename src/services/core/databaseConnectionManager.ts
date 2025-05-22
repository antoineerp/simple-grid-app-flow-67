
/**
 * Service centralisé pour gérer toutes les connexions à la base de données
 * Garantit l'utilisation exclusive de p71x6d_richard pour toutes les opérations
 */

import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';

// Base de données fixe - TOUJOURS utiliser cette valeur
const FIXED_DB_USER = 'p71x6d_richard';
const FIXED_DB_NAME = 'p71x6d_system';

// Console de débogage spécifique pour les connexions DB
const logDb = (message: string) => {
  console.log(`[DB] ${message}`);
};

/**
 * Récupère le nom d'utilisateur à utiliser pour TOUTES les connexions à la base de données
 * Cette fonction doit être appelée partout où on a besoin de l'identifiant utilisateur pour la BD
 */
export const getDbUser = (): string => {
  return FIXED_DB_USER;
};

/**
 * Récupère le nom de la base de données à utiliser
 */
export const getDbName = (): string => {
  return FIXED_DB_NAME;
};

/**
 * Génère une clé de table unique pour un utilisateur
 * Utilisez cette fonction pour toutes les opérations sur les tables
 */
export const getTableName = (baseTableName: string): string => {
  return `${baseTableName}_${FIXED_DB_USER}`;
};

/**
 * Exécuter une requête API vers le serveur en utilisant uniquement p71x6d_richard
 */
export const executeDbRequest = async <T = any>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<T> => {
  try {
    const apiUrl = getApiUrl();
    const url = `${apiUrl}/${endpoint}`;
    
    // Ajouter un timestamp pour éviter la mise en cache
    const urlWithTimestamp = url.includes('?') 
      ? `${url}&_t=${Date.now()}` 
      : `${url}?_t=${Date.now()}`;
    
    const headers = {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'User-DB': FIXED_DB_USER
    };
    
    const options: RequestInit = {
      method,
      headers,
      cache: 'no-store'
    };
    
    // Ajouter le corps de la requête pour les méthodes non-GET
    if (method !== 'GET' && data) {
      // S'assurer que l'ID utilisateur est toujours p71x6d_richard
      if (data.userId) {
        data.userId = FIXED_DB_USER;
      }
      
      options.body = JSON.stringify(data);
    }
    
    logDb(`Exécution de la requête ${method} vers ${endpoint}`);
    const response = await fetch(urlWithTimestamp, options);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    return responseData as T;
  } catch (error) {
    logDb(`Erreur lors de l'exécution de la requête: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * Récupérer des données depuis une table spécifique
 */
export const fetchTableData = async <T = any>(tableName: string): Promise<T[]> => {
  try {
    const fixedTableName = getTableName(tableName);
    const response = await executeDbRequest<{records: T[], status: string}>(
      `db-fetch.php?table=${tableName}&userId=${FIXED_DB_USER}`
    );
    
    if (response.status === 'success' && Array.isArray(response.records)) {
      return response.records;
    }
    
    return [];
  } catch (error) {
    logDb(`Erreur lors de la récupération des données de ${tableName}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
};

/**
 * Envoyer des données vers une table spécifique
 */
export const syncTableData = async <T = any>(
  tableName: string,
  data: T[]
): Promise<boolean> => {
  try {
    const fixedTableName = getTableName(tableName);
    const response = await executeDbRequest(
      `robust-sync.php`,
      'POST',
      {
        tableName,
        userId: FIXED_DB_USER,
        records: data
      }
    );
    
    return true;
  } catch (error) {
    logDb(`Erreur lors de la synchronisation des données de ${tableName}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
};

/**
 * Fonction unique pour créer un utilisateur - utilise toujours p71x6d_richard
 */
export const createDbUser = async (userData: any): Promise<any> => {
  try {
    // S'assurer que les données contiennent l'ID utilisateur fixe
    userData.fixed_db_user = FIXED_DB_USER;
    
    const response = await executeDbRequest(
      'controllers/UsersController.php',
      'POST',
      userData
    );
    
    return response;
  } catch (error) {
    logDb(`Erreur lors de la création de l'utilisateur: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Initialisation - vérification de la connexion
export const initDatabaseConnection = (): void => {
  logDb(`Initialisation de la connexion à la base de données ${FIXED_DB_NAME} avec l'utilisateur ${FIXED_DB_USER}`);
};

// Exécuter l'initialisation automatiquement
initDatabaseConnection();
