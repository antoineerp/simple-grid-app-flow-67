
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/types/documents';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { saveLocalData, syncWithServer, loadLocalData } from '@/services/sync/AutoSyncService';

export const useDocumentSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(undefined);
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  const syncWithServerWrapper = async (documents: Document[]): Promise<boolean> => {
    if (!isOnline) {
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
    
    setIsSyncing(true);
    try {
      console.log(`Synchronisation de ${documents.length} documents`);
      
      // Sauvegarder localement d'abord
      saveLocalData('documents', documents);
      
      // Puis synchroniser avec le serveur
      const success = await syncWithServer('documents', documents);
      
      if (success) {
        setLastSynced(new Date());
        toast({
          title: "Synchronisation réussie",
          description: "Vos documents ont été synchronisés avec le serveur",
        });
        return true;
      }
      
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
    if (!isOnline) {
      toast({
        title: "Connexion hors ligne",
        description: "Impossible de charger les documents. Veuillez vérifier votre connexion.",
        variant: "destructive"
      });
      return null;
    }
    
    setIsSyncing(true);
    try {
      console.log(`Chargement des documents pour l'utilisateur ${userId}`);
      
      // Essayer de charger depuis le serveur
      // Pour cette version simplifiée, on récupère simplement les données locales
      const docs = loadLocalData<Document>('documents');
      setLastSynced(new Date());
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
    syncWithServer: syncWithServerWrapper,
    loadFromServer,
    isSyncing,
    isOnline,
    lastSynced
  };
};
