
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/types/documents';

// Hook de synchronisation simplifié qui ne fait plus de vraies synchronisations
export const useDocumentSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  
  // Fonction simplifiée qui simule une synchronisation
  const syncWithServer = async (documents: Document[], userId: string): Promise<boolean> => {
    console.log("Synchronisation désactivée - fonctionnalité simulée");
    return true;
  };

  // Fonction simplifiée qui simule un chargement
  const loadFromServer = async (userId: string): Promise<Document[] | null> => {
    console.log("Chargement depuis le serveur désactivé - fonctionnalité simulée");
    return [];
  };

  return {
    syncWithServer,
    loadFromServer,
    isSyncing: false,
    isOnline: true,
    lastSynced: new Date() // Date factice
  };
};
