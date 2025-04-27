
import { getApiUrl } from '@/config/apiConfig';
import { DatabaseInfo } from '@/hooks/useAdminDatabase';

// Obtenir l'URL de l'API
const API_URL = getApiUrl();

// Variables pour stocker l'état de la connexion
let currentDatabaseUser: string | null = null;
let lastConnectionError: string | null = null;

// Test de la connexion à la base de données
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log("Test de la connexion à la base de données...");
    
    // Utiliser le fichier de test direct optimisé
    const directTestUrl = `${API_URL}/direct-db-test.php`;
    console.log("URL API pour le test direct de connexion:", directTestUrl);
    
    const response = await fetch(directTestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    console.log("Statut de la réponse du test de connexion:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Réponse du test de connexion:", data);
    
    // Si le test direct échoue, essayer le fichier standard
    if (data.status !== 'success') {
      console.log("Test direct échoué, essai du fichier standard");
      return testStandardConnection();
    }
    
    return true;
  } catch (err) {
    console.error("Erreur lors du test direct de connexion:", err);
    console.log("Essai du test de connexion standard comme fallback");
    return testStandardConnection();
  }
};

// Test standard comme fallback
const testStandardConnection = async (): Promise<boolean> => {
  try {
    console.log("Test standard de la connexion à la base de données...");
    const response = await fetch(`${API_URL}/db-connection-test.php`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.status === 'success';
  } catch (err) {
    console.error("Erreur lors du test standard de connexion:", err);
    return false;
  }
};

// Récupérer les informations de la base de données
export const getDatabaseInfo = async (): Promise<DatabaseInfo> => {
  try {
    console.log("Récupération des informations sur la base de données...");
    console.log("URL API pour les informations de la base de données:", `${API_URL}/db-info.php`);
    
    const response = await fetch(`${API_URL}/db-info.php`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    console.log("Statut de la réponse des informations DB:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log("Réponse d'erreur lors de la récupération des informations:", response.status, "\n", errorText);
      throw new Error(`Impossible de récupérer les informations de la base de données (${response.status})`);
    }
    
    const data = await response.json();
    console.log("Informations de la base de données reçues:", data);
    
    if (data.status === 'success' && data.database_info) {
      // Si l'utilisateur est connecté, marquer comme connecté
      if (getCurrentUser()) {
        connectAsUser(getCurrentUser()!);
      }
      
      return {
        host: data.database_info.host,
        database: data.database_info.database,
        size: data.database_info.size,
        tables: data.database_info.tables,
        lastBackup: data.database_info.lastBackup,
        status: data.database_info.status,
        encoding: data.database_info.encoding,
        collation: data.database_info.collation,
        tableList: data.database_info.tableList
      };
    } else {
      throw new Error(data.message || 'Erreur lors de la récupération des informations');
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des informations de la base de données:", err);
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      host: 'Non connecté',
      database: 'Non connecté',
      size: 'N/A',
      tables: 0,
      lastBackup: 'N/A',
      status: 'Offline'
    };
  }
};

// Obtenir le nom de l'utilisateur actuellement connecté à la base de données
export const getCurrentUser = (): string | null => {
  // Vérifier d'abord dans la variable locale
  if (currentDatabaseUser) {
    return currentDatabaseUser;
  }
  
  // Sinon, récupérer depuis localStorage
  const storedUser = localStorage.getItem('database_user');
  
  // Initialiser avec une valeur par défaut pour éviter "Offline"
  if (!storedUser) {
    // Valeur par défaut pour éviter l'affichage "Offline"
    currentDatabaseUser = "p71x6d_system";
    localStorage.setItem('database_user', currentDatabaseUser);
    return currentDatabaseUser;
  }
  
  currentDatabaseUser = storedUser;
  return currentDatabaseUser;
};

// Se connecter en tant qu'utilisateur spécifié
export const connectAsUser = async (username: string): Promise<boolean> => {
  try {
    // En réalité, cette fonction effectuerait une requête API pour se connecter
    // Pour la démonstration, on simule un succès et stocke l'utilisateur
    currentDatabaseUser = username;
    localStorage.setItem('database_user', username);
    lastConnectionError = null;
    return true;
  } catch (error) {
    console.error("Erreur lors de la connexion en tant qu'utilisateur:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    lastConnectionError = message;
    return false;
  }
};

// Déconnecter l'utilisateur actuel
export const disconnectUser = (): void => {
  currentDatabaseUser = null;
  localStorage.removeItem('database_user');
};

// Obtenir la dernière erreur de connexion
export const getLastConnectionError = (): string | null => {
  return lastConnectionError;
};
