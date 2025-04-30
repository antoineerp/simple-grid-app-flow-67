
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
    key.includes('sync_failed_')
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
      console.warn(`Suppression de l'entrée malformée dans localStorage: ${key}`);
      localStorage.removeItem(key);
      cleanedCount++;
    }
  });
  
  // Vérifier et nettoyer les entrées spécifiques qui pourraient causer des problèmes
  const specificKeys = [
    'membres_p71x6d_system_last_sync',
    'documents_p71x6d_system_last_sync',
    'collaboration_p71x6d_system_last_sync',
    'exigences_p71x6d_system_last_sync'
  ];
  
  specificKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        JSON.parse(value);
      }
    } catch (e) {
      console.warn(`Suppression de l'entrée spécifique malformée: ${key}`);
      localStorage.removeItem(key);
      cleanedCount++;
    }
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
};

export default cleanSyncStorage;
