
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncBibliothequeWithServer, loadBibliothequeFromServer } from '@/services/bibliotheque/bibliothequeSync';

export const useBibliothequeSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date>();
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  const syncWithServer = async (documents: Document[], groups: DocumentGroup[], userId: string): Promise<void> => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const success = await syncBibliothequeWithServer(documents, groups, userId);
      if (success) {
        setLastSynced(new Date());
        toast({
          title: "Synchronisation réussie",
          description: "La bibliothèque a été synchronisée avec le serveur",
        });
      } else {
        throw new Error("Échec de la synchronisation");
      }
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Impossible de synchroniser la bibliothèque",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const loadFromServer = async (userId: string) => {
    try {
      return await loadBibliothequeFromServer(userId);
    } catch (error) {
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger la bibliothèque depuis le serveur",
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
