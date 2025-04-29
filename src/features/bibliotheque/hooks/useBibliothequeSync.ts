
import { useState, useCallback } from 'react';
import { Document as BibliothequeDocument, DocumentGroup } from '@/types/bibliotheque';
import { Document as SystemDocument } from '@/types/documents';
import { 
  loadDocumentsFromServer, 
  syncDocumentsWithServer, 
  getLocalDocuments 
} from '@/services/documents/documentSyncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { toast } from '@/components/ui/use-toast';

// Helper function to convert between document types
const convertSystemToBibliothequeDoc = (doc: SystemDocument): BibliothequeDocument => ({
  id: doc.id,
  name: doc.nom || '',
  link: doc.fichier_path,
  groupId: doc.groupId
});

const convertBibliothequeToSystemDoc = (doc: BibliothequeDocument): SystemDocument => ({
  id: doc.id,
  nom: doc.name || '',
  fichier_path: doc.link,
  groupId: doc.groupId,
  responsabilites: { r: [], a: [], c: [], i: [] },
  etat: null,
  date_creation: new Date(),
  date_modification: new Date()
});

export const useBibliothequeSync = () => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { isOnline } = useNetworkStatus();
  
  const loadFromServer = useCallback(async (userId?: string): Promise<BibliothequeDocument[]> => {
    if (!isOnline) {
      console.log('Mode hors ligne - chargement des documents locaux');
      const localDocs = getLocalDocuments(userId || null);
      return localDocs.map(convertSystemToBibliothequeDoc);
    }
    
    try {
      setIsSyncing(true);
      const documents = await loadDocumentsFromServer(userId || null);
      setLastSynced(new Date());
      return documents.map(convertSystemToBibliothequeDoc);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les documents du serveur. Mode hors-ligne activé.",
      });
      
      // En cas d'erreur, chargement des documents locaux comme solution de secours
      const localDocs = getLocalDocuments(userId || null);
      return localDocs.map(convertSystemToBibliothequeDoc);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);
  
  const syncWithServer = useCallback(async (documents: BibliothequeDocument[], groups: DocumentGroup[], userId?: string): Promise<void> => {
    if (!isOnline) {
      // Mode hors ligne - enregistrement local uniquement
      const systemDocs = documents.map(convertBibliothequeToSystemDoc);
      localStorage.setItem(`documents_${userId || 'default'}`, JSON.stringify(systemDocs));
      localStorage.setItem(`groups_${userId || 'default'}`, JSON.stringify(groups));
      
      toast({
        variant: "destructive",
        title: "Mode hors ligne",
        description: "Les modifications ont été enregistrées localement uniquement.",
      });
      
      return;
    }
    
    try {
      setIsSyncing(true);
      const systemDocs = documents.map(convertBibliothequeToSystemDoc);
      const success = await syncDocumentsWithServer(systemDocs, userId || null);
      
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
