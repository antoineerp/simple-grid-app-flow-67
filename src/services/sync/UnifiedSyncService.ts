/**
 * Service de synchronisation unifié
 * Ce service centralise toute la logique de synchronisation de l'application
 */
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { UnifiedStorageManager } from './UnifiedStorageManager';
import { NetworkManager } from './NetworkManager';
import { toast } from '@/components/ui/use-toast';

export interface SyncOptions {
  showToast?: boolean;
  forceServerSync?: boolean;
  syncTimeout?: number;
}

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp?: Date;
  count?: number;
}

/**
 * Service unifié de synchronisation
 */
export class UnifiedSyncService {
  private storageManager: UnifiedStorageManager;
  private networkManager: NetworkManager;
  private lastSyncTimestamps: Map<string, Date>;
  
  constructor() {
    this.storageManager = new UnifiedStorageManager();
    this.networkManager = new NetworkManager();
    this.lastSyncTimestamps = new Map<string, Date>();
  }
  
  /**
   * Charge les données depuis le serveur ou le stockage local
   */
  async loadData<T extends object>(
    tableName: string, 
    userId?: string,
    options: SyncOptions = {}
  ): Promise<T[]> {
    const currentUser = userId || getCurrentUser() || 'default';
    const isOnline = this.networkManager.isOnline();
    
    // Si on est hors ligne ou si le chargement serveur échoue, on utilise les données locales
    if (!isOnline) {
      console.log(`[UnifiedSync] Mode hors ligne - Chargement local pour ${tableName}`);
      const localData = this.storageManager.loadData<T>(tableName, currentUser);
      return localData;
    }

    // Mode en ligne: tenter de charger depuis le serveur
    try {
      const API_URL = getApiUrl();
      const endpoint = `${API_URL}/${tableName}-load.php`;
      
      console.log(`[UnifiedSync] Chargement depuis le serveur: ${endpoint}`);
      
      const response = await this.fetchWithTimeout(
        `${endpoint}?userId=${currentUser}`, 
        {
          method: 'GET',
          headers: getAuthHeaders(),
          cache: 'no-store'
        },
        options.syncTimeout || 10000
      );
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Extraire les données selon différents formats possibles de réponse
      let serverData: T[] = [];
      
      if (result.success && Array.isArray(result.documents || result.records || result.data)) {
        serverData = result.documents || result.records || result.data;
      } else if (Array.isArray(result)) {
        serverData = result;
      } else {
        console.warn(`Format de réponse non reconnu pour ${tableName}`);
        throw new Error("Format de réponse non reconnu");
      }
      
      // Fusionner avec les données locales et sauvegarder localement
      const localData = this.storageManager.loadData<T>(tableName, currentUser);
      const mergedData = this.mergeData<T>(localData, serverData);
      
      // Sauvegarder le résultat localement
      this.storageManager.saveData(tableName, mergedData, currentUser);
      
      // Mettre à jour le timestamp de dernière synchronisation
      this.setLastSynced(tableName);
      
      if (options.showToast) {
        toast({
          title: "Données synchronisées",
          description: `${mergedData.length} éléments chargés depuis le serveur`,
        });
      }
      
      return mergedData;
    } catch (error) {
      console.error(`[UnifiedSync] Erreur lors du chargement des données de ${tableName}:`, error);
      
      // En cas d'erreur, utiliser les données locales
      const localData = this.storageManager.loadData<T>(tableName, currentUser);
      
      if (options.showToast) {
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Utilisation des données locales en mode hors-ligne",
        });
      }
      
