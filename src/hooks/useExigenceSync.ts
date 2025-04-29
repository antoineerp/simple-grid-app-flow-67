
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Exigence, ExigenceGroup } from '@/types/exigences';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSyncService } from '@/services/core/syncService';

export const useExigenceSync = () => {
  const syncService = useSyncService();
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const [syncAttempts, setSyncAttempts] = useState(0);
  
  const syncWithServer = async (exigences: Exigence[], userId: string | object, groups: ExigenceGroup[] = []) => {
    if (!isOnline || syncService.isSyncing) return false;
    
    if (syncService.syncFailed && syncAttempts >= 3) {
      console.error("Synchronisation bloquée après plusieurs échecs consécutifs");
      return false;
    }
    
    try {
      console.log(`Début de la synchronisation pour ${userId} avec ${exigences.length} exigences et ${groups.length} groupes`);
      
      // Adaptation pour utiliser additionalData
      const success = await syncService.syncWithServer({
        endpoint: 'exigences-sync.php',
        loadEndpoint: 'exigences-load.php',
        data: exigences,
        userId: userId,
        additionalData: { groups } // Utilisation correcte de additionalData
      });
      
      if (success) {
        setSyncAttempts(0);
        console.log('Synchronisation réussie avec le serveur');
        return true;
      }
      
      console.error('Échec de la synchronisation: réponse négative du serveur');
      setSyncAttempts(prev => prev + 1);
      throw new Error("Échec de la synchronisation");
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      setSyncAttempts(prev => prev + 1);
      return false;
    }
  };

  const loadFromServer = async (userId: string | object) => {
    try {
      console.log(`Chargement des exigences pour l'utilisateur ${userId} depuis le serveur`);
      
      const exigences = await syncService.loadFromServer<Exigence>({
        endpoint: 'exigences-sync.php',
        loadEndpoint: 'exigences-load.php',
        userId: userId
      });
      
      // Dans le cas des exigences, le serveur renvoie un objet avec les exigences et les groupes
      // On doit donc transformer la réponse pour l'adapter à notre format
      const data = {
        exigences: Array.isArray(exigences) ? exigences : [],
        groups: []
      };
      
      console.log(`Données chargées: ${data.exigences.length} exigences, ${data.groups.length} groupes`);
      setSyncAttempts(0);
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des exigences:", error);
      setSyncAttempts(prev => prev + 1);
      throw error;
    }
  };
  
  const resetSyncStatus = () => {
    setSyncAttempts(0);
    syncService.resetSyncStatus();
  };

  return {
    syncWithServer,
    loadFromServer,
    resetSyncStatus,
    isSyncing: syncService.isSyncing,
    isOnline,
    lastSynced: syncService.lastSynced,
    syncFailed: syncService.syncFailed,
    syncAttempts,
    loadError: syncService.loadError
  };
};
