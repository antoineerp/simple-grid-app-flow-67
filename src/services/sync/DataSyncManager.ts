
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';
import { databaseHelper } from './DatabaseHelper';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'failed';

export interface SyncRecord {
  status: SyncStatus;
  lastSynced: Date | null;
  lastError: string | null;
  pendingChanges: boolean;
}

export interface SyncOptions {
  showToast?: boolean;
  forceUpdate?: boolean;
  validateTable?: boolean;
}

/**
 * Gestionnaire centralisé pour la synchronisation des données
 */
export class DataSyncManager {
  private static instance: DataSyncManager;
  private syncStatus: Record<string, SyncRecord> = {};
  private activeSyncs: Set<string> = new Set();
  private localStoragePrefix = 'data_';
  
  private constructor() {
    console.log('DataSyncManager initialisé');
    this.loadSyncStatus();
  }
  
  /**
   * Obtient l'instance unique du gestionnaire de synchronisation
   */
  public static getInstance(): DataSyncManager {
    if (!DataSyncManager.instance) {
      DataSyncManager.instance = new DataSyncManager();
    }
    return DataSyncManager.instance;
  }
  
  /**
   * Charge l'état de synchronisation depuis le localStorage
   */
  private loadSyncStatus(): void {
    try {
      const savedStatus = localStorage.getItem('sync_status');
      if (savedStatus) {
        const parsed = JSON.parse(savedStatus);
        
        // Convertir les dates de string à Date
        Object.keys(parsed).forEach(key => {
          if (parsed[key].lastSynced) {
            parsed[key].lastSynced = new Date(parsed[key].lastSynced);
          }
        });
        
        this.syncStatus = parsed;
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'état de synchronisation:', error);
    }
  }
  
  /**
   * Sauvegarde l'état de synchronisation dans le localStorage
   */
  private saveSyncStatus(): void {
    try {
      localStorage.setItem('sync_status', JSON.stringify(this.syncStatus));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état de synchronisation:', error);
    }
  }
  
  /**
   * Obtient l'état de synchronisation d'une table
   */
  public getSyncStatus(tableName: string): SyncRecord {
    if (!this.syncStatus[tableName]) {
      this.syncStatus[tableName] = {
        status: 'idle',
        lastSynced: null,
        lastError: null,
        pendingChanges: false
      };
      this.saveSyncStatus();
    }
    return this.syncStatus[tableName];
  }
  
  /**
   * Vérifie si une table est en cours de synchronisation
   */
  public isSyncing(tableName: string): boolean {
    return this.activeSyncs.has(tableName);
  }
  
  /**
   * Obtient la dernière date de synchronisation d'une table
   */
  public getLastSynced(tableName: string): Date | null {
    return this.getSyncStatus(tableName).lastSynced;
  }
  
  /**
   * Marque qu'il y a des changements en attente pour une table
   */
  public markPendingChanges(tableName: string): void {
    const status = this.getSyncStatus(tableName);
    status.pendingChanges = true;
    this.saveSyncStatus();
  }
  
  /**
   * Vérifie s'il y a des changements en attente pour une table
   */
  public hasPendingChanges(tableName: string): boolean {
    return this.getSyncStatus(tableName).pendingChanges;
  }
  
