
/**
 * Gestionnaire centralisé pour la synchronisation des données
 * Ce service surveille et coordonne toutes les opérations de synchronisation
 */
class DataSyncManager {
  private static instance: DataSyncManager;
  
  private pendingChanges: Map<string, any[]> = new Map();
  private activeSyncOperations: Map<string, Promise<any>> = new Map();
  private failedSyncs: Map<string, { error: string, timestamp: Date }> = new Map();
  private syncHistory: { table: string, success: boolean, timestamp: Date }[] = [];
  
  private constructor() {
    console.log("DataSyncManager initialisé");
    
    // Restaurer les données en attente depuis localStorage au démarrage
    this.restorePendingChanges();
    
    // Écouter les événements de visibilité pour synchroniser quand l'utilisateur revient
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log("DataSyncManager: Application visible, vérification des synchronisations en attente");
        this.processPendingChanges();
      }
    });
    
    // Écouter les événements de mise en ligne/hors ligne
    window.addEventListener('online', () => {
      console.log("DataSyncManager: Connexion rétablie, traitement des synchronisations en attente");
      this.processPendingChanges();
    });
    
    // Démarrer un intervalle pour traiter régulièrement les changements en attente
    setInterval(() => this.processPendingChanges(), 60000); // Vérifier toutes les minutes
  }
  
  /**
   * Obtenir l'instance unique du gestionnaire de synchronisation de données
   */
  public static getInstance(): DataSyncManager {
    if (!DataSyncManager.instance) {
      DataSyncManager.instance = new DataSyncManager();
    }
    return DataSyncManager.instance;
  }
  
  /**
   * Ajouter des modifications à synchroniser
   */
  public addChangesToSync(table: string, data: any[]): void {
    console.log(`DataSyncManager: Ajout de ${data.length} modifications pour ${table}`);
    
    // Sauvegarder les modifications en attente dans localStorage pour persistance entre sessions
    localStorage.setItem(`pending_sync_${table}`, JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }));
    
    this.pendingChanges.set(table, data);
    this.processPendingChanges();
  }
  
  /**
   * Restaurer les modifications en attente depuis localStorage
   */
  private restorePendingChanges(): void {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('pending_sync_')) {
          try {
            const tableName = key.replace('pending_sync_', '');
            const pendingData = JSON.parse(localStorage.getItem(key) || '{}');
            
            if (pendingData.data && Array.isArray(pendingData.data)) {
              console.log(`DataSyncManager: Restauration de ${pendingData.data.length} modifications en attente pour ${tableName}`);
              this.pendingChanges.set(tableName, pendingData.data);
            }
          } catch (e) {
            console.error(`DataSyncManager: Erreur lors de la restauration des données pour ${key}:`, e);
          }
        }
      });
    } catch (e) {
      console.error("DataSyncManager: Erreur lors de la restauration des modifications en attente:", e);
    }
  }
  
  /**
   * Traiter les modifications en attente
   */
  private processPendingChanges(): void {
    // Vérifier s'il y a une connexion Internet
    if (!navigator.onLine) {
      console.log("DataSyncManager: Pas de connexion Internet, synchronisation différée");
      return;
    }
    
    // Traiter chaque table avec des modifications en attente
    for (const [table, data] of this.pendingChanges.entries()) {
      // Ignorer les tables déjà en cours de synchronisation
      if (this.activeSyncOperations.has(table)) {
        console.log(`DataSyncManager: Synchronisation déjà en cours pour ${table}, ignorée`);
        continue;
      }
      
      // Déclencher un événement de synchronisation pour cette table
      console.log(`DataSyncManager: Déclenchement de la synchronisation pour ${table}`);
      
      // Créer et dispatcher un événement personnalisé
      const syncEvent = new CustomEvent('dataUpdate', {
        detail: {
          table,
          data
        }
      });
      
      window.dispatchEvent(syncEvent);
      
      // Marquer comme en cours de synchronisation
      this.activeSyncOperations.set(table, Promise.resolve().then(() => {
        // La synchronisation sera traitée par le GlobalSyncManager
        return table;
      }));
      
      // Supprimer des modifications en attente (seront traitées par GlobalSyncManager)
      this.pendingChanges.delete(table);
    }
  }
  
  /**
   * Obtenir le statut global de synchronisation
   */
  public getGlobalSyncStatus(): { activeSyncCount: number, pendingChangesCount: number, failedSyncCount: number } {
    return {
      activeSyncCount: this.activeSyncOperations.size,
      pendingChangesCount: this.pendingChanges.size,
      failedSyncCount: this.failedSyncs.size
    };
  }
  
  /**
   * Marquer une synchronisation comme réussie
   */
  public markSyncSuccess(table: string): void {
    console.log(`DataSyncManager: Synchronisation réussie pour ${table}`);
    this.activeSyncOperations.delete(table);
    this.failedSyncs.delete(table);
    this.syncHistory.push({ table, success: true, timestamp: new Date() });
    
    // Limiter l'historique à 100 entrées
    if (this.syncHistory.length > 100) {
      this.syncHistory.shift();
    }
    
    // Supprimer les données en attente du localStorage
    localStorage.removeItem(`pending_sync_${table}`);
  }
  
  /**
   * Marquer une synchronisation comme échouée
   */
  public markSyncFailed(table: string, error: string): void {
    console.error(`DataSyncManager: Échec de la synchronisation pour ${table}: ${error}`);
    this.activeSyncOperations.delete(table);
    this.failedSyncs.set(table, { error, timestamp: new Date() });
    this.syncHistory.push({ table, success: false, timestamp: new Date() });
    
    // Limiter l'historique à 100 entrées
    if (this.syncHistory.length > 100) {
      this.syncHistory.shift();
    }
  }
}

// Export d'une instance singleton
export const dataSyncManager = DataSyncManager.getInstance();
