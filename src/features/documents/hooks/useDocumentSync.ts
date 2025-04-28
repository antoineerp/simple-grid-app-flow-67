
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/types/documents';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncDocumentsWithServer, loadDocumentsFromServer } from '@/services/documents/documentSyncService';

export const useDocumentSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date>();
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  const syncWithServer = async (documents: Document[], userId: string) => {
    if (!isOnline || isSyncing) return false;
    
    setIsSyncing(true);
    try {
      const success = await syncDocumentsWithServer(documents, userId);
      if (success) {
        setLastSynced(new Date());
        toast({
          title: "Synchronisation réussie",
          description: "Vos documents ont été synchronisés avec le serveur",
        });
        return true;
      }
      throw new Error("Échec de la synchronisation");
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Impossible de synchroniser vos documents",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const loadFromServer = async (userId: string) => {
    try {
      return await loadDocumentsFromServer(userId);
    } catch (error) {
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les documents depuis le serveur",
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
