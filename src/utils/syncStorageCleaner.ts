
/**
 * Utilitaire pour nettoyer les entrées de synchronisation malformées dans le localStorage
 */
export const cleanSyncStorage = () => {
  console.log("Nettoyage des données de synchronisation...");
  
  // Chercher toutes les clés de localStorage liées à la synchronisation
  const syncKeys = Object.keys(localStorage).filter(key => 
    key.includes('_last_sync') || 
    key.includes('sync_states_') ||
    key.includes('sync_pending_') ||
    key.includes('sync_failed_') ||
    key.includes('sync_in_progress_') ||
    key.includes('last_synced_')
  );
  
  let cleanedCount = 0;
  
  // Vérifier et nettoyer les entrées malformées
  syncKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        // Tenter de parser le JSON pour vérifier qu'il est valide
        JSON.parse(value);
      }
    } catch (e) {
      console.warn(`Suppression de l'entrée malformée dans localStorage: ${key}`, e);
      localStorage.removeItem(key);
      cleanedCount++;
      
      // Réinitialiser avec une valeur JSON valide pour les clés lastSynced
      if (key.includes('last_synced_')) {
        const now = JSON.stringify(new Date().toISOString());
        localStorage.setItem(key, now);
        console.log(`Réinitialisé ${key} avec une date valide JSON: ${now}`);
      }
    }
  });
  
  // Vérifier et nettoyer spécifiquement les entrées de timestamp qui ne sont pas au format ISO
  const timestampKeys = Object.keys(localStorage).filter(key => 
    key.includes('last_synced_') || 
    key.endsWith('_last_saved')
  );
  
  timestampKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        // Vérifier si la valeur n'est pas déjà une chaîne JSON
        if (!value.startsWith('"') || !value.endsWith('"')) {
          console.warn(`Timestamp non-JSON détecté dans localStorage: ${key} = ${value}`);
          
          try {
            // Essayer de parser la date
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              throw new Error("Date invalide");
            }
            
            // Convertir en JSON valide
            const jsonDate = JSON.stringify(date.toISOString());
            localStorage.setItem(key, jsonDate);
            console.log(`Corrigé ${key} en format JSON: ${jsonDate}`);
          } catch (e) {
            // Si le parsing échoue, réinitialiser avec la date actuelle
            console.warn(`Impossible de parser la date: ${value}, réinitialisation`);
            localStorage.removeItem(key);
            const now = JSON.stringify(new Date().toISOString());
            localStorage.setItem(key, now);
            console.log(`Réinitialisé ${key} avec une date valide: ${now}`);
            cleanedCount++;
          }
        } else {
          // Si c'est déjà une chaîne JSON, vérifier qu'elle contient une date valide
          try {
            const dateStr = JSON.parse(value);
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
              throw new Error("Date JSON invalide");
            }
          } catch (e) {
            console.warn(`Date JSON invalide détectée dans ${key}: ${value}`);
            localStorage.removeItem(key);
            const now = JSON.stringify(new Date().toISOString());
            localStorage.setItem(key, now);
            console.log(`Réinitialisé ${key} avec une date JSON valide: ${now}`);
            cleanedCount++;
          }
        }
      }
    } catch (e) {
      console.warn(`Suppression de l'entrée de timestamp malformée: ${key}`, e);
      localStorage.removeItem(key);
      cleanedCount++;
    }
  });
  
  // Vérifier et nettoyer les entrées spécifiques qui pourraient causer des problèmes
  const specificKeys = [
    'membres_p71x6d_system_last_sync',
    'documents_p71x6d_system_last_sync',
    'collaboration_p71x6d_system_last_sync',
    'exigences_p71x6d_system_last_sync',
    'last_synced_documents',
    'last_synced_membres',
    'last_synced_collaboration',
    'last_synced_exigences'
  ];
  
  specificKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        // Essayer de parser
        JSON.parse(value);
      }
    } catch (e) {
      console.warn(`Suppression de l'entrée spécifique malformée: ${key}`, e);
      localStorage.removeItem(key);
      cleanedCount++;
      
      // Si c'est une clé de timestamp, la réinitialiser avec une valeur valide
      if (key.startsWith('last_synced_')) {
        const now = JSON.stringify(new Date().toISOString());
        localStorage.setItem(key, now);
        console.log(`Réinitialisé ${key} avec une date valide: ${now}`);
      }
    }
  });
  
  // Nettoyer les états de synchronisation "bloqués"
  const inProgressKeys = Object.keys(localStorage).filter(key => key.includes('sync_in_progress_'));
  inProgressKeys.forEach(key => {
    console.warn(`Suppression de l'état de synchronisation bloqué: ${key}`);
    localStorage.removeItem(key);
    cleanedCount++;
  });
  
  console.log(`Nettoyage terminé: ${cleanedCount} entrées malformées supprimées.`);
  return cleanedCount;
};

