
import { useState, useCallback } from 'react';
import { Exigence, ExigenceGroup } from '@/types/exigences';
import { loadExigencesFromServer, syncExigencesWithServer } from '@/services/exigences/exigenceSyncService';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';

export const useExigenceSync = () => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();

  // Load exigences from server
  const loadFromServer = useCallback(async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast({
        title: "Erreur de chargement",
        description: "Vous devez être connecté pour charger vos exigences",
        variant: "destructive"
      });
      return null;
    }

    const userId = typeof currentUser === 'object' ? 
      (currentUser.identifiant_technique || '') : currentUser;
    
    if (!userId) {
      toast({
        title: "Erreur de chargement",
        description: "Identifiant utilisateur invalide",
        variant: "destructive"
      });
      return null;
    }

    try {
      const loadedData = await loadExigencesFromServer(userId);
      if (loadedData && loadedData.exigences) {
        toast({
          title: "Exigences chargées",
          description: `${loadedData.exigences.length} exigences chargées depuis le serveur`,
        });
        setLastSynced(new Date());
        return loadedData;
      }
      return null;
    } catch (error) {
      console.error("Erreur lors du chargement des exigences:", error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger vos exigences depuis le serveur",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  // Sync exigences with server
  const syncWithServer = useCallback(async (exigences: Exigence[], groups: ExigenceGroup[]) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast({
        title: "Erreur de synchronisation",
        description: "Vous devez être connecté pour synchroniser vos exigences",
        variant: "destructive"
      });
      return false;
    }

    const userId = typeof currentUser === 'object' ? 
      (currentUser.identifiant_technique || '') : currentUser;
    
    if (!userId) {
      toast({
        title: "Erreur de synchronisation",
        description: "Identifiant utilisateur invalide",
        variant: "destructive"
      });
      return false;
    }

    setIsSyncing(true);
    try {
      const success = await syncExigencesWithServer(exigences, userId, groups);
      if (success) {
        setLastSynced(new Date());
        toast({
          title: "Synchronisation réussie",
          description: "Vos exigences ont été enregistrées sur le serveur",
        });
        return true;
      } else {
        throw new Error("La synchronisation a échoué");
      }
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
  }, [toast]);

  return {
    isSyncing,
    lastSynced,
    loadFromServer,
    syncWithServer
  };
};
