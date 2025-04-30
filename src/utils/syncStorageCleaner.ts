
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
        JSON.parse(value);
      }
    } catch (e) {
      console.warn(`Suppression de l'entrée spécifique malformée: ${key}`, e);
      localStorage.removeItem(key);
      cleanedCount++;
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
  
  // Nettoyer périodiquement (une fois par heure)
  setInterval(() => {
    cleanSyncStorage();
  }, 3600000); // 1 heure
  
  // Ajouter un nettoyage à chaque chargement de page
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => cleanSyncStorage(), 2000);
    });
  }
};

// Fonction utilitaire pour sauvegarder de manière sécurisée dans le localStorage
export const safeLocalStorageSet = (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
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

export default cleanSyncStorage;