/**
 * Nettoie les données de synchronisation au démarrage de l'application
 * et programme un nettoyage périodique
 */
export const initializeSyncStorageCleaner = () => {
  // Exécuter au démarrage de l'application
  cleanSyncStorage();
  
  // Nettoyer périodiquement (toutes les 15 minutes)
  setInterval(() => {
    cleanSyncStorage();
  }, 900000); // 15 minutes
  
  // Ajouter un nettoyage à chaque chargement de page
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => cleanSyncStorage(), 1000);
    });
    
    // Ajouter un nettoyage lors de la restauration de la connectivité
    window.addEventListener('online', () => {
      console.log("Connexion rétablie, nettoyage du stockage...");
      setTimeout(() => cleanSyncStorage(), 500);
    });
    
    // Nettoyer avant de quitter la page
    window.addEventListener('beforeunload', () => {
      cleanSyncStorage();
    });
  }
};

// Fonction utilitaire pour sauvegarder de manière sécurisée dans le localStorage
export const safeLocalStorageSet = (key: string, value: any) => {
  try {
    // S'assurer que la valeur est toujours au format JSON valide
    const jsonValue = typeof value === 'string' && !value.startsWith('"') ? 
      JSON.stringify(value) : 
      JSON.stringify(value);
    
    localStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde dans localStorage pour ${key}:`, error);
    return false;
  }
};

// Fonction utilitaire pour récupérer de manière sécurisée depuis le localStorage
export const safeLocalStorageGet = <T>(key: string, defaultValue: T): T => {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Erreur lors de la récupération depuis localStorage pour ${key}:`, error);
    localStorage.removeItem(key); // Supprimer l'entrée corrompue
    return defaultValue;
  }
};

// Fonction pour marquer qu'une modification a été effectuée et doit être synchronisée
export const markDataChanged = (tableName: string): void => {
  try {
    safeLocalStorageSet(`${tableName}_data_changed`, {
      timestamp: new Date().toISOString(),
      changed: true
    });
    
    // Déclencher un événement pour informer l'application
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync-data-changed', { 
        detail: { tableName, timestamp: new Date().toISOString() }
      }));
    }
    
    console.log(`Données marquées comme modifiées pour la table ${tableName}`);
  } catch (error) {
    console.error(`Erreur lors du marquage des données modifiées pour ${tableName}:`, error);
  }
};

// Fonction pour vérifier si des données ont été modifiées
export const hasDataChanged = (tableName: string): boolean => {
  try {
    const changeData = safeLocalStorageGet<{ changed: boolean, timestamp: string } | null>(`${tableName}_data_changed`, null);
    return changeData ? changeData.changed : false;
  } catch (error) {
    console.error(`Erreur lors de la vérification des modifications pour ${tableName}:`, error);
    return false;
  }
};

// S'assurer que le nettoyage est effectué dès l'importation du module
if (typeof window !== 'undefined') {
  initializeSyncStorageCleaner();
  console.log("Nettoyage du stockage initialisé");
}

export default cleanSyncStorage;
