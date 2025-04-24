
// Service pour gérer la connexion à la base de données
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { DatabaseInfo } from '@/hooks/useAdminDatabase';

// Variable pour stocker la dernière erreur de connexion
let lastConnectionError: string | null = null;

// Récupérer l'utilisateur actuel connecté à la base de données
export const getDatabaseConnectionCurrentUser = (): string | null => {
  return localStorage.getItem('currentDatabaseUser') || null;
};

// Alias pour la compatibilité avec le code existant
export const getCurrentUser = getDatabaseConnectionCurrentUser;

// Définir l'utilisateur actuel connecté à la base de données
export const setDatabaseConnectionCurrentUser = (user: string | null): void => {
  if (user) {
    localStorage.setItem('currentDatabaseUser', user);
  } else {
    localStorage.removeItem('currentDatabaseUser');
  }
};

// Vérifier si un utilisateur est connecté à la base de données
export const isConnectedToDatabase = (): boolean => {
  return !!getDatabaseConnectionCurrentUser();
};

// Se connecter en tant qu'utilisateur spécifique
export const connectAsUser = async (identifiantTechnique: string): Promise<boolean> => {
  try {
    lastConnectionError = null;
    console.log(`Connexion en tant que: ${identifiantTechnique}`);
    
    // Stocker l'utilisateur dans le localStorage
    setDatabaseConnectionCurrentUser(identifiantTechnique);
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la connexion en tant qu'utilisateur:", error);
    lastConnectionError = error instanceof Error ? error.message : "Erreur inconnue lors de la connexion";
    return false;
  }
};

// Déconnecter l'utilisateur actuel
export const disconnectUser = (): void => {
  setDatabaseConnectionCurrentUser(null);
  lastConnectionError = null;
  console.log("Utilisateur déconnecté de la base de données");
};

// Récupérer la dernière erreur de connexion
export const getLastConnectionError = (): string | null => {
  return lastConnectionError;
};

// Fonction pour tester la connexion à la base de données
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Test de connexion à la base de données...');
    
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/database-test`, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    
    const data = await response.json();
    console.log('Résultat du test de connexion:', data);
    
    // La connexion est réussie si le statut de la réponse est "success"
    return data.status === 'success';
  } catch (error) {
    console.error('Erreur lors du test de connexion à la base de données:', error);
    lastConnectionError = error instanceof Error ? error.message : "Erreur inconnue lors du test de connexion";
    return false;
  }
};

// Fonction pour récupérer les informations de la base de données
export const getDatabaseInfo = async (): Promise<DatabaseInfo> => {
  try {
    console.log('Récupération des informations de la base de données...');
    
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/database-test`, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error(`Erreur HTTP: ${response.status}`);
      const errorText = await response.text();
      console.error(`Contenu de l'erreur: ${errorText.substring(0, 200)}`);
      throw new Error(`Erreur lors de la récupération des informations de la base de données: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Données reçues:', data);
    
    if (data.status === 'success') {
      return {
        host: data.info.host || 'Non disponible',
        database: data.info.database_name || 'Non disponible',
        size: data.info.size || '0 MB',
        tables: data.info.table_count || 0,
        lastBackup: 'Non disponible', // Peut être ajouté au backend ultérieurement
        status: data.info.connection_status || 'Online',
        encoding: data.info.encoding,
        collation: data.info.collation,
        tableList: data.info.tables
      };
    } else if (data.status === 'warning') {
      return {
        host: data.info.host || 'Non disponible',
        database: data.info.database_name || 'Non disponible',
        size: '0 MB',
        tables: 0,
        lastBackup: 'Non disponible',
        status: 'Warning',
        encoding: 'Non disponible',
        collation: 'Non disponible'
      };
    } else {
      console.error('Échec de la récupération des informations de la base de données:', data.message || 'Raison inconnue');
      throw new Error(data.message || 'Échec de la récupération des informations de la base de données');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de la base de données:', error);
    lastConnectionError = error instanceof Error ? error.message : "Erreur inconnue lors de la récupération des informations";
    throw error;
  }
};
