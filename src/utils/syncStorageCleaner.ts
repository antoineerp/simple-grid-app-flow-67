
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
    key.includes('global_data_')
  );
  
  let cleanedCount = 0;
  
  // Vérifier et nettoyer les entrées malformées
  syncKeys.forEach(key => {
    try {
      // Vérifier si la clé contient [object Object] (problème de stringification)
      if (key.includes('[object Object]')) {
        console.warn(`Suppression de l'entrée malformée avec objet au lieu de chaîne: ${key}`);
        localStorage.removeItem(key);
        cleanedCount++;
        return;
      }
      
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
    'exigences_p71x6d_system_last_sync',
    'global_data_[object Object]_last_synced',
    'global_data_[object Object]_last_saved',
    'bibliotheque_documents_p71x6d_system',  // Anciennes clés de bibliothèque
    'bibliotheque_groups_p71x6d_system'      // Anciennes clés de bibliothèque
  ];
  
  specificKeys.forEach(key => {
    try {
      if (localStorage.getItem(key) !== null) {
        console.warn(`Suppression de l'entrée spécifique potentiellement problématique: ${key}`);
        localStorage.removeItem(key);
        cleanedCount++;
      }
    } catch (e) {
      console.warn(`Erreur lors de la suppression de l'entrée spécifique: ${key}`);
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
};

export default cleanSyncStorage;
