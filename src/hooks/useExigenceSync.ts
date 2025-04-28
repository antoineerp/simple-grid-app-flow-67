
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Exigence } from '@/types/exigences';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncExigencesWithServer, loadExigencesFromServer } from '@/services/exigences/exigenceSyncService';

export const useExigenceSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date>();
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  const syncWithServer = async (exigences: Exigence[], userId: string) => {
    if (!isOnline || isSyncing) return false;
    
    setIsSyncing(true);
    try {
      const success = await syncExigencesWithServer(exigences, userId);
      if (success) {
        setLastSynced(new Date());
        toast({
          title: "Synchronisation réussie",
          description: "Vos exigences ont été synchronisées avec le serveur",
        });
        return true;
      }
      throw new Error("Échec de la synchronisation");
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Impossible de synchroniser vos exigences",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const loadFromServer = async (userId: string) => {
    try {
      return await loadExigencesFromServer(userId);
    } catch (error) {
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les exigences depuis le serveur",
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    syncWithServer,
    loadFromServer,
    isSyncing,
    isOnline,
    lastSynced
  };
};
