
/**
 * Service qui gère la connexion à la base de données et l'identifiant utilisateur
 */

// Constantes pour les identifiants utilisateur
const DEFAULT_USER_ID = 'p71x6d_richard';
const SYSTEM_IDS = ['p71x6d_system2', 'p71x6d_system'];

// Variable pour stocker la dernière erreur de connexion
let lastConnectionError: string | null = null;

/**
 * Obtient l'identifiant de l'utilisateur actuel depuis le stockage local
 * Cette fonction bloque les IDs système problématiques
 * @returns L'identifiant utilisateur ou l'ID par défaut
 */
export const getCurrentUser = (): string => {
  try {
    // Récupérer l'ID depuis le localStorage puis le sessionStorage
    const localId = localStorage.getItem('userId');
    const sessionId = sessionStorage.getItem('userId');
    
    // Utiliser l'ID de session en priorité s'il existe
    let userId = sessionId || localId || DEFAULT_USER_ID;
    
    // Bloquer les IDs système problématiques
    if (SYSTEM_IDS.includes(userId)) {
      console.error(`ID système problématique détecté: ${userId}, utilisation de l'ID par défaut`);
      
      // Nettoyer les stockages locaux
      localStorage.removeItem('userId');
      sessionStorage.removeItem('userId');
      
      // Remplacer par l'ID par défaut
      localStorage.setItem('userId', DEFAULT_USER_ID);
      sessionStorage.setItem('userId', DEFAULT_USER_ID);
      
      userId = DEFAULT_USER_ID;
    }
    
    return userId;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'identifiant utilisateur:', error);
    return DEFAULT_USER_ID;
  }
};

/**
 * Définit l'identifiant de l'utilisateur actuel dans le stockage local
 * @param userId L'identifiant à définir
 * @returns true si l'opération a réussi, false sinon
 */
export const setCurrentUser = (userId: string): boolean => {
  try {
    if (!userId || typeof userId !== 'string' || userId.length < 3) {
      console.error('Tentative de définir un identifiant utilisateur invalide:', userId);
      return false;
    }
    
    // Bloquer les IDs système problématiques
    if (SYSTEM_IDS.includes(userId)) {
      console.error(`Tentative de définir l'ID système problématique: ${userId}`);
      return false;
    }
    
    // Nettoyer les stockages locaux d'abord
    localStorage.removeItem('userId');
    sessionStorage.removeItem('userId');
    
    // Définir le nouvel ID
    localStorage.setItem('userId', userId);
    sessionStorage.setItem('userId', userId);
    
    // Déclencher un événement pour informer l'application du changement
    window.dispatchEvent(new CustomEvent('database-user-changed', {
      detail: { userId }
    }));
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la définition de l\'identifiant utilisateur:', error);
    return false;
  }
};

/**
 * Se connecte en tant qu'utilisateur spécifié
 * @param userId L'identifiant utilisateur
 * @returns true si l'opération a réussi, false sinon
 */
export const connectAsUser = async (userId: string): Promise<boolean> => {
  try {
    if (!userId || typeof userId !== 'string' || userId.length < 3) {
      console.error('Tentative de connexion avec un identifiant utilisateur invalide:', userId);
      lastConnectionError = 'Identifiant utilisateur invalide';
      return false;
    }
    
    // Bloquer les IDs système problématiques
    if (SYSTEM_IDS.includes(userId)) {
      console.error(`Tentative de connexion avec l'ID système problématique: ${userId}`);
      lastConnectionError = 'Identifiant système non autorisé';
      return false;
    }
    
    // Définir l'ID utilisateur
    const success = setCurrentUser(userId);
    
    if (success) {
      // Déclencher un événement pour forcer la mise à jour des données
      window.dispatchEvent(new CustomEvent('userChanged', {
        detail: { userId }
      }));
      
      // Forcer une synchronisation
      window.dispatchEvent(new CustomEvent('force-sync-required', {
        detail: { reason: 'user_switch', timestamp: new Date().toISOString() }
      }));
    }
    
    return success;
  } catch (error) {
    console.error('Erreur lors de la connexion en tant qu\'utilisateur:', error);
    lastConnectionError = error instanceof Error ? error.message : 'Erreur inconnue';
    return false;
  }
};

/**
 * Vérifie si l'identifiant utilisateur actuel est un ID système
 * @returns true si c'est un ID système, false sinon
 */
export const isSystemUser = (): boolean => {
  const userId = getCurrentUser();
  return SYSTEM_IDS.includes(userId);
};

/**
 * Force l'utilisation d'un ID utilisateur sûr, non système
 * @returns Le nouvel ID utilisateur
 */
export const forceSafeUser = (): string => {
  if (isSystemUser()) {
    setCurrentUser(DEFAULT_USER_ID);
    return DEFAULT_USER_ID;
  }
  return getCurrentUser();
};

/**
 * Fonction pour déconnecter un utilisateur et revenir à l'utilisateur par défaut
 * @returns true si l'opération a réussi, false sinon
 */
export const disconnectUser = (): boolean => {
  try {
    // Définir l'utilisateur par défaut
    return setCurrentUser(DEFAULT_USER_ID);
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    lastConnectionError = error instanceof Error ? error.message : 'Erreur inconnue';
    return false;
  }
};

/**
 * Récupère la dernière erreur de connexion
 * @returns La dernière erreur de connexion ou null
 */
export const getLastConnectionError = (): string | null => {
  return lastConnectionError;
};

/**
 * Teste la connexion à la base de données
 * @returns true si la connexion est établie, false sinon
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Cette fonction simule un test de connexion à la base de données
    // Dans une implémentation réelle, elle ferait une requête à votre API
    
    // Simuler une requête réussie
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Réinitialiser l'erreur de connexion si le test réussit
    lastConnectionError = null;
    
    return true;
  } catch (error) {
    console.error('Erreur lors du test de connexion à la base de données:', error);
    lastConnectionError = error instanceof Error ? error.message : 'Erreur de connexion à la base de données';
    return false;
  }
};

/**
 * Récupère les informations sur la base de données
 * @returns Un objet contenant les informations sur la base de données
 */
export const getDatabaseInfo = async (): Promise<Record<string, any>> => {
  try {
    // Cette fonction simule la récupération d'informations sur la base de données
    // Dans une implémentation réelle, elle ferait une requête à votre API
    
    // Simuler une requête réussie
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      connected: true,
      version: '1.0',
      type: 'MySQL',
      tables: ['utilisateurs', 'documents', 'exigences', 'membres'],
      currentUser: getCurrentUser()
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de la base de données:', error);
    lastConnectionError = error instanceof Error ? error.message : 'Erreur de récupération des infos de la base de données';
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};

/**
 * Alias pour getCurrentUser pour éviter les confusions avec d'autres fonctions du même nom
 */
export const getDatabaseConnectionCurrentUser = getCurrentUser;
