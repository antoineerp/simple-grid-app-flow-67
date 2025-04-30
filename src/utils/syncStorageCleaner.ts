
/**
 * Utilitaire pour nettoyer et gérer le stockage local des données de synchronisation
 */

// Obtenir une valeur du localStorage avec gestion d'erreurs
export function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Erreur lors de la récupération de ${key} depuis localStorage:`, error);
    return defaultValue;
  }
}

// Définir une valeur dans le localStorage avec gestion d'erreurs
export function safeLocalStorageSet(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement de ${key} dans localStorage:`, error);
    return false;
  }
}

// Supprimer une valeur du localStorage avec gestion d'erreurs
export function safeLocalStorageRemove(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression de ${key} du localStorage:`, error);
    return false;
  }
}

// Marquer une table comme modifiée
export function markDataChanged(tableName: string, userId?: string): void {
  const key = `${tableName}_changed_${userId || 'default'}`;
  safeLocalStorageSet(key, JSON.stringify({
    changed: true,
    timestamp: new Date().toISOString()
  }));
}

// Vérifier si une table a été modifiée
export function hasDataChanged(tableName: string, userId?: string): boolean {
  const key = `${tableName}_changed_${userId || 'default'}`;
  const data = safeLocalStorageGet<string>(key, '{"changed":false}');
  
  try {
    return JSON.parse(data).changed === true;
  } catch {
    return false;
  }
}

// Réinitialiser le drapeau de modification pour une table
export function resetDataChanged(tableName: string, userId?: string): void {
  const key = `${tableName}_changed_${userId || 'default'}`;
  safeLocalStorageRemove(key);
}

// Nettoyer les anciennes données de synchronisation
export function cleanupOldSyncData(maxAgeInDays: number = 30): void {
  try {
    const now = new Date().getTime();
    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000; // en millisecondes
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Ne traiter que les clés liées à la synchronisation
      if (key.includes('_changed_') || key.includes('sync_') || key.includes('_lastSync')) {
        const value = localStorage.getItem(key);
        if (!value) continue;
        
        try {
          const data = JSON.parse(value);
          if (data.timestamp) {
            const timestamp = new Date(data.timestamp).getTime();
            if (now - timestamp > maxAge) {
              console.log(`Nettoyage de l'ancienne donnée de synchronisation: ${key}`);
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Ignorer les valeurs non JSON
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage des anciennes données de synchronisation:', error);
  }
}

// Exporter une fonction pour nettoyer le localStorage
export function clearAllUserData(userId: string): boolean {
  try {
    const keysToRemove: string[] = [];
    
    // Parcourir toutes les clés du localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Vérifier si la clé contient l'ID utilisateur
      if (key.includes(userId)) {
        keysToRemove.push(key);
      }
    }
    
    // Supprimer toutes les clés identifiées
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`${keysToRemove.length} entrées supprimées pour l'utilisateur ${userId}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression des données de l'utilisateur ${userId}:`, error);
    return false;
  }
}

// Nouvelle fonction pour nettoyer le stockage de synchronisation
export function cleanSyncStorage(): void {
  try {
    console.log('Nettoyage du stockage de synchronisation...');
    const keysToClean: string[] = [];
    
    // Identifier les clés à nettoyer
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Vérifier si la clé contient [object Object] (clés mal formées)
      if (key.includes('[object Object]')) {
        keysToClean.push(key);
        continue;
      }
      
      // Nettoyer les entrées corrompues
      if (key.includes('_changed_') || key.includes('sync_') || key.includes('_lastSync')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            JSON.parse(value); // Tester si c'est un JSON valide
          }
        } catch (e) {
          keysToClean.push(key);
        }
      }
    }
    
    // Supprimer les clés corrompues
    keysToClean.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Suppression de la clé corrompue: ${key}`);
    });
    
    console.log(`${keysToClean.length} entrées corrompues supprimées`);
  } catch (error) {
    console.error('Erreur lors du nettoyage du stockage de synchronisation:', error);
  }
}

// Fonction d'initialisation pour le nettoyage du stockage
export function initializeSyncStorageCleaner(): void {
  // Nettoyer immédiatement au démarrage
  cleanSyncStorage();
  
  // Configurer le nettoyage périodique (toutes les 30 minutes)
  if (typeof window !== 'undefined') {
    setInterval(cleanSyncStorage, 30 * 60 * 1000);
    console.log('Nettoyage périodique du stockage initialisé');
  }
  
  // Nettoyer les données anciennes (plus de 30 jours)
  cleanupOldSyncData();
}
