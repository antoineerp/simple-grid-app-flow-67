/**
 * Service central de synchronisation
 * Ce service gère la synchronisation des données entre le client et le serveur
 */

import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';
import { syncRegistry } from './SyncRegistry';
import { saveLocalData, loadLocalData, markPendingSync, clearPendingSync } from '@/features/sync/utils/syncStorageManager';

export class SyncService {
  /**
   * Charge les données depuis le serveur
   * @param tableName Nom de la table à charger
   * @param userId ID de l'utilisateur (optionnel)
   */
  async loadDataFromServer<T extends object>(
    tableName: string, 
    userId?: string | null
  ): Promise<T[]> {
    // Normaliser le nom de la table
    const normalizedTableName = syncRegistry.normalizeTableName(tableName);
    const tableConfig = syncRegistry.getTable(normalizedTableName);
    
    if (!tableConfig) {
      console.warn(`Table non reconnue: ${tableName}`);
    }
    
    // Vérifier si la table est suivie
    if (tableConfig && !tableConfig.tracked) {
      console.log(`La table ${normalizedTableName} n'est pas suivie, chargement local uniquement`);
      return this.getLocalData<T>(normalizedTableName, userId);
    }
    
    try {
      // Construire l'URL
      const API_URL = getApiUrl();
      const endpoint = `${API_URL}/${normalizedTableName}-load.php`;
      
      console.log(`Tentative de chargement depuis: ${endpoint}`);
      
      // Effectuer la requête
      const response = await fetch(`${endpoint}?userId=${userId || ''}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`Données chargées pour ${normalizedTableName}:`, result);
      
      // Extraire les données
      let serverData: T[] = [];
      
      if (result.success && Array.isArray(result.documents || result.records || result.data)) {
        serverData = result.documents || result.records || result.data;
      } else if (Array.isArray(result)) {
        serverData = result;
      } else {
        console.warn(`Format de réponse non reconnu pour ${normalizedTableName}`);
        throw new Error("Format de réponse non reconnu");
      }
      
      // Fusionner avec les données locales si nécessaire
      const localData = this.getLocalData<T>(normalizedTableName, userId);
      const mergedData = this.mergeData<T>(localData, serverData);
      
      // Sauvegarder localement pour accès hors ligne
      saveLocalData(normalizedTableName, mergedData, userId || undefined);
      
      // Enregistrer la date de synchronisation
      this.setLastSynced(normalizedTableName);
      
      return mergedData;
    } catch (error) {
      console.error(`Erreur lors du chargement des données de ${normalizedTableName}:`, error);
      
      // Utiliser les données locales en cas d'erreur
      const localData = this.getLocalData<T>(normalizedTableName, userId);
      
      // Afficher une notification seulement si l'erreur n'est pas due à une table non reconnue
      if (!(error instanceof Error && error.message.includes("non reconnu"))) {
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: `Impossible de charger les données depuis le serveur. Mode hors-ligne activé.`,
        });
      }
      
      return localData;
    }
  }

  /**
   * Synchronise les données avec le serveur
   * @param tableName Nom de la table à synchroniser
   * @param data Données à synchroniser
   * @param userId ID de l'utilisateur (optionnel)
   */
  async syncDataWithServer<T extends object>(
    tableName: string, 
    data: T[], 
    userId?: string | null
  ): Promise<boolean> {
    // Normaliser le nom de la table
    const normalizedTableName = syncRegistry.normalizeTableName(tableName);
    const tableConfig = syncRegistry.getTable(normalizedTableName);
    
    if (!tableConfig) {
      console.warn(`Table non reconnue: ${tableName}`);
    }
    
    // Vérifier si la table est suivie
    if (tableConfig && !tableConfig.tracked) {
      console.log(`La table ${normalizedTableName} n'est pas suivie, sauvegarde locale uniquement`);
      saveLocalData(normalizedTableName, data, userId || undefined);
      return true;
    }
    
    // Sauvegarder localement d'abord pour éviter les pertes de données
    saveLocalData(normalizedTableName, data, userId || undefined);
    
    // Marquer comme en attente de synchronisation
    markPendingSync(normalizedTableName);
    
    try {
      // Construire l'URL
      const API_URL = getApiUrl();
      const endpoint = `${API_URL}/${normalizedTableName}-sync.php`;
      
      console.log(`Tentative de synchronisation vers: ${endpoint}`);
      
      // Effectuer la requête
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId || '',
          [normalizedTableName]: data  // La clé correspond au nom de la table
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur HTTP ${response.status}: ${errorText}`);
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`Résultat de la synchronisation de ${normalizedTableName}:`, result);
      
      if (result.success === true) {
        // Enregistrer la date de synchronisation
        this.setLastSynced(normalizedTableName);
        
        // Supprimer le marqueur de synchronisation en attente
        clearPendingSync(normalizedTableName);
        
        return true;
      } else {
        throw new Error(`La synchronisation a échoué: ${result.message || "Raison inconnue"}`);
      }
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${normalizedTableName}:`, error);
      
      // Marquer comme en attente de synchronisation pour une nouvelle tentative ultérieure
      markPendingSync(normalizedTableName);
      
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: `Les données ont été sauvegardées localement, mais la synchronisation avec le serveur a échoué.`,
      });
      
