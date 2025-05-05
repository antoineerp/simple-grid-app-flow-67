
import { getApiUrl } from '@/config/apiConfig';
import { getCurrentUser, getAuthHeaders } from '@/services/auth/authService';

// Interface pour les options de synchronisation
export interface SyncOptions {
  forceSync?: boolean;
  clearLocal?: boolean;
  userId?: string;
}

// Interface pour l'état de synchronisation
export interface SyncStatus {
  lastSyncTime: Date | null;
  isSyncing: boolean;
  hasError: boolean;
  errorMessage?: string;
}

// Types d'état de synchronisation
export enum SyncState {
  Idle = 'idle',
  Syncing = 'syncing',
  Error = 'error',
  Success = 'success'
}

// Interface pour un enregistrement de synchronisation
export interface SyncRecord<T> {
  id: string;
  timestamp: number;
  data: T;
  type: 'create' | 'update' | 'delete';
  synced: boolean;
  error?: string;
}

// Classe principale pour la gestion de la synchronisation des données
class DataSyncManager {
  private syncStatus: SyncStatus = {
    lastSyncTime: null,
    isSyncing: false,
    hasError: false
  };
  
  constructor() {
    console.log('DataSyncManager initialisé');
  }
  
  // Récupère l'état actuel de la synchronisation
  public getSyncStatus(): SyncState {
    if (this.syncStatus.isSyncing) {
      return SyncState.Syncing;
    }
    
    if (this.syncStatus.hasError) {
      return SyncState.Error;
    }
    
    if (this.syncStatus.lastSyncTime) {
      return SyncState.Success;
    }
    
    return SyncState.Idle;
  }
  
  // Méthode pour synchroniser toutes les tables
  public async syncAllTables(): Promise<boolean> {
    console.log('Synchronisation de toutes les tables...');
    this.syncStatus.isSyncing = true;
    
    try {
      // Ici, on implémenterait la logique de synchronisation de toutes les tables
      // Pour l'exemple, on simule une synchronisation réussie
      
      this.syncStatus.lastSyncTime = new Date();
      this.syncStatus.hasError = false;
      this.syncStatus.errorMessage = undefined;
      this.syncStatus.isSyncing = false;
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la synchronisation de toutes les tables:', error);
      
      this.syncStatus.hasError = true;
      this.syncStatus.errorMessage = error instanceof Error ? error.message : 'Erreur de synchronisation inconnue';
      this.syncStatus.isSyncing = false;
      
      return false;
    }
  }
  
  // Méthodes pour la gestion des données locales
  public getLocalData<T>(key: string, userId?: string): Promise<T | null> {
    const currentUser = userId || getCurrentUser()?.id || 'default';
    const storageKey = `${key}_${currentUser}`;
    
    try {
      const data = localStorage.getItem(storageKey);
      return Promise.resolve(data ? JSON.parse(data) : null);
    } catch (error) {
      console.error(`Erreur lors de la récupération des données locales pour ${key}:`, error);
      return Promise.resolve(null);
    }
  }
  
  public saveLocalData<T>(key: string, data: T, userId?: string): Promise<boolean> {
    const currentUser = userId || getCurrentUser()?.id || 'default';
    const storageKey = `${key}_${currentUser}`;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      return Promise.resolve(true);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde des données locales pour ${key}:`, error);
      return Promise.resolve(false);
    }
  }
  
  // Méthode générique pour synchroniser des données avec le serveur
  public async syncData<T>(endpoint: string, data: T, options: SyncOptions = {}): Promise<boolean> {
    if (!navigator.onLine && !options.forceSync) {
      console.log('Mode hors ligne détecté, synchronisation ignorée');
      return false;
    }
    
    this.syncStatus.isSyncing = true;
    
    try {
      const API_URL = getApiUrl();
      const userId = options.userId || getCurrentUser()?.id || 'default';
      
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, data })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur lors de la synchronisation avec ${endpoint}:`, errorText);
        throw new Error(`Échec de la synchronisation (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      
      this.syncStatus.lastSyncTime = new Date();
      this.syncStatus.hasError = false;
      this.syncStatus.errorMessage = undefined;
      
      return result.success === true;
    } catch (error) {
      console.error(`Erreur lors de la synchronisation avec ${endpoint}:`, error);
      
      this.syncStatus.hasError = true;
      this.syncStatus.errorMessage = error instanceof Error ? error.message : 'Erreur de synchronisation inconnue';
      
      return false;
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }
  
  // Méthode générique pour charger des données depuis le serveur
  public async loadData<T>(endpoint: string, options: SyncOptions = {}): Promise<T | null> {
    if (!navigator.onLine && !options.forceSync) {
      console.log('Mode hors ligne détecté, chargement depuis le serveur ignoré');
      return null;
    }
    
    this.syncStatus.isSyncing = true;
    
    try {
      const API_URL = getApiUrl();
      const userId = options.userId || getCurrentUser()?.id || 'default';
      
      const response = await fetch(`${API_URL}/${endpoint}?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur lors du chargement depuis ${endpoint}:`, errorText);
        throw new Error(`Échec du chargement (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      
      this.syncStatus.lastSyncTime = new Date();
      this.syncStatus.hasError = false;
      this.syncStatus.errorMessage = undefined;
      
      return result.success ? result.data : null;
    } catch (error) {
      console.error(`Erreur lors du chargement depuis ${endpoint}:`, error);
      
      this.syncStatus.hasError = true;
      this.syncStatus.errorMessage = error instanceof Error ? error.message : 'Erreur de chargement inconnue';
      
      return null;
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }
}

export const dataSyncManager = new DataSyncManager();
