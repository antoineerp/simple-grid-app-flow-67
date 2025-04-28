
import { useState } from 'react';
import { Document, DocumentGroup } from '@/types/collaboration';
import { loadCollaborationFromServer, syncCollaborationWithServer } from '@/services/collaboration/collaborationSync';
import { useToast } from '@/hooks/use-toast';

export const useCollaborationSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const { toast } = useToast();

  // Détecter la connectivité réseau
  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  // Charger les données depuis le serveur
  const loadFromServer = async (userId: string) => {
    if (!isOnline) {
      toast({
        title: "Mode hors-ligne",
        description: "Impossible de charger les données en mode hors-ligne",
        variant: "destructive"
      });
      return [];
    }

    try {
      setIsSyncing(true);
      const result = await loadCollaborationFromServer(userId);
      
      if (result) {
        setLastSynced(new Date());
        return result.documents;
      } else {
        return [];
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast({
        title: "Erreur de chargement",
        description: errorMessage,
        variant: "destructive"
      });
      return [];
    } finally {
      setIsSyncing(false);
    }
  };

  // Synchroniser avec le serveur
  const syncWithServer = async (documents: Document[], groups: DocumentGroup[], userId: string) => {
    if (!isOnline) {
      toast({
        title: "Mode hors-ligne",
        description: "Impossible de synchroniser en mode hors-ligne",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsSyncing(true);
      const success = await syncCollaborationWithServer(documents, groups, userId);
      
      if (success) {
        setLastSynced(new Date());
        toast({
          title: "Synchronisation réussie",
          description: "Les données ont été synchronisées avec le serveur"
        });
        return true;
      } else {
        toast({
          title: "Échec de synchronisation",
          description: "La synchronisation a échoué",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast({
        title: "Erreur de synchronisation",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    isOnline,
    lastSynced,
    loadFromServer,
    syncWithServer
  };
};
