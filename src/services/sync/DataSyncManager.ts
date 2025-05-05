
import { toast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/services/auth/authService';

/**
 * Gestionnaire de synchronisation des données optimisé
 * Cette version élimine les complexités inutiles et adopte une approche plus directe
 */
class DataSyncManager {
  // Intervalles de temps pour la synchronisation (en millisecondes)
  private readonly SYNC_INTERVAL = 5000; // 5 secondes
  private readonly DEBOUNCE_TIME = 2000; // 2 secondes pour le debouncing
  
  // États de synchronisation par table
  private syncStatus: Record<string, {
    isSyncing: boolean;
    lastSynced: number;
    hasError: boolean;
    errorMessage: string | null;
    hasPendingChanges: boolean;
  }> = {};
  
  // Timers pour le debouncing
  private debounceTimers: Record<string, NodeJS.Timeout> = {};
  
  /**
   * Obtenir l'état actuel de la synchronisation d'une table
   */
  public getTableStatus(tableName: string) {
    if (!this.syncStatus[tableName]) {
      this.syncStatus[tableName] = {
        isSyncing: false,
        lastSynced: 0,
        hasError: false,
        errorMessage: null,
        hasPendingChanges: false,
      };
    }
    
    return this.syncStatus[tableName];
  }
  
  /**
   * Sauvegarder les données localement avec délai (debouncing)
   */
  public saveDataWithDebounce<T>(
    tableName: string,
    data: T[],
    saveCallbackFn?: (data: T[], userId?: string) => Promise<boolean>
  ): void {
    // Toujours sauvegarder localement immédiatement pour éviter la perte de données
    this.saveLocalData(tableName, data);
    
    // Marquer comme ayant des changements en attente
    const status = this.getTableStatus(tableName);
    status.hasPendingChanges = true;
    this.syncStatus[tableName] = status;
    
    // Annuler le timer précédent s'il existe
    if (this.debounceTimers[tableName]) {
      clearTimeout(this.debounceTimers[tableName]);
    }
    
    // Créer un nouveau timer pour la synchronisation différée
    this.debounceTimers[tableName] = setTimeout(() => {
      this.syncTable(tableName, data, saveCallbackFn)
        .then(() => {
          console.log(`DataSyncManager: ${tableName} synchronisé après debounce`);
        })
        .catch(error => {
          console.error(`DataSyncManager: Erreur lors de la synchronisation de ${tableName} après debounce`, error);
        });
    }, this.DEBOUNCE_TIME);
  }
  
  /**
   * Sauvegarder les données localement (immédiat)
   */
  public saveLocalData<T>(tableName: string, data: T[]): void {
    try {
      const currentUser = getCurrentUser()?.identifiant_technique || 'default';
      localStorage.setItem(`${tableName}_${currentUser}`, JSON.stringify(data));
      console.log(`DataSyncManager: Données ${tableName} sauvegardées localement pour ${currentUser}`);
    } catch (error) {
      console.error(`DataSyncManager: Erreur lors de la sauvegarde locale pour ${tableName}`, error);
    }
  }
  
  /**
   * Charger les données locales
   */
  public getLocalData<T>(tableName: string): T[] {
    try {
      const currentUser = getCurrentUser()?.identifiant_technique || 'default';
      const data = localStorage.getItem(`${tableName}_${currentUser}`);
      if (data) {
        return JSON.parse(data) as T[];
      }
    } catch (error) {
      console.error(`DataSyncManager: Erreur lors de la récupération locale pour ${tableName}`, error);
    }
    return [] as T[];
  }
  
  /**
   * Synchroniser les données avec le serveur
   */
  public async syncTable<T>(
    tableName: string,
    data: T[],
    saveCallbackFn?: (data: T[], userId?: string) => Promise<boolean>
  ): Promise<{success: boolean, timestamp: number}> {
    // Vérifier si une synchronisation est déjà en cours
    const status = this.getTableStatus(tableName);
    if (status.isSyncing) {
      console.log(`DataSyncManager: ${tableName} déjà en cours de synchronisation`);
      return { success: false, timestamp: Date.now() };
    }
    
    // Marquer comme en cours de synchronisation
    status.isSyncing = true;
    this.syncStatus[tableName] = status;
    
    try {
      const currentUser = getCurrentUser()?.identifiant_technique || 'default';
      console.log(`DataSyncManager: Début de synchronisation de ${tableName} pour ${currentUser}`);
      
      if (saveCallbackFn) {
        // Utiliser la fonction de sauvegarde fournie
        const success = await saveCallbackFn(data, currentUser);
        
        if (success) {
          // Mettre à jour l'état de synchronisation
          this.markSyncSuccess(tableName);
          return { success: true, timestamp: Date.now() };
        } else {
          // Échec de synchronisation
          this.markSyncFailed(tableName, "La fonction de sauvegarde a échoué");
          return { success: false, timestamp: Date.now() };
        }
      } else {
        // Pas de fonction de sauvegarde fournie, juste simuler une synchronisation réussie
        // En pratique, on utiliserait une API ici
        await new Promise(resolve => setTimeout(resolve, 300)); // Simuler un délai réseau
        
        // Sauvegarder localement pour garantir la cohérence
        this.saveLocalData(tableName, data);
        
        // Marquer comme synchronisé avec succès
        this.markSyncSuccess(tableName);
        return { success: true, timestamp: Date.now() };
      }
    } catch (error) {
      // En cas d'erreur, marquer l'échec
      this.markSyncFailed(tableName, error instanceof Error ? error.message : String(error));
      return { success: false, timestamp: Date.now() };
    }
  }
  
  /**
   * Marquer une synchronisation comme réussie
   */
  public markSyncSuccess(tableName: string): void {
    const status = this.getTableStatus(tableName);
    status.isSyncing = false;
    status.lastSynced = Date.now();
    status.hasError = false;
    status.errorMessage = null;
    status.hasPendingChanges = false;
    this.syncStatus[tableName] = status;
    
    console.log(`DataSyncManager: ${tableName} synchronisé avec succès`);
  }
  
  /**
   * Marquer une synchronisation comme échouée
   */
  public markSyncFailed(tableName: string, errorMessage: string): void {
    const status = this.getTableStatus(tableName);
    status.isSyncing = false;
    status.hasError = true;
    status.errorMessage = errorMessage;
    status.hasPendingChanges = true;
    this.syncStatus[tableName] = status;
    
    console.error(`DataSyncManager: Échec de synchronisation pour ${tableName}: ${errorMessage}`);
    
    // Afficher une notification à l'utilisateur
    toast({
      variant: 'destructive',
      title: 'Erreur de synchronisation',
      description: `Impossible de synchroniser les données pour "${tableName}". Vos modifications sont sauvegardées localement.`
    });
  }
  
  /**
   * Obtenir l'état global de la synchronisation
   */
  public getGlobalSyncStatus() {
    const tables = Object.keys(this.syncStatus);
    const activeSyncCount = tables.filter(t => this.syncStatus[t].isSyncing).length;
    const pendingChangesCount = tables.filter(t => this.syncStatus[t].hasPendingChanges).length;
    const failedSyncCount = tables.filter(t => this.syncStatus[t].hasError).length;
    
    return {
      activeSyncCount,
      pendingChangesCount,
      failedSyncCount
    };
  }

  /**
   * Synchroniser tous les changements en attente
   */
  public async syncAllPendingChanges<T>(): Promise<Record<string, {success: boolean, timestamp: number}>> {
    const pendingTables = Object.keys(this.syncStatus)
      .filter(tableName => this.syncStatus[tableName].hasPendingChanges);
    
    const results: Record<string, {success: boolean, timestamp: number}> = {};
    
    for (const tableName of pendingTables) {
      try {
        const data = this.getLocalData(tableName);
        results[tableName] = await this.syncTable(tableName, data);
      } catch (error) {
        console.error(`DataSyncManager: Erreur lors de la synchronisation de ${tableName}`, error);
        results[tableName] = { success: false, timestamp: Date.now() };
      }
    }
    
    return results;
  }
}

// Exportation du singleton
export const dataSyncManager = new DataSyncManager();

// Types pour l'API publique
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncState {
  isSyncing: boolean;
  lastSynced: number;
  hasError: boolean;
  errorMessage: string | null;
  hasPendingChanges: boolean;
}

export interface SyncOptions {
  showToast?: boolean;
  force?: boolean;
}

export interface SyncResult {
  success: boolean;
  timestamp: number;
}

export interface SyncRecord {
  status: SyncStatus;
  lastSynced: Date;
  lastError: string | null;
  pendingChanges: boolean;
}
