
import { useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useGlobalSync } from '@/hooks/useGlobalSync';

export const useSynchronization = () => {
  const { toast } = useToast();
  const { syncWithServer, isSyncing, isOnline, lastSynced, hasUnsyncedData } = useGlobalSync();

  const handleSync = useCallback(async () => {
    if (isSyncing) return false;
    
    const success = await syncWithServer();
    
    if (success) {
      toast({
        title: "Synchronisation réussie",
        description: "Toutes les données ont été synchronisées avec le serveur",
      });
    } else if (isOnline) {
      toast({
        title: "Échec de la synchronisation",
        description: "La synchronisation avec le serveur a échoué. Veuillez réessayer ultérieurement.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Synchronisation impossible",
        description: "Vous êtes actuellement hors ligne. Veuillez vérifier votre connexion internet.",
        variant: "destructive",
      });
    }
    
    return success;
  }, [syncWithServer, isSyncing, isOnline, toast]);

  return {
    handleSync,
    isSyncing,
    isOnline,
    lastSynced,
    hasUnsyncedData
  };
};
