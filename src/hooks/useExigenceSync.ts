
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Exigence, ExigenceGroup } from '@/types/exigences';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncExigencesWithServer, loadExigencesFromServer } from '@/services/exigences/exigenceSyncService';

export const useExigenceSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  const syncWithServer = async (exigences: Exigence[], userId: string, groups: ExigenceGroup[] = []) => {
    if (!isOnline || isSyncing) return false;
    
    setIsSyncing(true);
    try {
      console.log(`Début de la synchronisation pour ${userId} avec ${exigences.length} exigences et ${groups.length} groupes`);
      const success = await syncExigencesWithServer(exigences, userId, groups);
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
      console.error("Erreur lors de la synchronisation:", error);
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
      console.log(`Chargement des exigences pour l'utilisateur ${userId} depuis le serveur`);
      const data = await loadExigencesFromServer(userId);
      console.log(`Données chargées: ${data.exigences.length} exigences, ${data.groups.length} groupes`);
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des exigences:", error);
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
