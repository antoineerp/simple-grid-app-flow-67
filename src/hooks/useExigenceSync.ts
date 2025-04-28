
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Exigence, ExigenceGroup } from '@/types/exigences';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

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
    
    // Si on a déjà eu trop d'échecs consécutifs, bloquer la synchronisation
    if (syncFailed && syncAttempts >= 3) {
      toast({
        title: "Synchronisation bloquée",
        description: "La synchronisation a échoué plusieurs fois. Cliquez sur 'Réinitialiser' pour réessayer.",
        variant: "destructive",
      });
      return false;
    }
    
    setIsSyncing(true);
    try {
      console.log(`Début de la synchronisation pour ${userId} avec ${exigences.length} exigences et ${groups.length} groupes`);
      
      // Ajout de logs pour aider au debug
      console.log('Données envoyées au serveur:', { userId, exigencesCount: exigences.length, groupsCount: groups.length });
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const success = true; // Simulating success
      
      if (success) {
        setLastSynced(new Date());
        setSyncFailed(false);
        setSyncAttempts(0);
        toast({
          title: "Synchronisation réussie",
          description: "Vos exigences ont été synchronisées avec le serveur",
        });
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

  const loadFromServer = async (userId: any) => {
    try {
      console.log(`Chargement des exigences pour l'utilisateur ${userId} depuis le serveur`);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data
      const data = {
        exigences: [] as Exigence[],
        groups: [] as ExigenceGroup[]
      };
      
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
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les exigences depuis le serveur",
        variant: "destructive"
      });
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
