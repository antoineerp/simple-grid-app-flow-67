
/**
 * Service pour déclencher la synchronisation des données
 * Ce service permet d'assurer que les modifications sont bien synchronisées avec le serveur
 * même si l'utilisateur quitte la page ou change d'appareil
 */

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { safeLocalStorageSet, safeLocalStorageGet } from '@/utils/syncStorageCleaner';
import { getCurrentUser, getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

// Structure pour stocker les données en attente de synchronisation
interface PendingSyncData {
  tableName: string;
  data: any[];
  timestamp: string;
  userId?: string;
}

// Résultat d'une opération de synchronisation
interface SyncResult {
  success: boolean;
  message: string;
  timestamp?: string;
}

// Interface de la classe TriggerSyncService pour TypeScript
interface ITriggerSyncService {
  notifyDataChange: <T>(tableName: string, data: T[], userId?: string) => void;
  triggerTableSync: <T>(tableName: string, data: T[], trigger?: string) => Promise<SyncResult>;
  hasPendingSyncs: () => boolean;
  getPendingSyncsCount: () => number;
  initialize: () => void;
  cleanup: () => void;
}

// Clé utilisée pour stocker les données en attente dans le localStorage
const PENDING_SYNC_KEY = 'sync_pending_changes';

/**
 * Singleton pour gérer les déclenchements de synchronisation
 */
class TriggerSyncService implements ITriggerSyncService {
  private pendingSyncs: Map<string, PendingSyncData> = new Map();
  private initialized: boolean = false;
  
  constructor() {
    this.initialize();
  }
  
  /**
   * Initialiser le service et charger les synchronisations en attente
   */
  initialize() {
    if (this.initialized || typeof window === 'undefined') return;
    
    try {
      // Obtenir l'utilisateur actuel pour garantir l'isolation des données
      const currentUser = getDatabaseConnectionCurrentUser() || 'default';
      console.log(`TriggerSync: Initialisation pour l'utilisateur ${currentUser}`);
      
      // Charger les synchronisations en attente depuis le localStorage spécifique à l'utilisateur
      const pendingSyncsString = safeLocalStorageGet<string>(`${PENDING_SYNC_KEY}_${currentUser}`, '{}');
      if (pendingSyncsString) {
        const pendingSyncsData = JSON.parse(pendingSyncsString);
        
        // Reconstruire la Map avec les données chargées
        Object.entries(pendingSyncsData).forEach(([key, value]) => {
          this.pendingSyncs.set(key, value as PendingSyncData);
        });
        
        console.log(`TriggerSync: ${this.pendingSyncs.size} synchronisations en attente chargées pour l'utilisateur ${currentUser}`);
      }
      
      // Configurer l'écouteur d'événement pour la connexion réseau
      window.addEventListener('online', this.handleOnline);
      
      // Configurer l'écouteur d'événement pour la synchronisation
      window.addEventListener('force-sync-required', this.processAllPendingSyncs);
      
      // Configurer l'écouteur pour la fermeture de la page
      window.addEventListener('beforeunload', this.savePendingSyncs);
      
      // Écouter les changements d'utilisateur pour recharger les données spécifiques
      window.addEventListener('user-changed', this.handleUserChanged);
      
      this.initialized = true;
      console.log('TriggerSync: Service initialisé');
      
      // Traiter les synchronisations en attente si en ligne
      if (navigator.onLine) {
        setTimeout(() => this.processAllPendingSyncs(), 5000);
      }
    } catch (error) {
      console.error('TriggerSync: Erreur lors de l\'initialisation', error);
    }
  }
  
  /**
   * Nettoyer les écouteurs d'événements
   */
  cleanup() {
    if (typeof window === 'undefined') return;
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('force-sync-required', this.processAllPendingSyncs);
    window.removeEventListener('beforeunload', this.savePendingSyncs);
    window.removeEventListener('user-changed', this.handleUserChanged);
  }
  
  /**
   * Gérer l'événement de changement d'utilisateur
   */
  private handleUserChanged = (event: CustomEvent) => {
    // Sauvegarder d'abord les modifications en attente de l'utilisateur précédent
    this.savePendingSyncs();
    
    // Vider la map actuelle
    this.pendingSyncs.clear();
    
    // Charger les synchronisations en attente du nouvel utilisateur
    try {
      const newUserId = event.detail?.userId || 'default';
      console.log(`TriggerSync: Changement d'utilisateur détecté - ${newUserId}`);
      
      // Charger les synchronisations en attente du nouvel utilisateur
      const pendingSyncsString = safeLocalStorageGet<string>(`${PENDING_SYNC_KEY}_${newUserId}`, '{}');
      if (pendingSyncsString) {
        const pendingSyncsData = JSON.parse(pendingSyncsString);
        
        // Reconstruire la Map avec les données chargées
        Object.entries(pendingSyncsData).forEach(([key, value]) => {
          this.pendingSyncs.set(key, value as PendingSyncData);
        });
        
        console.log(`TriggerSync: ${this.pendingSyncs.size} synchronisations en attente chargées pour l'utilisateur ${newUserId}`);
      }
      
      // Traiter les synchronisations en attente si en ligne
      if (navigator.onLine && this.pendingSyncs.size > 0) {
        setTimeout(() => this.processAllPendingSyncs(), 2000);
      }
    } catch (error) {
      console.error('TriggerSync: Erreur lors du changement d\'utilisateur', error);
    }
  };
  
  /**
   * Gérer l'événement de retour en ligne
   */
  private handleOnline = () => {
    console.log('TriggerSync: Connexion rétablie, traitement des synchronisations en attente');
    this.processAllPendingSyncs();
  };
  
  /**
   * Sauvegarder les synchronisations en attente dans le localStorage
   */
  private savePendingSyncs = () => {
    if (this.pendingSyncs.size > 0) {
      try {
        // Obtenir l'utilisateur actuel pour l'isolation des données
        const currentUser = getDatabaseConnectionCurrentUser() || 'default';
        const pendingSyncsData: Record<string, PendingSyncData> = {};
        
        this.pendingSyncs.forEach((value, key) => {
          pendingSyncsData[key] = value;
        });
        
        // Utiliser une clé spécifique à l'utilisateur
        safeLocalStorageSet(`${PENDING_SYNC_KEY}_${currentUser}`, JSON.stringify(pendingSyncsData));
        console.log(`TriggerSync: ${this.pendingSyncs.size} synchronisations sauvegardées pour l'utilisateur ${currentUser}`);
        
        // Déclencher un événement pour informer l'application
        window.dispatchEvent(new CustomEvent('sync-pending-saved', {
          detail: { count: this.pendingSyncs.size, userId: currentUser }
        }));
      } catch (error) {
        console.error('TriggerSync: Erreur lors de la sauvegarde des synchronisations en attente', error);
      }
    }
  };
  
  /**
   * Notifier qu'une table a été modifiée et doit être synchronisée
   */
  notifyDataChange = <T>(tableName: string, data: T[], userId?: string) => {
    if (!tableName || !data) {
      console.warn(`TriggerSync: Impossible de notifier un changement sans nom de table ou données`);
      return;
    }
    
    // Utiliser l'ID de l'utilisateur actuel si non spécifié
    const currentUser = userId || getDatabaseConnectionCurrentUser() || 'default';
    const syncKey = `${tableName}_${currentUser}`;
    
    // Enregistrer les données à synchroniser
    this.pendingSyncs.set(syncKey, {
      tableName,
      data,
      timestamp: new Date().toISOString(),
      userId: currentUser
    });
    
    console.log(`TriggerSync: Changement enregistré pour ${tableName} (utilisateur: ${currentUser})`);
    
    // Sauvegarder immédiatement dans localStorage avec une clé spécifique à l'utilisateur
    this.savePendingSyncs();
    
    // Déclencher un événement pour informer l'application
    window.dispatchEvent(new CustomEvent('sync-data-changed', {
      detail: { tableName, timestamp: new Date().toISOString(), userId: currentUser }
    }));
    
    // Si en ligne, programmer une synchronisation
    if (navigator.onLine) {
      setTimeout(() => this.processPendingSync(syncKey), 5000);
    }
  };
  
  /**
   * Déclencher la synchronisation d'une table spécifique avec le serveur
   * Méthode utilisée par GlobalSyncContext
   */
  triggerTableSync = async <T>(
    tableName: string,
    data: T[],
    trigger: string = "auto"
  ): Promise<SyncResult> => {
    try {
      if (!tableName || !Array.isArray(data)) {
        console.error(`TriggerSync: Paramètres invalides pour triggerTableSync`);
        return {
          success: false,
          message: `Paramètres invalides pour la synchronisation`
        };
      }
      
      // Obtenir l'ID utilisateur actuel pour l'isolation des données
      const currentUser = getDatabaseConnectionCurrentUser() || 'default';
      console.log(`TriggerSync: Synchronisation de la table ${tableName} déclenchée pour l'utilisateur ${currentUser} (${data.length} éléments)`);
      
      // Si hors ligne, stocker dans la file d'attente et retourner un succès partiel
      if (!navigator.onLine) {
        console.log(`TriggerSync: Mode hors ligne, données stockées pour synchronisation ultérieure`);
        
        // Stocker les données pour synchronisation ultérieure
        const syncKey = `${tableName}_${currentUser}`;
        
        this.pendingSyncs.set(syncKey, {
          tableName,
          data,
          timestamp: new Date().toISOString(),
          userId: currentUser
        });
        
        this.savePendingSyncs();
        
        return {
          success: true,
          message: `Données sauvegardées localement pour synchronisation ultérieure`,
          timestamp: new Date().toISOString()
        };
      }
      
      // En ligne, déclencher la synchronisation via un événement
      window.dispatchEvent(new CustomEvent('force-sync-required', {
        detail: {
          tables: [tableName],
          data: data,
          trigger: trigger,
          userId: currentUser,
          timestamp: new Date().toISOString()
        }
      }));
      
      return {
        success: true,
        message: `Synchronisation déclenchée pour ${tableName}`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`TriggerSync: Erreur lors de triggerTableSync pour ${tableName}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  };
  
  /**
   * Traiter une synchronisation en attente spécifique
   */
  private processPendingSync = async (syncKey: string): Promise<boolean> => {
    if (!navigator.onLine) {
      console.log(`TriggerSync: Hors ligne, impossible de synchroniser ${syncKey}`);
      return false;
    }
    
    const pendingSync = this.pendingSyncs.get(syncKey);
    if (!pendingSync) {
      console.log(`TriggerSync: Aucune synchronisation en attente pour ${syncKey}`);
      return true;
    }
    
    try {
      console.log(`TriggerSync: Traitement de la synchronisation pour ${syncKey}`);
      
      // Émettre un événement pour demander la synchronisation avec l'utilisateur spécifique
      window.dispatchEvent(new CustomEvent('force-sync-required', {
        detail: {
          tableName: pendingSync.tableName,
          data: pendingSync.data,
          userId: pendingSync.userId
        }
      }));
      
      // Supprimer la synchronisation en attente
      this.pendingSyncs.delete(syncKey);
      
      // Mettre à jour le stockage
      this.savePendingSyncs();
      
      return true;
    } catch (error) {
      console.error(`TriggerSync: Erreur lors de la synchronisation de ${syncKey}`, error);
      return false;
    }
  };
  
  /**
   * Traiter toutes les synchronisations en attente
   */
  processAllPendingSyncs = async () => {
    if (!navigator.onLine || this.pendingSyncs.size === 0) {
      return;
    }
    
    // Obtenir l'utilisateur actuel pour l'isolation des données
    const currentUser = getDatabaseConnectionCurrentUser() || 'default';
    console.log(`TriggerSync: Traitement de ${this.pendingSyncs.size} synchronisations en attente pour l'utilisateur ${currentUser}`);
    
    // Préparer un tableau de toutes les clés pour éviter les problèmes de modification pendant l'itération
    const syncKeys = Array.from(this.pendingSyncs.keys());
    
    // Traiter séquentiellement pour éviter les problèmes
    for (const syncKey of syncKeys) {
      // Vérifier que la clé correspond bien à l'utilisateur actuel
      if (syncKey.includes(currentUser)) {
        await this.processPendingSync(syncKey);
        
        // Petite pause entre les synchronisations
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`TriggerSync: Ignorer ${syncKey} car il appartient à un autre utilisateur`);
      }
    }
    
    console.log('TriggerSync: Toutes les synchronisations en attente ont été traitées');
  };
  
  /**
   * Vérifier s'il y a des synchronisations en attente
   */
  hasPendingSyncs(): boolean {
    return this.pendingSyncs.size > 0;
  }
  
  /**
   * Obtenir le nombre de synchronisations en attente
   */
  getPendingSyncsCount(): number {
    return this.pendingSyncs.size;
  }
}

// Exporter l'instance unique
export const triggerSync = new TriggerSyncService();

// Initialiser automatiquement
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!triggerSync.hasPendingSyncs()) {
      triggerSync.initialize();
    }
  }, 1000);
}

// Exposer pour les tests
export const resetForTests = () => {
  if (process.env.NODE_ENV === 'test') {
    triggerSync.cleanup();
  }
};
