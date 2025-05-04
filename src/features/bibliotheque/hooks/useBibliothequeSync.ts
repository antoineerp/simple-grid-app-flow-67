
import { useState, useCallback } from 'react';
import { Document as BibliothequeDocument, DocumentGroup } from '@/types/bibliotheque';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSync } from '@/hooks/useSync';
import { toast } from '@/components/ui/use-toast';

export const useBibliothequeSync = () => {
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date()); // Date factice
  const { isOnline } = useNetworkStatus();
  const { syncAndProcess } = useSync('collaboration');
  
  // Fonction pour charger les documents depuis le stockage local uniquement
  const loadFromServer = useCallback(async (userId?: string): Promise<BibliothequeDocument[]> => {
    try {
      const localData = localStorage.getItem(`collaboration_${userId || 'default'}`);
      
      if (localData) {
        const localDocs = JSON.parse(localData);
        return localDocs;
      }
    } catch (e) {
      console.error('Erreur lors du chargement des documents locaux:', e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les documents locaux.",
      });
    }
    return [];
  }, []);
  
  // Fonction pour enregistrer uniquement en local
  const syncWithServer = useCallback(async (
    documents: BibliothequeDocument[], 
    groups: DocumentGroup[], 
    userId?: string
  ): Promise<boolean> => {
    try {
      // Enregistrer uniquement en local
      localStorage.setItem(`collaboration_${userId || 'default'}`, JSON.stringify(documents));
      localStorage.setItem(`collaboration_groups_${userId || 'default'}`, JSON.stringify(groups));
      
      toast({
        title: "Enregistrement local",
        description: "Les modifications ont été enregistrées localement.",
      });
      
      setLastSynced(new Date());
      return true;
    } catch (error) {
      console.error("Erreur lors de l'enregistrement local:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer les modifications localement.",
      });
      return false;
    }
  }, []);
  
  // Fonction avec délai (debounce) - maintenant simplement enregistre localement
  const debounceSyncWithServer = useCallback((
    documents: BibliothequeDocument[], 
    groups: DocumentGroup[], 
    userId?: string
  ) => {
    // Enregistrer localement immédiatement
    localStorage.setItem(`collaboration_${userId || 'default'}`, JSON.stringify(documents));
    localStorage.setItem(`collaboration_groups_${userId || 'default'}`, JSON.stringify(groups));
    return true;
  }, []);
  
  return {
    syncWithServer,
    debounceSyncWithServer,
    loadFromServer,
    isSyncing: false,
    isOnline: true,
    lastSynced,
    syncFailed: false
  };
};
