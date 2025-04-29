
import { useEffect, useState, useCallback } from 'react';
import { useSyncService, SYNC_CONFIG, createSyncEvent } from '@/services/core/syncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';

type DataType = 'documents' | 'exigences' | 'membres' | 'bibliotheque';

interface SyncStatus {
  [key: string]: {
    lastSync: Date | null;
    success: boolean;
    attempts: number;
  };
}

/**
 * Hook pour gérer la synchronisation globale de toutes les données de l'application
 * avec un intervalle de temps configurable
 */
export const useGlobalSync = (options: {
  initialSyncEnabled?: boolean;
  syncIntervalSeconds?: number;
  autoSyncTypes?: DataType[];
}) => {
  const {
    initialSyncEnabled = true,
    syncIntervalSeconds = SYNC_CONFIG.intervalSeconds,
    autoSyncTypes = ['documents', 'exigences', 'membres']
  } = options;
  
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
  const [isSyncEnabled, setSyncEnabled] = useState(initialSyncEnabled);
  const [lastGlobalSync, setLastGlobalSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({});
  const syncService = useSyncService();
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();

  // Écouter les événements de synchronisation
  useEffect(() => {
    const handleSyncEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail) return;
      
      const { success, type, timestamp } = detail;
      
      setSyncStatus(prevStatus => ({
        ...prevStatus,
        [type]: {
          lastSync: timestamp,
          success,
          attempts: success ? 0 : ((prevStatus[type]?.attempts || 0) + 1)
        }
      }));
    };
    
    window.addEventListener('app-sync', handleSyncEvent);
    
    return () => {
      window.removeEventListener('app-sync', handleSyncEvent);
    };
  }, []);

  // Fonction pour synchroniser un type de données spécifique
  const syncData = useCallback(async (dataType: DataType, data: any[] | undefined) => {
    if (!isOnline || !isSyncEnabled) return false;
    if (!data || data.length === 0) {
      console.log(`Pas de données à synchroniser pour ${dataType}`);
      return false;
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.log(`Pas d'utilisateur connecté pour synchroniser ${dataType}`);
      return false;
    }
    
    const userId = typeof currentUser === 'object' ? 
      (currentUser as any).identifiant_technique || 
      (currentUser as any).email || 
      'default_user' : 
      currentUser;
    
    let endpoint = '';
    let loadEndpoint = '';
    let dataName = '';
    
    switch (dataType) {
      case 'documents':
        endpoint = 'documents-sync.php';
        loadEndpoint = 'documents-load.php';
        dataName = 'documents';
        break;
      case 'exigences':
        endpoint = 'exigences-sync.php';
        loadEndpoint = 'exigences-load.php';
        dataName = 'exigences';
        break;
      case 'membres':
        endpoint = 'membres-sync.php';
        loadEndpoint = 'membres-load.php';
        dataName = 'membres';
        break;
      case 'bibliotheque':
        endpoint = 'bibliotheque-sync.php';
        loadEndpoint = 'bibliotheque-load.php';
        dataName = 'ressources';
        break;
    }
    
    try {
      const result = await syncService.queueSync({
        endpoint,
        loadEndpoint,
        data,
        userId,
        dataName
      });
      
      if (result) {
        // Mettre à jour l'état de synchronisation global à la fois après la réussite
        // d'une synchronisation individuelle et après la synchronisation globale
        setLastGlobalSync(new Date());
      }
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${dataType}:`, error);
      return false;
    }
  }, [isOnline, isSyncEnabled, syncService]);

  // Fonction pour synchroniser toutes les données
  const syncAllData = useCallback(async (data: {
    documents?: any[],
    exigences?: any[],
    membres?: any[],
    bibliotheque?: any[]
  } = {}) => {
    if (!isOnline || !isSyncEnabled) {
      if (!isOnline) {
        toast({
          title: "Mode hors ligne",
          description: "La synchronisation sera effectuée lorsque vous serez en ligne",
          variant: "default"
        });
      }
      return false;
    }

    setIsGlobalSyncing(true);
    
    // Créer un événement de début de synchronisation globale
    createSyncEvent(true, 'global-sync-start', { timestamp: new Date() });
    
    try {
      const promises = [];
      
      if (data.documents && autoSyncTypes.includes('documents')) {
        promises.push(syncData('documents', data.documents));
      }
      
      if (data.exigences && autoSyncTypes.includes('exigences')) {
        promises.push(syncData('exigences', data.exigences));
      }
      
      if (data.membres && autoSyncTypes.includes('membres')) {
        promises.push(syncData('membres', data.membres));
      }
      
      if (data.bibliotheque && autoSyncTypes.includes('bibliotheque')) {
        promises.push(syncData('bibliotheque', data.bibliotheque));
      }
      
      if (promises.length === 0) {
        console.log("Aucune donnée à synchroniser");
        return false;
      }
      
      const results = await Promise.allSettled(promises);
      const allSucceeded = results.every(r => r.status === 'fulfilled' && r.value === true);
      
      if (allSucceeded) {
        setLastGlobalSync(new Date());
        createSyncEvent(true, 'global-sync-complete', { 
          timestamp: new Date(),
          results: results.map(r => r.status)
        });
        toast({
          title: "Synchronisation complète",
          description: "Toutes les données ont été synchronisées",
        });
      } else {
        // Si certaines synchronisations ont échoué
        const failedCount = results.filter(r => r.status !== 'fulfilled' || r.value !== true).length;
        createSyncEvent(false, 'global-sync-partial', { 
          timestamp: new Date(),
          results: results.map(r => r.status),
          failedCount
        });
        toast({
          title: "Synchronisation partielle",
          description: `${promises.length - failedCount}/${promises.length} types de données synchronisés`,
          variant: "default"
        });
      }
      
      return allSucceeded;
    } catch (error) {
      console.error("Erreur lors de la synchronisation globale:", error);
      createSyncEvent(false, 'global-sync-error', { 
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    } finally {
      setIsGlobalSyncing(false);
    }
  }, [isOnline, isSyncEnabled, autoSyncTypes, syncData, toast]);

  // Configurer la synchronisation périodique
  useEffect(() => {
    if (!isSyncEnabled) return;
    
    console.log(`Configuration de la synchronisation globale toutes les ${syncIntervalSeconds} secondes`);
    
    const cleanup = syncService.setupPeriodicSync(async () => {
      // Cette fonction sera appelée périodiquement
      // Elle devrait vérifier les données qui doivent être synchronisées
      console.log("Synchronisation périodique déclenchée");
      
      // En réalité, vous devriez récupérer les données actuelles depuis vos stores
      // et les passer à syncAllData
      return Promise.resolve(true);
    }, syncIntervalSeconds);
    
    return cleanup;
  }, [isSyncEnabled, syncIntervalSeconds, syncService]);

  return {
    isGlobalSyncing,
    lastGlobalSync: lastGlobalSync || syncService.globalLastSync,
    syncAllData,
    syncData,
    isSyncEnabled,
    toggleSync: () => setSyncEnabled(prev => !prev),
    setSyncEnabled,
    syncInterval: syncIntervalSeconds,
    setSyncInterval: (seconds: number) => {
      console.log(`Nouvel intervalle de synchronisation: ${seconds} secondes`);
      // Vous devez implémenter la logique pour ajuster l'intervalle ici
    },
    isOnline,
    syncStatus
  };
};
