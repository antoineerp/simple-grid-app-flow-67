
import { toast } from '@/hooks/use-toast';
import { syncService, SyncResult } from '@/services/sync/SyncService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

// Types exportés
export type SyncStatus = 'pending' | 'success' | 'failed' | 'syncing';

export interface SyncRecord {
  lastSynced: Date | null;
  status: SyncStatus;
  lastError: string | null;
  pendingChanges: number;
}

export interface SyncOptions {
  showToast?: boolean;
}

class DataSyncManager {
  private syncRecords: Map<string, SyncRecord> = new Map();
  
  constructor() {
    // Initialiser l'état de synchronisation pour chaque table
    this.resetSyncRecord('documents');
    this.resetSyncRecord('document_groups');
    this.resetSyncRecord('exigences');
    this.resetSyncRecord('exigence_groups');
    
    console.log('DataSyncManager initialized');
  }
  
  private resetSyncRecord(tableName: string) {
    this.syncRecords.set(tableName, {
      lastSynced: null,
      status: 'pending',
      lastError: null,
      pendingChanges: 0
    });
  }
  
  public getSyncStatus(tableName: string): SyncRecord {
    return this.syncRecords.get(tableName) || {
      lastSynced: null,
      status: 'pending',
      lastError: null,
      pendingChanges: 0
    };
  }
  
  public markTableAsChanged(tableName: string): void {
    const record = this.getSyncStatus(tableName);
    this.syncRecords.set(tableName, {
      ...record,
      pendingChanges: (record.pendingChanges || 0) + 1
    });
  }
  
  public resetSyncStatus(tableName: string): void {
    const record = this.getSyncStatus(tableName);
    this.syncRecords.set(tableName, {
      ...record,
      status: 'pending',
      lastError: null
    });
  }
  
  public async syncData<T>(
    tableName: string, 
    data: T[],
    options?: SyncOptions
  ): Promise<SyncResult> {
    try {
      // Mettre à jour l'état
      const record = this.getSyncStatus(tableName);
      this.syncRecords.set(tableName, {
        ...record,
        status: 'syncing'
      });
      
      // Obtenir l'ID utilisateur
      const userId = getCurrentUser();
      
      if (!userId) {
        throw new Error("Utilisateur non connecté");
      }
      
      // Synchroniser avec le serveur
      const result = await syncService.syncTable({
        tableName,
        data
      }, userId);
      
      // Mettre à jour l'état
      if (result.success) {
        this.syncRecords.set(tableName, {
          lastSynced: new Date(),
          status: 'success',
          lastError: null,
          pendingChanges: 0
        });
        
        // Notification de réussite si demandé
        if (options?.showToast) {
          toast({
            title: "Synchronisation",
            description: `Synchronisation de ${tableName} réussie`,
          });
        }
      } else {
        this.syncRecords.set(tableName, {
          ...record,
          status: 'failed',
          lastError: result.message || "Erreur inconnue"
        });
        
        // Notification d'échec si demandé
        if (options?.showToast) {
          toast({
            title: "Erreur de synchronisation",
            description: result.message || `Échec de la synchronisation de ${tableName}`,
            variant: "destructive",
          });
        }
      }
      
      return result;
    } catch (error) {
      // Gérer l'erreur
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      // Mettre à jour l'état
      const record = this.getSyncStatus(tableName);
      this.syncRecords.set(tableName, {
        ...record,
        status: 'failed',
        lastError: errorMessage
      });
      
      // Notification d'échec
      if (options?.showToast) {
        toast({
          title: "Erreur de synchronisation",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }
  
  public async loadData<T>(
    tableName: string, 
    options?: SyncOptions
  ): Promise<T[]> {
    try {
      // Mettre à jour l'état
      const record = this.getSyncStatus(tableName);
      this.syncRecords.set(tableName, {
        ...record,
        status: 'syncing'
      });
      
      // Obtenir l'ID utilisateur
      const userId = getCurrentUser();
      
      if (!userId) {
        throw new Error("Utilisateur non connecté");
      }
      
      // Charger les données depuis le serveur
      const data = await syncService.loadDataFromServer<T>(tableName, userId);
      
      // Mettre à jour l'état
      this.syncRecords.set(tableName, {
        lastSynced: new Date(),
        status: 'success',
        lastError: null,
        pendingChanges: 0
      });
      
      // Notification de réussite si demandé
      if (options?.showToast) {
        toast({
          title: "Données chargées",
          description: `Les données de ${tableName} ont été chargées`,
        });
      }
      
      return data;
    } catch (error) {
      // Gérer l'erreur
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      // Mettre à jour l'état
      const record = this.getSyncStatus(tableName);
      this.syncRecords.set(tableName, {
        ...record,
        status: 'failed',
        lastError: errorMessage
      });
      
      // Notification d'échec
      if (options?.showToast) {
        toast({
          title: "Erreur de chargement",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      // Retourner un tableau vide en cas d'erreur
      return [];
    }
  }

  // Méthode pour obtenir les données locales
  public getLocalData<T>(tableName: string): T[] {
    try {
      const key = `${tableName}_data`;
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error(`Erreur lors de la récupération des données locales pour ${tableName}:`, error);
      return [];
    }
  }

  // Méthode pour sauvegarder les données localement
  public saveLocalData<T>(tableName: string, data: T[]): void {
    try {
      const key = `${tableName}_data`;
      localStorage.setItem(key, JSON.stringify(data));
      this.markTableAsChanged(tableName);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde des données locales pour ${tableName}:`, error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder les données localement",
        variant: "destructive",
      });
    }
  }
}

export const dataSyncManager = new DataSyncManager();
