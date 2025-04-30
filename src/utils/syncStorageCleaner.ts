
/**
 * Utilitaire pour nettoyer le localStorage des données de synchronisation
 */

const SYNC_PREFIX = 'sync_';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

/**
 * Nettoyer les données de synchronisation périmées du localStorage
 */
export const cleanSyncStorage = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    console.log("SyncStorageCleaner: Nettoyage du localStorage...");
    
    const now = Date.now();
    let cleanedCount = 0;
    
    // Parcourir toutes les clés dans localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (!key) continue;
      
      // Vérifier si c'est une clé de synchronisation
      if (key.startsWith(SYNC_PREFIX)) {
        try {
          const value = localStorage.getItem(key);
          if (!value) continue;
          
          // Essayer de parser JSON pour les métadonnées de la synchronisation
          if (key.includes('_meta_')) {
            const metadata = JSON.parse(value);
            
            // Vérifier la date de dernière modification
            if (metadata && metadata.lastModified) {
              const lastModified = new Date(metadata.lastModified).getTime();
              
              // Supprimer si trop ancien
              if (now - lastModified > MAX_AGE_MS) {
                localStorage.removeItem(key);
                cleanedCount++;
              }
            }
          }
        } catch (err) {
          console.error(`Erreur lors du nettoyage de ${key}:`, err);
        }
      }
    }
    
    console.log(`SyncStorageCleaner: ${cleanedCount} entrées nettoyées`);
  } catch (error) {
    console.error("SyncStorageCleaner: Erreur lors du nettoyage:", error);
  }
};

/**
 * Initialiser le nettoyage périodique du localStorage
 */
export const initializeSyncStorageCleaner = (): void => {
  if (typeof window === 'undefined') return;
  
  console.log("SyncStorageCleaner: Initialisation du nettoyage périodique");
  
  // Nettoyer au démarrage
  setTimeout(cleanSyncStorage, 5000);
  
  // Configurer le nettoyage périodique (toutes les 4 heures)
  setInterval(cleanSyncStorage, 4 * 60 * 60 * 1000);
};

/**
 * Sauvegarder en toute sécurité dans le localStorage
 */
export function safeLocalStorageSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde dans le localStorage (${key}):`, error);
  }
}

/**
 * Récupérer en toute sécurité depuis le localStorage
 */
export function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    
    // Si defaultValue est un string, on retourne directement la valeur
    if (typeof defaultValue === 'string') return value as unknown as T;
    
    try {
      // Sinon on essaie de parser en JSON
      return JSON.parse(value);
    } catch {
      return value as unknown as T;
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération depuis le localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Supprimer en toute sécurité depuis le localStorage
 */
export function safeLocalStorageRemove(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Erreur lors de la suppression depuis le localStorage (${key}):`, error);
  }
}

/**
 * Marquer qu'une table a été modifiée et nécessite une synchronisation
 */
export function markDataChanged(tableName: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `sync_changed_${tableName}`;
    localStorage.setItem(key, new Date().toISOString());
    
    // Émettre un événement pour notifier les autres parties de l'application
    window.dispatchEvent(new CustomEvent('data-changed', { 
      detail: { tableName, timestamp: new Date().toISOString() }
    }));
    
    console.log(`SyncStorageCleaner: Données marquées comme modifiées pour ${tableName}`);
  } catch (error) {
    console.error(`Erreur lors du marquage des données modifiées pour ${tableName}:`, error);
  }
}
