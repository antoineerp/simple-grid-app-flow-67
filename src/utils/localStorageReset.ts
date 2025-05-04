
/**
 * Utilitaire pour réinitialiser complètement le stockage local de l'application
 * À utiliser en cas de problèmes graves de synchronisation
 */

/**
 * Réinitialise complètement toutes les données de synchronisation dans le stockage local
 * @returns {boolean} - Indique si la réinitialisation a été effectuée avec succès
 */
export const resetAllLocalStorageData = (): boolean => {
  try {
    console.log("Début de la réinitialisation complète du stockage local");
    
    // Liste des préfixes pour les données susceptibles d'être corrompues
    const dataPrefixes = [
      'membres_',
      'documents_',
      'collaboration_',
      'sync_in_progress_',
      'last_sync_id_',
      'sync_pending_',
      'last_synced_',
      'lastServerSync_'
    ];
    
    // Parcourir toutes les clés du localStorage
    const localStorageKeys = Object.keys(localStorage);
    const sessionStorageKeys = Object.keys(sessionStorage);
    
    let keysRemoved = 0;
    
    // Supprimer les données de localStorage
    localStorageKeys.forEach(key => {
      const shouldRemove = dataPrefixes.some(prefix => key.startsWith(prefix));
      if (shouldRemove) {
        localStorage.removeItem(key);
        console.log(`Clé supprimée de localStorage: ${key}`);
        keysRemoved++;
      }
    });
    
    // Supprimer les données de sessionStorage
    sessionStorageKeys.forEach(key => {
      const shouldRemove = dataPrefixes.some(prefix => key.startsWith(prefix));
      if (shouldRemove) {
        sessionStorage.removeItem(key);
        console.log(`Clé supprimée de sessionStorage: ${key}`);
        keysRemoved++;
      }
    });
    
    // Suppression des clés spécifiques qui pourraient causer des problèmes
    const specificKeys = [
      'membres',
      'documents',
      'deviceId',
      'collaboration',
      'pending_sync_membres'
    ];
    
    specificKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`Clé spécifique supprimée de localStorage: ${key}`);
        keysRemoved++;
      }
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
        console.log(`Clé spécifique supprimée de sessionStorage: ${key}`);
        keysRemoved++;
      }
    });
    
    console.log(`Réinitialisation du stockage local terminée. ${keysRemoved} clés supprimées.`);
    return true;
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du stockage local:", error);
    return false;
  }
};

/**
 * Réinitialise uniquement les données des membres dans le stockage local
 * @returns {boolean} - Indique si la réinitialisation a été effectuée avec succès
 */
export const resetMembersLocalStorage = (): boolean => {
  try {
    console.log("Début de la réinitialisation des données des membres dans le stockage local");
    
    // Liste des préfixes pour les données des membres
    const memberPrefixes = [
      'membres_',
      'sync_in_progress_membres',
      'last_sync_id_membres',
      'sync_pending_membres',
      'last_synced_membres',
      'lastServerSync_membres_'
    ];
    
    // Parcourir toutes les clés du localStorage
    const localStorageKeys = Object.keys(localStorage);
    const sessionStorageKeys = Object.keys(sessionStorage);
    
    let keysRemoved = 0;
    
    // Supprimer les données de localStorage
    localStorageKeys.forEach(key => {
      const shouldRemove = memberPrefixes.some(prefix => key.startsWith(prefix)) || key === 'membres';
      if (shouldRemove) {
        localStorage.removeItem(key);
        console.log(`Clé supprimée de localStorage: ${key}`);
        keysRemoved++;
      }
    });
    
    // Supprimer les données de sessionStorage
    sessionStorageKeys.forEach(key => {
      const shouldRemove = memberPrefixes.some(prefix => key.startsWith(prefix)) || key === 'membres';
      if (shouldRemove) {
        sessionStorage.removeItem(key);
        console.log(`Clé supprimée de sessionStorage: ${key}`);
        keysRemoved++;
      }
    });
    
    console.log(`Réinitialisation des données des membres terminée. ${keysRemoved} clés supprimées.`);
    return true;
  } catch (error) {
    console.error("Erreur lors de la réinitialisation des données des membres:", error);
    return false;
  }
};

/**
 * Réinitialiser et générer un nouvel identifiant d'appareil
 * @returns {string} - Le nouvel identifiant d'appareil généré
 */
export const resetDeviceId = (): string => {
  try {
    // Supprimer l'ancien identifiant d'appareil
    localStorage.removeItem('deviceId');
    sessionStorage.removeItem('deviceId');
    
    // Générer un nouvel identifiant d'appareil
    const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('deviceId', newDeviceId);
    
    console.log(`Nouvel identifiant d'appareil généré: ${newDeviceId}`);
    return newDeviceId;
  } catch (error) {
    console.error("Erreur lors de la réinitialisation de l'identifiant d'appareil:", error);
    return "";
  }
};
