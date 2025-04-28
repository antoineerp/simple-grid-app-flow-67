
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Exigence, ExigenceGroup } from '@/types/exigences';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { loadExigencesFromServer, syncExigencesWithServer } from '@/services/exigences/exigenceSyncService';

export const useExigenceSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  const syncWithServer = async (exigences: Exigence[], userId: any, groups: ExigenceGroup[] = []) => {
    if (!isOnline || isSyncing) return false;
    
    if (syncFailed && syncAttempts >= 3) {
      console.error("Synchronisation bloquée après plusieurs échecs consécutifs");
      return false;
    }
    
    setIsSyncing(true);
    try {
      console.log(`Début de la synchronisation pour ${userId} avec ${exigences.length} exigences et ${groups.length} groupes`);
      
      const success = await syncExigencesWithServer(exigences, userId, groups);
      
      if (success) {
        setLastSynced(new Date());
        setSyncFailed(false);
        setSyncAttempts(0);
        console.log('Synchronisation réussie avec le serveur');
        return true;
      }
      
      console.error('Échec de la synchronisation: réponse négative du serveur');
      setSyncFailed(true);
      setSyncAttempts(prev => prev + 1);
      throw new Error("Échec de la synchronisation");
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      setSyncFailed(true);
      setSyncAttempts(prev => prev + 1);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const loadFromServer = async (userId: any) => {
    try {
      console.log(`Chargement des exigences pour l'utilisateur ${userId} depuis le serveur`);
      
      const data = await loadExigencesFromServer(userId);
      
      console.log(`Données chargées: ${data.exigences.length} exigences, ${data.groups.length} groupes`);
      setSyncFailed(false);
      setLoadError(null);
      setSyncAttempts(0);
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des exigences:", error);
      setSyncFailed(true);
      setLoadError(error instanceof Error ? error.message : "Erreur inconnue");
      setSyncAttempts(prev => prev + 1);
      throw error;
    }
  };
  
  const resetSyncStatus = () => {
    setSyncFailed(false);
    setLoadError(null);
    setSyncAttempts(0);
  };

  return {
    syncWithServer,
    loadFromServer,
    resetSyncStatus,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed,
    syncAttempts,
    loadError
  };
};