      return localData;
    }
  }
  
  /**
   * Synchronise les données avec le serveur
   */
  async syncData<T extends object>(
    tableName: string, 
    data: T[], 
    userId?: string,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const currentUser = userId || getCurrentUser() || 'default';
    
    // Toujours sauvegarder localement d'abord pour éviter les pertes de données
    this.storageManager.saveData(tableName, data, currentUser);
    
    // Vérifier si nous sommes en ligne
    const isOnline = this.networkManager.isOnline();
    if (!isOnline && !options.forceServerSync) {
      console.log(`[UnifiedSync] Mode hors ligne - Données sauvegardées localement pour ${tableName}`);
      
      if (options.showToast) {
        toast({
          variant: "destructive",
          title: "Mode hors ligne",
          description: "Les modifications ont été sauvegardées localement uniquement",
        });
      }
      
      return {
        success: true,
        message: "Données sauvegardées localement (mode hors ligne)",
      };
    }
    
    // Mode en ligne: tenter la synchronisation serveur
    try {
      const API_URL = getApiUrl();
      const endpoint = `${API_URL}/${tableName}-sync.php`;
      
      console.log(`[UnifiedSync] Synchronisation avec le serveur: ${endpoint}`);
      
      const response = await this.fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: currentUser,
            [tableName]: data
          })
        },
        options.syncTimeout || 15000
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[UnifiedSync] Erreur HTTP ${response.status}: ${errorText}`);
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success === true) {
        // Mettre à jour le timestamp de dernière synchronisation
        this.setLastSynced(tableName);
        
        // Marquer comme "propre" dans le stockage local
        this.storageManager.markSynced(tableName);
        
        if (options.showToast) {
          toast({
            title: "Synchronisation réussie",
            description: "Les données ont été synchronisées avec le serveur",
          });
        }
        
        return {
          success: true,
          message: "Synchronisation réussie",
          timestamp: new Date(),
          count: data.length
        };
      } else {
        throw new Error(`La synchronisation a échoué: ${result.message || "Raison inconnue"}`);
      }
    } catch (error) {
      console.error(`[UnifiedSync] Erreur lors de la synchronisation de ${tableName}:`, error);
      
      // Marquer comme "non synchronisé" dans le stockage local
      this.storageManager.markUnsyncedChanges(tableName);
      
      // Notification seulement si demandé
      if (options.showToast) {
        toast({
          variant: "destructive",
          title: "Erreur de synchronisation",
          description: "Les données ont été sauvegardées localement, mais la synchronisation avec le serveur a échoué",
        });
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Force une synchronisation complète depuis le serveur
   */
  async forceSyncFromServer<T extends object>(
    tableName: string, 
    userId?: string
  ): Promise<SyncResult> {
    try {
      const data = await this.loadData<T>(tableName, userId, { 
        forceServerSync: true,
        showToast: false,
        syncTimeout: 30000
      });
      
      return {
        success: true,
        message: "Synchronisation forcée réussie",
        count: data.length,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Vérifie si des données sont en attente de synchronisation
   */
  hasPendingChanges(tableName: string): boolean {
    return this.storageManager.hasPendingChanges(tableName);
  }
  
  /**
   * Récupère la dernière date de synchronisation
   */
  getLastSynced(tableName: string): Date | null {
    return this.lastSyncTimestamps.get(tableName) || null;
  }
  
  /**
   * Définit la dernière date de synchronisation
   */
  private setLastSynced(tableName: string): void {
    const now = new Date();
    this.lastSyncTimestamps.set(tableName, now);
    localStorage.setItem(`unified_sync_last_synced_${tableName}`, now.toISOString());
  }
  
  /**
   * Fusionne les données locales et serveur
   */
  private mergeData<T extends object>(localData: T[], serverData: T[]): T[] {
    if (!localData || localData.length === 0) return serverData;
    if (!serverData || serverData.length === 0) return localData;
    
    // Vérifier si les données ont un ID
    const hasId = localData[0] && 'id' in localData[0];
    
    if (!hasId) {
      // Sans ID, on privilégie les données serveur
      return serverData;
    }
    
    // Créer une map des données locales pour accès rapide
    const localDataMap = new Map<string, T>();
    localData.forEach(item => {
      if ('id' in item) {
        localDataMap.set(String((item as any).id), item);
      }
    });
    
    // Fusionner les données
    const mergedData: T[] = [];
    
    // Traiter les données du serveur
    serverData.forEach(serverItem => {
      if ('id' in serverItem) {
        const id = String((serverItem as any).id);
        const localItem = localDataMap.get(id);
        
        // Si l'élément existe localement
        if (localItem) {
          // Comparer les dates si disponibles
          const hasDateMod = 'date_modification' in serverItem && 'date_modification' in localItem;
          
          if (hasDateMod) {
            const serverModDate = new Date((serverItem as any).date_modification);
            const localModDate = new Date((localItem as any).date_modification);
            
            // Privilégier la version la plus récente
            if (localModDate > serverModDate) {
              mergedData.push(localItem);
            } else {
              mergedData.push(serverItem);
            }
          } else {
            // Sans date, privilégier le serveur
            mergedData.push(serverItem);
          }
          
          localDataMap.delete(id);
        } else {
          // Élément uniquement sur le serveur
          mergedData.push(serverItem);
        }
      } else {
        // Élément sans ID
        mergedData.push(serverItem);
      }
    });
    
    // Ajouter les éléments uniquement locaux
    localDataMap.forEach(item => {
      mergedData.push(item);
    });
    
    return mergedData;
  }
  
  /**
   * Version améliorée de fetch avec timeout
   */
  private async fetchWithTimeout(
    url: string, 
    options: RequestInit = {}, 
    timeoutMs = 10000
  ): Promise<Response> {
    const controller = new AbortController();
    const { signal } = controller;
    
    // Créer une promesse qui rejette après le délai spécifié
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new Error(`Timeout après ${timeoutMs}ms`));
      }, timeoutMs);
    });
    
    // Course entre fetch et timeout
    return Promise.race([
      fetch(url, { ...options, signal }),
      timeoutPromise
    ]);
  }
}

// Exporter une instance singleton du service
export const unifiedSync = new UnifiedSyncService();
export default unifiedSync;
