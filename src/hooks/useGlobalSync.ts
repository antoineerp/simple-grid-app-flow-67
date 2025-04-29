
import { useEffect, useState, useCallback } from 'react';
import { useSyncService, SYNC_CONFIG } from '@/services/core/syncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';

type DataType = 'documents' | 'exigences' | 'membres' | 'bibliotheque';

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
  const syncService = useSyncService();
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();

  // Fonction pour synchroniser un type de données spécifique
  const syncData = useCallback(async (dataType: DataType, data: any[]) => {
    if (!isOnline || !isSyncEnabled) return false;
    
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
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
      return await syncService.queueSync({
        endpoint,
        loadEndpoint,
        data,
        userId,
        dataName
      });
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
  }) => {
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
      
      const results = await Promise.allSettled(promises);
      const allSucceeded = results.every(r => r.status === 'fulfilled' && r.value === true);
      
      if (allSucceeded) {
        setLastGlobalSync(new Date());
      }
      
      return allSucceeded;
    } finally {
      setIsGlobalSyncing(false);
    }
  }, [isOnline, isSyncEnabled, autoSyncTypes, syncData, toast]);

  // Configurer la synchronisation périodique
  useEffect(() => {
    if (isSyncEnabled) {
      // Le hook de synchronisation est utilisé, mais la synchronisation elle-même
      // sera déclenchée par les composants qui ont des données à synchroniser
      console.log(`Configuration de la synchronisation globale toutes les ${syncIntervalSeconds} secondes`);
    }
    
    return () => {
      // Aucun nettoyage nécessaire ici car c'est géré dans useSyncService
    };
  }, [isSyncEnabled, syncIntervalSeconds]);

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
      // Cette fonction serait utilisée pour ajuster l'intervalle de synchronisation
      // Les composants utilisant ce hook adapteraient leurs propres intervalles
      console.log(`Nouvel intervalle de synchronisation: ${seconds} secondes`);
    },
    isOnline
  };
};
