
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/types/documents';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncDocumentsWithServer, loadDocumentsFromServer } from '@/services/documents/documentSyncService';

export const useDocumentSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(undefined);
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  const syncWithServer = async (documents: Document[], userId: string): Promise<boolean> => {
    if (!isOnline) {
      console.log("Tentative de synchronisation hors ligne, annulée.");
      toast({
        title: "Connexion hors ligne",
        description: "Impossible de synchroniser les documents. Veuillez vérifier votre connexion.",
        variant: "destructive"
      });
      return false;
    }
    
    if (isSyncing) {
      console.log("Synchronisation déjà en cours, ignorée");
      return false;
    }
    
    console.log(`Début de la synchronisation de ${documents.length} documents pour l'utilisateur ${userId}`);
    setIsSyncing(true);
    
    try {
      const success = await syncDocumentsWithServer(documents, userId);
      
      if (success) {
        console.log("Synchronisation réussie");
        setLastSynced(new Date());
        toast({
          title: "Synchronisation réussie",
          description: "Vos documents ont été synchronisés avec le serveur",
        });
        return true;
      }
      
      console.error("Le serveur a signalé un échec de synchronisation");
      throw new Error("Le serveur a signalé un échec de synchronisation");
    } catch (error) {
      console.error("Erreur pendant la synchronisation:", error);
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

  const loadFromServer = async (userId: string): Promise<Document[] | null> => {
    console.log(`Début du chargement des documents pour l'utilisateur ${userId}`);
    setIsSyncing(true);
    
    try {
      const docs = await loadDocumentsFromServer(userId);
      console.log(`${docs.length} documents chargés avec succès`);
      
      if (docs && docs.length > 0) {
        setLastSynced(new Date());
      }
      return docs;
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast({
        title: "Erreur de chargement",
        description: error instanceof Error ? error.message : "Impossible de charger les documents du serveur",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSyncing(false);
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
