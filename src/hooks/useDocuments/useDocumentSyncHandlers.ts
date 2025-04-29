
import { useCallback } from 'react';
import { Document } from '@/types/documents';
import { useToast } from '@/hooks/use-toast';
import { useGlobalSync } from '@/hooks/useGlobalSync';
import { useSyncService } from '@/services/core/syncService';

type UseDocumentSyncHandlersProps = {
  documents: Document[];
  userId: string | null;
  isOnline: boolean;
  isSyncing: boolean;
  setCoreSyncFailed: React.Dispatch<React.SetStateAction<boolean>>;
  setCoreLastSynced: React.Dispatch<React.SetStateAction<Date | null>>;
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
};

export const useDocumentSyncHandlers = ({
  documents,
  userId,
  isOnline,
  isSyncing,
  setCoreSyncFailed,
  setCoreLastSynced,
  setDocuments
}: UseDocumentSyncHandlersProps) => {
  const { toast } = useToast();
  const syncService = useSyncService();
  const globalSync = useGlobalSync({
    autoSyncTypes: ['documents']
  });

  // Function to synchronize with server
  const handleSyncWithServer = useCallback(async () => {
    if (!isOnline || isSyncing) return false;
    if (!userId) {
      console.log("Impossible de synchroniser: pas d'identifiant utilisateur");
      return false;
    }
    if (documents.length === 0) {
      console.log("Pas de documents à synchroniser");
      return false;
    }
    
    try {
      console.log("Tentative de synchronisation des documents avec le serveur...");
      
      // Use the global service to synchronize
      const success = await globalSync.syncData('documents', documents);
      
      if (success) {
        setCoreSyncFailed(false);
        setCoreLastSynced(new Date());
        
        // Quietly load data after successful synchronization
        try {
          const result = await syncService.loadFromServer<Document>({
            endpoint: 'documents-sync.php',
            loadEndpoint: 'documents-load.php',
            userId: userId,
            maxRetries: 1,
            retryDelay: 500
          });
          
          if (Array.isArray(result)) {
            setDocuments(result as Document[]);
            toast({
              title: "Synchronisation réussie",
              description: `${result.length} documents chargés du serveur`,
            });
          }
        } catch (loadError) {
          console.error("Erreur lors du rechargement après synchronisation:", loadError);
        }
        
        return true;
      } else {
        setCoreSyncFailed(true);
        return false;
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      setCoreSyncFailed(true);
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Erreur lors de la synchronisation",
        variant: "destructive"
      });
      return false;
    }
  }, [documents, userId, isOnline, isSyncing, globalSync, syncService, setCoreSyncFailed, setCoreLastSynced, setDocuments, toast]);

  return {
    handleSyncWithServer
  };
};
