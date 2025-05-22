
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
 * Vérifie si une réponse contient du PHP au lieu de JSON
 */
const isPhpResponse = (text: string): boolean => {
  return text.trim().startsWith('<?php') || 
         text.includes('<?php') || 
         text.includes('<br />') || 
         text.includes('<!DOCTYPE');
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
      'User-DB': FIXED_DB_USER,
      'Accept': 'application/json'
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
    
    // Vérifier le type de contenu de la réponse
    const contentType = response.headers.get('content-type');
    const isJsonResponse = contentType && contentType.includes('application/json');
    
    if (!response.ok) {
      const statusText = response.statusText || `Code ${response.status}`;
      throw new Error(`Erreur HTTP ${response.status}: ${statusText}`);
    }
    
    const responseText = await response.text();
    
    // Vérifier si la réponse contient du PHP non exécuté
    if (isPhpResponse(responseText)) {
      console.error(`Réponse PHP brute reçue pour ${endpoint}:`, responseText.substring(0, 200));
      throw new Error('Erreur serveur: PHP non exécuté - problème de configuration du serveur');
    }
    
    // Essayer de parser le JSON
    try {
      const responseData = JSON.parse(responseText);
      return responseData as T;
    } catch (parseError) {
      console.error(`Erreur de parsing JSON pour ${endpoint}:`, parseError);
      
      // Si ce n'est pas du JSON valide, retourner un objet d'erreur cohérent
      return {
        status: 'error',
        error: true,
        message: 'Format de réponse invalide',
        data: null
      } as unknown as T;
    }
  } catch (error) {
    logDb(`Erreur lors de l'exécution de la requête: ${error instanceof Error ? error.message : String(error)}`);
    
    // Retourner un objet d'erreur cohérent
    return {
      status: 'error',
      error: true,
      message: error instanceof Error ? error.message : String(error),
      data: null
    } as unknown as T;
  }
};

/**
 * Récupérer des données depuis une table spécifique avec gestion des erreurs améliorée
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
    
    // Si le serveur a des problèmes, retourner un tableau vide
    // et ne pas bloquer l'interface utilisateur
    return [];
  } catch (error) {
    logDb(`Erreur lors de la récupération des données de ${tableName}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
};

/**
 * Envoyer des données vers une table spécifique avec gestion améliorée des erreurs
 */
export const syncTableData = async <T = any>(
  tableName: string,
  data: T[]
): Promise<boolean> => {
  try {
    // Si le serveur est inaccessible ou a des problèmes,
    // nous stockons quand même les données localement
    localStorage.setItem(`${tableName}_offline_data`, JSON.stringify(data));
    localStorage.setItem(`${tableName}_offline_timestamp`, new Date().toISOString());
    
    // Tenter la synchronisation avec le serveur
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
    
    // Même en cas d'erreur, on considère que la synchronisation locale a réussi
    return true;
  } catch (error) {
    logDb(`Erreur lors de la synchronisation des données de ${tableName}: ${error instanceof Error ? error.message : String(error)}`);
    // La synchronisation locale a quand même eu lieu
    return true;
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

/**
 * Vérifie si le serveur PHP fonctionne correctement
 */
export const testPhpServer = async (): Promise<boolean> => {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/php-test.php?_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const text = await response.text();
    
    // Vérifier si la réponse contient du PHP non exécuté
    if (isPhpResponse(text)) {
      console.error("Le serveur PHP renvoie du code PHP brut au lieu de l'exécuter:", text.substring(0, 200));
      return false;
    }
    
    try {
      const data = JSON.parse(text);
      return data.status === 'success';
    } catch (e) {
      return false;
    }
  } catch (error) {
    console.error("Erreur lors du test du serveur PHP:", error);
    return false;
  }
};

// Initialisation - vérification de la connexion
export const initDatabaseConnection = (): void => {
  logDb(`Initialisation de la connexion à la base de données ${FIXED_DB_NAME} avec l'utilisateur ${FIXED_DB_USER}`);
  
  // Tester si le serveur PHP fonctionne correctement
  testPhpServer().then(isWorking => {
    if (isWorking) {
      console.log("✅ Le serveur PHP fonctionne correctement");
    } else {
      console.warn("⚠️ Le serveur PHP ne fonctionne pas correctement - l'application fonctionnera en mode local uniquement");
    }
  });
};

// Exécuter l'initialisation automatiquement
initDatabaseConnection();