      return false;
    }
  }

  /**
   * Récupère les données locales
   * @param tableName Nom de la table
   * @param userId ID de l'utilisateur (optionnel)
   */
  getLocalData<T extends object>(tableName: string, userId?: string | null): T[] {
    // Normaliser le nom de la table
    const normalizedTableName = syncRegistry.normalizeTableName(tableName);
    
    // Utiliser le système de stockage centralisé
    return loadLocalData<T>(normalizedTableName, userId || undefined);
  }

  /**
   * Vérifie si des données locales existent
   * @param tableName Nom de la table
   * @param userId ID de l'utilisateur (optionnel)
   */
  hasLocalData(tableName: string, userId?: string | null): boolean {
    // Normaliser le nom de la table
    const normalizedTableName = syncRegistry.normalizeTableName(tableName);
    
    // Vérifier les données dans les deux systèmes de stockage
    const data = this.getLocalData(normalizedTableName, userId);
    return data.length > 0;
  }

  /**
   * Enregistre la date de la dernière synchronisation
   * @param tableName Nom de la table
   */
  setLastSynced(tableName: string): void {
    // Normaliser le nom de la table
    const normalizedTableName = syncRegistry.normalizeTableName(tableName);
    
    // Enregistrer la date
    const timestamp = new Date().toISOString();
    localStorage.setItem(`last_synced_${normalizedTableName}`, timestamp);
    sessionStorage.setItem(`last_synced_${normalizedTableName}`, timestamp);
  }

  /**
   * Récupère la date de la dernière synchronisation
   * @param tableName Nom de la table
   */
  getLastSynced(tableName: string): Date | null {
    const lastSyncStr = localStorage.getItem(`last_synced_${tableName}`);
    return lastSyncStr ? new Date(lastSyncStr) : null;
  }

  /**
   * Fusionne les données locales et serveur
   * @param localData Données locales
   * @param serverData Données serveur
   */
  private mergeData<T extends object>(localData: T[], serverData: T[]): T[] {
    if (!localData || localData.length === 0) return serverData;
    if (!serverData || serverData.length === 0) return localData;
    
    // Vérifier si les données ont un ID
    const hasId = localData[0] && 'id' in localData[0];
    
    if (!hasId) {
      // Si pas d'ID, on considère que les données serveur sont les plus à jour
      return serverData;
    }
    
    // Créer une map des données locales pour accès rapide
    const localDataMap = new Map<string, T>();
    localData.forEach(item => {
      if ('id' in item) {
        localDataMap.set((item as any).id, item);
      }
    });
    
    // Fusionner les données
    const mergedData: T[] = [];
    
    // Traiter les données du serveur
    serverData.forEach(serverItem => {
      if ('id' in serverItem) {
        const localItem = localDataMap.get((serverItem as any).id);
        
        // Si l'élément existe localement
        if (localItem) {
          // Comparer les dates de modification si disponibles
          const hasDateMod = 'date_modification' in serverItem && 'date_modification' in localItem;
          
          if (hasDateMod) {
            const serverModDate = new Date((serverItem as any).date_modification);
            const localModDate = new Date((localItem as any).date_modification);
            
            // Privilégier la version la plus récente
            if (localModDate > serverModDate) {
              mergedData.push(localItem);
              console.log(`Élément ${(localItem as any).id}: version locale plus récente conservée`);
            } else {
              mergedData.push(serverItem);
              console.log(`Élément ${(serverItem as any).id}: version serveur plus récente conservée`);
            }
          } else {
            // Sans date de modification, privilégier le serveur
            mergedData.push(serverItem);
          }
          
          // Retirer de la map pour traiter les éléments uniquement locaux ensuite
          localDataMap.delete((serverItem as any).id);
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
      console.log(`Élément ${(item as any).id}: uniquement local, ajouté à la fusion`);
    });
    
    return mergedData;
  }

  /**
   * Force une synchronisation complète depuis le serveur
   * @param tableName Nom de la table
   * @param userId ID de l'utilisateur (optionnel)
   */
  async forceFullSync<T extends object>(tableName: string, userId?: string | null): Promise<boolean> {
    try {
      // Normaliser le nom de la table
      const normalizedTableName = syncRegistry.normalizeTableName(tableName);
      
      console.log(`Forçage d'une synchronisation complète pour ${normalizedTableName}`);
      
      // Charger les données actuelles du serveur
      const data = await this.loadDataFromServer<T>(normalizedTableName, userId);
      
      // Sauvegarder localement
      saveLocalData(normalizedTableName, data, userId || undefined);
      
      // Supprimer le marqueur de synchronisation en attente
      clearPendingSync(normalizedTableName);
      
      // Enregistrer la date de synchronisation
      this.setLastSynced(normalizedTableName);
      
      toast({
        title: "Synchronisation forcée réussie",
        description: `${data.length} éléments chargés depuis la base de données.`,
      });
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la synchronisation forcée de ${tableName}:`, error);
      
      toast({
        variant: "destructive",
        title: "Échec de la synchronisation forcée",
        description: "Impossible de forcer la synchronisation avec la base de données.",
      });
      
      return false;
    }
  }
}

// Exporter une instance unique du service
export const syncService = new SyncService();
export default syncService;
