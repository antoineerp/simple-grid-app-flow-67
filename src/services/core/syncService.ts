
import { getCurrentUserId, getDeviceId } from './userService';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

class GlobalSyncService {
  private lastSyncTimes: Record<string, Date> = {};
  private syncErrors: Record<string, string | null> = {};
  private isSyncing: Record<string, boolean> = {};
  private forceRefresh: boolean = false;

  constructor() {
    // Charger les dernières synchronisations depuis le localStorage
    try {
      const savedTimes = localStorage.getItem('last_sync_times');
      if (savedTimes) {
        const parsed = JSON.parse(savedTimes);
        // Convertir les chaînes ISO en objets Date
        Object.keys(parsed).forEach(key => {
          this.lastSyncTimes[key] = new Date(parsed[key]);
        });
      }
    } catch (e) {
      console.error('Erreur lors du chargement des temps de synchronisation:', e);
    }
  }

  // Vérification de l'état de synchronisation d'une table
  public isSyncingTable(tableName: string): boolean {
    return this.isSyncing[tableName] || false;
  }

  // Récupérer la dernière date de synchronisation
  public getLastSynced(tableName: string): Date | null {
    return this.lastSyncTimes[tableName] || null;
  }

  // Récupérer la dernière erreur de synchronisation
  public getLastError(tableName: string): string | null {
    return this.syncErrors[tableName] || null;
  }

  // Forcer une synchronisation complète
  public setForceRefresh(force: boolean): void {
    this.forceRefresh = force;
  }

  // Marquer le début d'une synchronisation
  public markSyncStart(tableName: string): void {
    this.isSyncing[tableName] = true;
  }

  // Marquer la fin d'une synchronisation
  public markSyncEnd(tableName: string, error: string | null = null): void {
    this.isSyncing[tableName] = false;
    
    if (!error) {
      this.lastSyncTimes[tableName] = new Date();
      // Sauvegarder dans localStorage
      this.saveLastSyncTimes();
    }
    
    this.syncErrors[tableName] = error;
  }

  // Sauvegarder les temps de synchronisation dans localStorage
  private saveLastSyncTimes(): void {
    try {
      // Convertir les objets Date en chaînes ISO
      const timesToSave: Record<string, string> = {};
      Object.keys(this.lastSyncTimes).forEach(key => {
        if (this.lastSyncTimes[key]) {
          timesToSave[key] = this.lastSyncTimes[key].toISOString();
        }
      });
      
      localStorage.setItem('last_sync_times', JSON.stringify(timesToSave));
    } catch (e) {
      console.error('Erreur lors de la sauvegarde des temps de synchronisation:', e);
    }
  }

  // Charger les données depuis le serveur
  public async loadDataFromServer<T>(tableName: string, userId?: string): Promise<T[]> {
    const currentUser = userId || getCurrentUserId() || localStorage.getItem('currentUserId');
    const deviceId = getDeviceId();
    const API_URL = getApiUrl();
    
    if (!API_URL) {
      throw new Error("URL de l'API non configurée");
    }

    if (!currentUser) {
      console.error("Aucun utilisateur identifié pour la synchronisation");
      throw new Error("Utilisateur non identifié");
    }
    
    console.log(`Chargement des données ${tableName} pour l'utilisateur: ${currentUser}`);
    this.markSyncStart(tableName);
    
    try {
      // Ajout d'un paramètre force_refresh pour forcer le rechargement complet
      const url = this.forceRefresh 
        ? `${API_URL}/${tableName}-load.php?userId=${currentUser}&deviceId=${deviceId}&force_refresh=1` 
        : `${API_URL}/${tableName}-load.php?userId=${currentUser}&deviceId=${deviceId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'X-Device-ID': deviceId,
          'X-User-ID': currentUser,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success === false) {
        throw new Error(data.message || `Erreur lors du chargement des données ${tableName}`);
      }
      
      this.markSyncEnd(tableName);
      
      // Retourner les données selon le format disponible
      if (data.records && Array.isArray(data.records)) {
        return data.records;
      } else if (data[tableName] && Array.isArray(data[tableName])) {
        return data[tableName];
      } else {
        return [];
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      this.markSyncEnd(tableName, errorMsg);
      throw error;
    } finally {
      // Réinitialiser le flag de forceRefresh après utilisation
      this.forceRefresh = false;
    }
  }

  // Envoyer des données au serveur
  public async sendDataToServer<T>(tableName: string, data: T[], userId?: string): Promise<boolean> {
    const currentUser = userId || getCurrentUserId() || localStorage.getItem('currentUserId');
    const deviceId = getDeviceId();
    const API_URL = getApiUrl();
    
    if (!API_URL) {
      throw new Error("URL de l'API non configurée");
    }

    if (!currentUser) {
      console.error("Aucun utilisateur identifié pour la synchronisation");
      throw new Error("Utilisateur non identifié");
    }
    
    console.log(`Envoi de données ${tableName} pour l'utilisateur: ${currentUser} (${data.length} éléments)`);
    this.markSyncStart(tableName);
    
    try {
      const response = await fetch(`${API_URL}/${tableName}-sync.php`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
          'X-Device-ID': deviceId,
          'X-User-ID': currentUser
        },
        body: JSON.stringify({
          userId: currentUser,
          deviceId,
          records: data
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success === false) {
        throw new Error(result.message || `Erreur lors de la synchronisation des données ${tableName}`);
      }
      
      this.markSyncEnd(tableName);
      console.log(`Données ${tableName} synchronisées avec succès pour l'utilisateur ${currentUser}`);
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      this.markSyncEnd(tableName, errorMsg);
      throw error;
    }
  }

  // Méthode pour synchroniser une table (charger et envoyer)
  public async syncTable(tableName: string, dataToSync?: any[], userId?: string): Promise<{success: boolean, message?: string}> {
    try {
      // Si des données sont fournies, les envoyer d'abord
      if (dataToSync && dataToSync.length > 0) {
        await this.sendDataToServer(tableName, dataToSync, userId);
      }
      
      // Ensuite charger les données à jour
      await this.loadDataFromServer(tableName, userId);
      
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      return { success: false, message };
    }
  }
}

export const syncService = new GlobalSyncService();
