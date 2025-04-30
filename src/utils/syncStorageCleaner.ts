
/**
 * Utilitaire pour nettoyer le stockage de synchronisation
 */

// Clé pour le dernier nettoyage
const LAST_CLEANUP_KEY = 'last_sync_storage_cleanup';

// Intervalle de nettoyage en millisecondes (12 heures)
const CLEANUP_INTERVAL = 12 * 60 * 60 * 1000;

// Préfixe pour les données modifiées
const CHANGED_DATA_PREFIX = 'sync_changed_';

/**
 * Initialiser le nettoyage périodique du stockage
 */
export const initializeSyncStorageCleaner = () => {
  try {
    const now = Date.now();
    const lastCleanup = parseInt(localStorage.getItem(LAST_CLEANUP_KEY) || '0');
    
    // Si le dernier nettoyage était il y a plus que l'intervalle, nettoyer maintenant
    if (now - lastCleanup > CLEANUP_INTERVAL) {
      cleanSyncStorage();
      localStorage.setItem(LAST_CLEANUP_KEY, now.toString());
    }
    
    // Planifier le nettoyage périodique
    window.addEventListener('beforeunload', () => {
      const currentTime = Date.now();
      const lastCleanupTime = parseInt(localStorage.getItem(LAST_CLEANUP_KEY) || '0');
      
      if (currentTime - lastCleanupTime > CLEANUP_INTERVAL) {
        cleanSyncStorage();
        localStorage.setItem(LAST_CLEANUP_KEY, currentTime.toString());
      }
    });
    
    console.log("Nettoyage du stockage de synchronisation initialisé");
  } catch (error) {
    console.error("Erreur lors de l'initialisation du nettoyage du stockage:", error);
  }
};

/**
 * Marquer un ensemble de données comme modifié
 */
export const markDataChanged = (dataKey: string) => {
  try {
    const changedKey = `${CHANGED_DATA_PREFIX}${dataKey}`;
    localStorage.setItem(changedKey, Date.now().toString());
    console.log(`Données marquées comme modifiées: ${dataKey}`);
  } catch (error) {
    console.error("Erreur lors du marquage des données comme modifiées:", error);
  }
};

/**
 * Nettoyer les données de synchronisation anciennes
 */
export const cleanSyncStorage = () => {
  try {
    console.log("Nettoyage du stockage de synchronisation en cours...");
    let cleanedCount = 0;
    
    // Parcourir toutes les clés du localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Nettoyer les marqueurs de données modifiées plus vieux que 30 jours
      if (key.startsWith(CHANGED_DATA_PREFIX)) {
        const timestamp = parseInt(localStorage.getItem(key) || '0');
        const now = Date.now();
        
        // Si plus vieux que 30 jours
        if (now - timestamp > 30 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    }
    
    console.log(`Nettoyage terminé: ${cleanedCount} éléments supprimés`);
  } catch (error) {
    console.error("Erreur lors du nettoyage du stockage:", error);
  }
};

/**
 * Fonction utilitaire sécurisée pour définir des valeurs dans le localStorage
 */
export const safeLocalStorageSet = <T>(key: string, value: T): void => {
  try {
    const jsonValue = JSON.stringify(value);
    localStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde dans localStorage pour la clé ${key}:`, error);
  }
};

/**
 * Fonction utilitaire sécurisée pour récupérer des valeurs du localStorage
 */
export const safeLocalStorageGet = <T>(key: string, defaultValue: T): T => {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Erreur lors de la lecture depuis localStorage pour la clé ${key}:`, error);
    return defaultValue;
  }
};
