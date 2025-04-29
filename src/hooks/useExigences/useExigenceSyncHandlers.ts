
import { useCallback, useEffect } from 'react';
import { Exigence, ExigenceGroup } from '@/types/exigences';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useToast } from '@/hooks/use-toast';

export const useExigenceSyncHandlers = (
  exigences: Exigence[],
  groups: ExigenceGroup[],
  userId: string,
  syncWithServer: (exigences: Exigence[], userId: string, groups?: ExigenceGroup[]) => Promise<boolean>,
  loadFromServer: (userId: string) => Promise<any>,
  setExigences: React.Dispatch<React.SetStateAction<Exigence[]>>,
  setGroups: React.Dispatch<React.SetStateAction<ExigenceGroup[]>>,
  setLastSyncedDate: React.Dispatch<React.SetStateAction<Date | null>>,
  isSyncing: boolean,
  syncFailed: boolean,
  resetSyncStatus: () => void
) => {
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();

  // Fonction harmonisée pour la synchronisation
  const handleSyncWithServer = useCallback(async () => {
    if (!isOnline || isSyncing) return false;
    
    try {
      const success = await syncWithServer(exigences, userId, groups);
      if (success) {
        setLastSyncedDate(new Date());
        // Charger les dernières données après une synchronisation réussie
        try {
          const result = await loadFromServer(userId);
          if (result && Array.isArray(result.exigences)) {
            setExigences(result.exigences);
            if (Array.isArray(result.groups)) {
              setGroups(result.groups);
            }
          }
        } catch (loadError) {
          console.error("Erreur lors du rechargement après synchronisation:", loadError);
        }
        return true;
      } 
      return false;
    } catch (error) {
      console.error("Erreur de synchronisation:", error);
      return false;
    }
  }, [exigences, userId, groups, syncWithServer, loadFromServer, isOnline, isSyncing, setExigences, setGroups, setLastSyncedDate]);

  // Chargement initial et synchronisation périodique
  useEffect(() => {
    const loadExigences = async () => {
      try {
        console.log(`Chargement des exigences pour l'utilisateur: ${userId}`);
        const result = await loadFromServer(userId);
        if (result && Array.isArray(result.exigences)) {
          setExigences(result.exigences);
          if (Array.isArray(result.groups)) {
            setGroups(result.groups);
          }
        } else {
          console.error("Format de résultat inattendu:", result);
          setExigences([]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des exigences:", error);
        setExigences([]);
      }
    };

    if (isOnline) {
      loadExigences();
    }

    // Synchronisation périodique moins fréquente (toutes les 60 secondes)
    const syncInterval = setInterval(() => {
      if (isOnline && !syncFailed && !isSyncing) {
        handleSyncWithServer().catch(error => 
          console.error("Erreur lors de la synchronisation périodique:", error)
        );
      }
    }, 60000);

    return () => clearInterval(syncInterval);
  }, [loadFromServer, userId, isOnline, syncFailed, isSyncing, handleSyncWithServer, setExigences, setGroups]);

  // Réinitialisation de la synchronisation
  const handleResetLoadAttempts = useCallback(() => {
    resetSyncStatus();
    handleSyncWithServer().catch(error => {
      console.error("Erreur lors de la réinitialisation de la synchronisation:", error);
    });
  }, [resetSyncStatus, handleSyncWithServer]);

  return {
    handleSyncWithServer,
    handleResetLoadAttempts
  };
};
