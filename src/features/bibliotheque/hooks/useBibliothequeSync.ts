
import { useState, useCallback } from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { 
  loadDocumentsFromServer, 
  syncDocumentsWithServer, 
  getLocalDocuments 
} from '@/services/documents/documentSyncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { toast } from '@/components/ui/use-toast';

export const useBibliothequeSync = () => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { isOnline } = useNetworkStatus();
  
  const loadFromServer = useCallback(async (userId?: string): Promise<Document[]> => {
    if (!isOnline) {
      console.log('Mode hors ligne - chargement des documents locaux');
      const localDocs = getLocalDocuments(userId || null);
      return localDocs;
    }
    
    try {
      setIsSyncing(true);
      const documents = await loadDocumentsFromServer(userId || null);
      setLastSynced(new Date());
      return documents;
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les documents du serveur. Mode hors-ligne activé.",
      });
      
      // En cas d'erreur, chargement des documents locaux comme solution de secours
      return getLocalDocuments(userId || null);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);
  
  const syncWithServer = useCallback(async (documents: Document[], groups: DocumentGroup[], userId?: string): Promise<void> => {
    if (!isOnline) {
      // Mode hors ligne - enregistrement local uniquement
      localStorage.setItem(`documents_${userId || 'default'}`, JSON.stringify(documents));
      localStorage.setItem(`groups_${userId || 'default'}`, JSON.stringify(groups));
      
      toast({
        variant: "warning",
        title: "Mode hors ligne",
        description: "Les modifications ont été enregistrées localement uniquement.",
      });
      
      return;
    }
    
    try {
      setIsSyncing(true);
      const success = await syncDocumentsWithServer(documents, userId || null);
      
      if (success) {
        setLastSynced(new Date());
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: "Les documents ont été enregistrés localement, mais la synchronisation a échoué.",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);
  
  return {
    syncWithServer,
    loadFromServer,
    isSyncing,
    isOnline,
    lastSynced
  };
};
