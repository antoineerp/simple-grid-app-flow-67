
/**
 * Service pour gérer les connexions à la base de données
 * et les opérations liées à l'utilisateur actuel
 */

import { Utilisateur } from '../users/types';
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from '@/utils/syncStorageCleaner';

// Préfixe pour les bases de données Infomaniak
export const DB_PREFIX = 'p71x6d_';

// Clés de stockage
const CURRENT_DB_USER_KEY = 'current_db_user';
const LAST_CONNECTION_ERROR_KEY = 'last_connection_error';

// Variable pour stocker l'erreur de connexion
let lastConnectionError: string | null = null;

/**
 * Récupère l'utilisateur actuellement connecté à la base de données
 */
export const getDatabaseConnectionCurrentUser = (): string | null => {
  return safeLocalStorageGet<string | null>(CURRENT_DB_USER_KEY, null);
};

/**
 * Définit l'utilisateur actuellement connecté à la base de données
 */
export const setDatabaseConnectionCurrentUser = (identifiantTechnique: string | null): void => {
  if (identifiantTechnique) {
    safeLocalStorageSet(CURRENT_DB_USER_KEY, identifiantTechnique);
    console.log(`Utilisateur de la base de données défini: ${identifiantTechnique}`);
  } else {
    safeLocalStorageRemove(CURRENT_DB_USER_KEY);
    console.log('Utilisateur de la base de données supprimé');
  }
};

/**
 * Récupère l'utilisateur actuellement connecté (données complètes)
 */
export const getCurrentUser = (): string | null => {
  return getDatabaseConnectionCurrentUser();
};

/**
 * Définit l'erreur de connexion
 */
export const setConnectionError = (error: string | null): void => {
  lastConnectionError = error;
  
  if (error) {
    safeLocalStorageSet(LAST_CONNECTION_ERROR_KEY, error);
  } else {
    safeLocalStorageRemove(LAST_CONNECTION_ERROR_KEY);
  }
};

/**
 * Récupère la dernière erreur de connexion
 */
export const getLastConnectionError = (): string | null => {
  if (lastConnectionError) return lastConnectionError;
  
  // Essayer de charger depuis le localStorage si la variable n'est pas définie
  return safeLocalStorageGet<string | null>(LAST_CONNECTION_ERROR_KEY, null);
};

/**
 * Se connecte à la base de données en tant qu'utilisateur spécifique
 */
export const connectAsUser = async (identifiantTechnique: string): Promise<boolean> => {
  try {
    console.log(`Tentative de connexion à la base de données en tant que ${identifiantTechnique}...`);
    
    // Vérifier que l'identifiant commence par le préfixe requis
    if (!identifiantTechnique.startsWith(DB_PREFIX)) {
      setConnectionError(`L'identifiant technique doit commencer par ${DB_PREFIX}`);
      return false;
    }
    
    // Simuler une connexion réussie (dans une implémentation réelle, appelez votre API)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Définir l'utilisateur actuel
    setDatabaseConnectionCurrentUser(identifiantTechnique);
    setConnectionError(null);
    
    // Déclencher un événement pour informer l'application du changement d'utilisateur
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('database-user-changed', {
        detail: { user: identifiantTechnique }
      }));
    }
    
    console.log(`Connexion réussie en tant que ${identifiantTechnique}`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Erreur lors de la connexion en tant que ${identifiantTechnique}:`, errorMessage);
    
    setConnectionError(errorMessage);
    return false;
  }
};

/**
 * Déconnecte l'utilisateur actuel de la base de données
 */
export const disconnectUser = (): void => {
  const currentUser = getDatabaseConnectionCurrentUser();
  
  if (currentUser) {
    console.log(`Déconnexion de l'utilisateur ${currentUser}...`);
    
    // Supprimer l'utilisateur actuel
    setDatabaseConnectionCurrentUser(null);
    setConnectionError(null);
    
    // Déclencher un événement pour informer l'application
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('database-user-changed', {
        detail: { user: null }
      }));
    }
  }
};

/**
 * Initialise l'utilisateur actuel au démarrage de l'application
 */
export const initializeCurrentUser = async (): Promise<void> => {
  try {
    // Récupérer l'utilisateur stocké
    const storedUser = getDatabaseConnectionCurrentUser();
    
    if (storedUser) {
      console.log(`Reconnexion automatique en tant que ${storedUser}...`);
      
      // Tenter de se reconnecter
      const success = await connectAsUser(storedUser);
      
      if (!success) {
        console.warn(`Échec de la reconnexion automatique pour ${storedUser}`);
      }
    } else {
      console.log('Aucun utilisateur précédemment connecté trouvé');
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de l\'utilisateur:', error);
  }
};

/**
 * Teste la connexion à la base de données
 */
export const testDatabaseConnection = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const currentUser = getDatabaseConnectionCurrentUser();
    
    if (!currentUser) {
      return {
        success: false,
        message: "Aucun utilisateur connecté à la base de données"
      };
    }
    
    // Simuler un test de connexion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Pour cette démo, on considère que 95% des tests réussissent
    const success = Math.random() > 0.05;
    
    if (success) {
      return {
        success: true,
        message: `Connexion à la base de données ${currentUser} réussie`
      };
    } else {
      return {
        success: false,
        message: `Échec de la connexion à la base de données ${currentUser}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Récupère les informations sur la base de données
 */
export const getDatabaseInfo = async (): Promise<{
  name: string;
  size: string;
  tables: number;
  lastBackup: string | null;
}> => {
  const currentUser = getDatabaseConnectionCurrentUser();
  
  // Valeurs par défaut si aucun utilisateur n'est connecté
  if (!currentUser) {
    return {
      name: "Non connecté",
      size: "0 KB",
      tables: 0,
      lastBackup: null
    };
  }
  
  // Simuler la récupération d'informations
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    name: currentUser,
    size: `${Math.floor(Math.random() * 100) + 10} MB`,
    tables: Math.floor(Math.random() * 20) + 5,
    lastBackup: new Date().toISOString()
  };
};
