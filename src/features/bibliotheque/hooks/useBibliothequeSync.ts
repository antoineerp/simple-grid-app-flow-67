
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSync } from '@/hooks/useSync';

export const useBibliothequeSync = () => {
  const [lastSynced, setLastSynced] = useState<Date>();
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  // Utiliser le hook de synchronisation central
  const { isSyncing, syncAndProcess } = useSync('bibliotheque');
  
  const syncWithServer = async (documents: Document[], groups: DocumentGroup[], userId: string): Promise<void> => {
    if (!isOnline || isSyncing) return;
    
    try {
      const result = await syncAndProcess({
        tableName: 'bibliotheque',
        data: documents,
        groups: groups
      });
      
      if (result.success) {
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
    }
  };

  const loadFromServer = async (userId: string) => {
    try {
      // Cette fonctionnalité sera gérée par le service de synchronisation central
      // dans une future mise à jour
      return null;
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
