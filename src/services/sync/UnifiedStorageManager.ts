
/**
 * Gestionnaire unifié pour le stockage local des données
 * Simplifie le stockage et la récupération des données
 */

export class UnifiedStorageManager {
  private readonly STORAGE_PREFIX = 'unified_data_';
  private readonly PENDING_CHANGES_PREFIX = 'unified_pending_';
  
  /**
   * Sauvegarde des données en stockage local
   */
  saveData<T>(tableName: string, data: T[], userId?: string): void {
    try {
      if (!tableName) {
        console.error("[UnifiedStorage] Nom de table invalide");
        return;
      }
      
      // Générer la clé de stockage
      const storageKey = this.getStorageKey(tableName, userId);
      
      // Sauvegarder les données
      const serializedData = JSON.stringify(data);
      localStorage.setItem(storageKey, serializedData);
      
      console.log(`[UnifiedStorage] ${data.length} éléments sauvegardés pour ${tableName} (${userId || 'default'})`);
    } catch (error) {
      console.error(`[UnifiedStorage] Erreur lors de la sauvegarde des données pour ${tableName}:`, error);
    }
  }
  
  /**
   * Charge des données depuis le stockage local
   */
  loadData<T>(tableName: string, userId?: string): T[] {
    try {
      if (!tableName) {
        console.error("[UnifiedStorage] Nom de table invalide");
        return [];
      }
      
      // Générer la clé de stockage
      const storageKey = this.getStorageKey(tableName, userId);
      
      // Charger les données
      const serializedData = localStorage.getItem(storageKey);
      
      if (!serializedData) {
        // Vérifier les anciens formats de stockage pour la compatibilité
        const legacyData = this.checkLegacyStorage<T>(tableName, userId);
        if (legacyData.length > 0) {
          console.log(`[UnifiedStorage] Données trouvées dans l'ancien format pour ${tableName}`);
          return legacyData;
        }
        
        console.log(`[UnifiedStorage] Aucune donnée trouvée pour ${tableName} (${userId || 'default'})`);
        return [];
      }
      
      // Désérialiser les données
      const data = JSON.parse(serializedData) as T[];
      console.log(`[UnifiedStorage] ${data.length} éléments chargés pour ${tableName} (${userId || 'default'})`);
      
      return data;
    } catch (error) {
      console.error(`[UnifiedStorage] Erreur lors du chargement des données pour ${tableName}:`, error);
      return [];
    }
  }
  
  /**
   * Marque une table comme ayant des modifications non synchronisées
   */
  markUnsyncedChanges(tableName: string): void {
    try {
      localStorage.setItem(`${this.PENDING_CHANGES_PREFIX}${tableName}`, 'true');
    } catch (error) {
      console.error(`[UnifiedStorage] Erreur lors du marquage des modifications pour ${tableName}:`, error);
    }
  }
  
  /**
   * Marque une table comme entièrement synchronisée
   */
  markSynced(tableName: string): void {
    try {
      localStorage.removeItem(`${this.PENDING_CHANGES_PREFIX}${tableName}`);
    } catch (error) {
      console.error(`[UnifiedStorage] Erreur lors du nettoyage des modifications pour ${tableName}:`, error);
    }
  }
  
  /**
   * Vérifie si une table a des modifications non synchronisées
   */
  hasPendingChanges(tableName: string): boolean {
    return localStorage.getItem(`${this.PENDING_CHANGES_PREFIX}${tableName}`) === 'true';
  }
  
  /**
   * Génère une clé de stockage uniforme
   */
  private getStorageKey(tableName: string, userId?: string): string {
    return `${this.STORAGE_PREFIX}${tableName}_${userId || 'default'}`;
  }
  
  /**
   * Vérifie les anciens formats de stockage pour la rétrocompatibilité
   * Cela permet de migrer en douceur vers le nouveau système
   */
  private checkLegacyStorage<T>(tableName: string, userId?: string): T[] {
    // Essayer les différents formats de stockage connus
    const possibleKeys = [
      `${tableName}_${userId || 'default'}`,
      `data_${tableName}_${userId || 'default'}`
    ];
    
    for (const key of possibleKeys) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsedData = JSON.parse(data) as T[];
          // Migrer automatiquement vers le nouveau format
          this.saveData(tableName, parsedData, userId);
          return parsedData;
        }
      } catch (e) {
        console.warn(`[UnifiedStorage] Échec de lecture du format legacy ${key}:`, e);
      }
    }
    
    return [];
  }
}