  /**
   * Obtient les données locales pour une table et un utilisateur
   */
  public getLocalData<T>(tableName: string, userId: string | null = null): T[] {
    const currentUser = userId || getCurrentUser() || 'p71x6d_system';
    const key = `${this.localStoragePrefix}${tableName}_${currentUser}`;
    
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Erreur lors de la lecture des données locales pour ${tableName}:`, error);
      return [];
    }
  }
  
  /**
   * Sauvegarde des données localement pour une table et un utilisateur
   */
  public saveLocalData<T>(tableName: string, data: T[], userId: string | null = null): void {
    const currentUser = userId || getCurrentUser() || 'p71x6d_system';
    const key = `${this.localStoragePrefix}${tableName}_${currentUser}`;
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
      
      // Marquer les changements en attente
      this.markPendingChanges(tableName);
      
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde des données locales pour ${tableName}:`, error);
      toast({
        variant: "destructive",
        title: "Erreur de stockage local",
        description: "Impossible d'enregistrer les données localement."
      });
    }
  }
  
  /**
   * Synchronise des données avec le serveur
   * @param tableName Nom de la table
   * @param data Données à synchroniser
   * @param options Options de synchronisation
   */
  public async syncData<T>(
    tableName: string, 
    data: T[], 
    options: SyncOptions = {},
    groupsData?: any[]
  ): Promise<{success: boolean, message: string}> {
    const { showToast = true, forceUpdate = false, validateTable = true } = options;
    const currentUser = getCurrentUser() || 'p71x6d_system';
    
    // Vérifier si une synchronisation est déjà en cours
    if (this.isSyncing(tableName) && !forceUpdate) {
      if (showToast) {
        toast({
          title: "Synchronisation en cours",
          description: `La synchronisation de ${tableName} est déjà en cours.`
        });
      }
      return { success: false, message: "Une synchronisation est déjà en cours" };
    }
    
    // Marquer comme en cours de synchronisation
    this.activeSyncs.add(tableName);
    const status = this.getSyncStatus(tableName);
    status.status = 'syncing';
    this.saveSyncStatus();
    
    if (showToast) {
      toast({
        title: "Synchronisation en cours",
        description: `Synchronisation de ${tableName} en cours...`
      });
    }
    
    try {
      // Sauvegarder localement d'abord
      this.saveLocalData(tableName, data);
      
      // Valider la structure de la table si nécessaire
      if (validateTable) {
        try {
          await databaseHelper.validateTable(tableName);
        } catch (error) {
          console.warn(`Erreur lors de la validation de la table ${tableName}:`, error);
          // Continuer malgré l'erreur
        }
      }
      
      // Construire l'URL de l'endpoint
      const API_URL = getApiUrl();
      const endpoint = `${API_URL}/${tableName}-sync.php`;
      
      // Préparer les données à envoyer
      const payload: any = {
        userId: currentUser
      };
      
      // Ajouter les données principales
      payload[tableName] = data;
      
      // Ajouter les groupes si fournis
      if (groupsData) {
        payload.groups = groupsData;
      }
      
      console.log(`Synchronisation de ${tableName} vers ${endpoint}`, payload);
      
      // Tentative avec la première URL
      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        // En cas d'erreur, essayer l'URL alternative
        console.warn(`Erreur avec l'URL primaire pour ${tableName}:`, error);
        
        try {
          const alternativeUrl = `/sites/qualiopi.ch/api/${tableName}-sync.php`;
          console.log(`Tentative avec URL alternative: ${alternativeUrl}`);
          
          response = await fetch(alternativeUrl, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
        } catch (error2) {
          throw new Error(`Échec des deux tentatives de connexion: ${error2}`);
        }
      }
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Échec de la synchronisation");
      }
      
      // Mettre à jour le statut
      status.status = 'success';
      status.lastSynced = new Date();
      status.lastError = null;
      status.pendingChanges = false;
      this.saveSyncStatus();
      
      if (showToast) {
        toast({
          title: "Synchronisation réussie",
          description: `Données ${tableName} synchronisées avec le serveur.`
        });
      }
      
      return { success: true, message: result.message || "Synchronisation réussie" };
      
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${tableName}:`, error);
      
      // Mettre à jour le statut
      status.status = 'failed';
      status.lastError = error instanceof Error ? error.message : "Erreur inconnue";
      this.saveSyncStatus();
      
      if (showToast) {
        toast({
          variant: "destructive",
          title: "Échec de la synchronisation",
          description: error instanceof Error ? error.message : "Erreur inconnue"
        });
      }
      
      return { success: false, message: error instanceof Error ? error.message : "Erreur inconnue" };
    } finally {
      // Marquer comme n'étant plus en cours de synchronisation
      this.activeSyncs.delete(tableName);
    }
  }
  
  /**
   * Charge des données depuis le serveur
   * @param tableName Nom de la table
   * @param options Options de chargement
   */
  public async loadData<T>(
    tableName: string,
    options: SyncOptions = {}
  ): Promise<T[]> {
    const { showToast = true } = options;
    const currentUser = getCurrentUser() || 'p71x6d_system';
    
    // Marquer comme en cours de synchronisation
    this.activeSyncs.add(tableName);
    const status = this.getSyncStatus(tableName);
    status.status = 'syncing';
    this.saveSyncStatus();
    
    try {
      // Construire l'URL de l'endpoint
      const API_URL = getApiUrl();
      const endpoint = `${API_URL}/${tableName}-load.php?userId=${currentUser}`;
      
      console.log(`Chargement de données ${tableName} depuis ${endpoint}`);
      
      // Tentative avec la première URL
      let response;
      try {
        response = await fetch(endpoint, {
          method: 'GET',
          headers: getAuthHeaders(),
          cache: 'no-store'
        });
      } catch (error) {
        // En cas d'erreur, essayer l'URL alternative
        console.warn(`Erreur avec l'URL primaire pour le chargement de ${tableName}:`, error);
        
        try {
          const alternativeUrl = `/sites/qualiopi.ch/api/${tableName}-load.php`;
          console.log(`Tentative avec URL alternative: ${alternativeUrl}`);
          
          response = await fetch(`${alternativeUrl}?userId=${currentUser}`, {
            method: 'GET',
            headers: getAuthHeaders(),
            cache: 'no-store'
          });
        } catch (error2) {
          throw new Error(`Échec des deux tentatives de chargement: ${error2}`);
        }
      }
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Extraire les données selon le format de réponse
      let data: T[] = [];
      
      if (result && result.success === true && Array.isArray(result.data)) {
        data = result.data;
      } else if (result && result.documents && Array.isArray(result.documents)) {
        data = result.documents;
      } else if (result && result.records && Array.isArray(result.records)) {
        data = result.records;
      } else if (Array.isArray(result)) {
        data = result;
      } else {
        console.warn(`Format de données inconnu pour ${tableName}:`, result);
        throw new Error("Format de données inconnu");
      }
      
      // Sauvegarder localement
      this.saveLocalData(tableName, data);
      
      // Mettre à jour le statut
      status.status = 'success';
      status.lastSynced = new Date();
      status.lastError = null;
      status.pendingChanges = false;
      this.saveSyncStatus();
      
      if (showToast) {
        toast({
          title: "Données chargées",
          description: `${data.length} enregistrements chargés depuis le serveur.`
        });
      }
      
      return data;
      
    } catch (error) {
      console.error(`Erreur lors du chargement des données ${tableName}:`, error);
      
      // Mettre à jour le statut
      status.status = 'failed';
      status.lastError = error instanceof Error ? error.message : "Erreur inconnue";
      this.saveSyncStatus();
      
      if (showToast) {
        toast({
          variant: "warning",
          title: "Mode hors ligne",
          description: "Utilisation des données locales."
        });
      }
      
      // En cas d'erreur, utiliser les données locales
      return this.getLocalData<T>(tableName);
    } finally {
      // Marquer comme n'étant plus en cours de synchronisation
      this.activeSyncs.delete(tableName);
    }
  }
  
  /**
   * Récupère l'état global de la synchronisation
   */
  public getGlobalSyncStatus(): {
    activeSyncCount: number;
    pendingChangesCount: number;
    failedSyncCount: number;
    activeTables: string[];
    pendingTables: string[];
    failedTables: string[];
  } {
    const activeTables: string[] = Array.from(this.activeSyncs);
    const pendingTables: string[] = [];
    const failedTables: string[] = [];
    
    Object.keys(this.syncStatus).forEach(tableName => {
      const status = this.syncStatus[tableName];
      if (status.pendingChanges) {
        pendingTables.push(tableName);
      }
      if (status.status === 'failed') {
        failedTables.push(tableName);
      }
    });
    
    return {
      activeSyncCount: activeTables.length,
      pendingChangesCount: pendingTables.length,
      failedSyncCount: failedTables.length,
      activeTables,
      pendingTables,
      failedTables
    };
  }
  
  /**
   * Synchronise toutes les tables qui ont des changements en attente
   */
  public async syncAllPending(): Promise<{
    success: boolean;
    results: Record<string, { success: boolean; message: string }>;
  }> {
    const pendingTables = Object.keys(this.syncStatus).filter(
      tableName => this.syncStatus[tableName].pendingChanges
    );
    
    if (pendingTables.length === 0) {
      return { success: true, results: {} };
    }
    
    const results: Record<string, { success: boolean; message: string }> = {};
    let allSuccess = true;
    
    for (const tableName of pendingTables) {
      const data = this.getLocalData(tableName);
      const result = await this.syncData(tableName, data, { showToast: false });
      
      results[tableName] = result;
      if (!result.success) {
        allSuccess = false;
      }
    }
    
    if (allSuccess) {
      toast({
        title: "Synchronisation complète",
        description: `Toutes les données ont été synchronisées avec le serveur.`
      });
    } else {
      const failedCount = Object.values(results).filter(r => !r.success).length;
      toast({
        variant: "warning",
        title: "Synchronisation partielle",
        description: `${failedCount} table(s) n'ont pas pu être synchronisée(s).`
      });
    }
    
    return { success: allSuccess, results };
  }
}

// Export d'une instance singleton
export const dataSyncManager = DataSyncManager.getInstance();
