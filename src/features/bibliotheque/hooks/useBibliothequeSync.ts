
import { useState, useCallback, useRef } from 'react';
import { Document as BibliothequeDocument, DocumentGroup } from '@/types/bibliotheque';
import { Document as SystemDocument } from '@/types/documents';
import { syncService } from '@/services/sync/SyncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSync } from '@/hooks/useSync';
import { toast } from '@/components/ui/use-toast';

// Helper function to convert between document types
const convertSystemToBibliothequeDoc = (doc: SystemDocument): BibliothequeDocument => ({
  id: doc.id,
  name: doc.nom || '',
  link: doc.fichier_path,
  groupId: doc.groupId,
  userId: doc.userId || 'system' // Ensure userId is set
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
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { isOnline } = useNetworkStatus();
  const { isSyncing, syncFailed, syncAndProcess } = useSync('collaboration');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSyncRef = useRef<boolean>(false);
  
  // Fonction pour charger les documents depuis le serveur
  const loadFromServer = useCallback(async (userId?: string): Promise<BibliothequeDocument[]> => {
    if (!isOnline) {
      console.log('Mode hors ligne - chargement des documents locaux');
      try {
        // UNIQUEMENT chercher sous le nouveau nom (collaboration)
        const localData = localStorage.getItem(`collaboration_${userId || 'default'}`);
        
        if (localData) {
          const localDocs = JSON.parse(localData);
          return localDocs.map(convertSystemToBibliothequeDoc);
        }
      } catch (e) {
        console.error('Erreur lors du chargement des documents locaux:', e);
      }
      return [];
    }
    
    try {
      // Utiliser le service central pour charger les données
      const documents = await syncService.loadDataFromServer<SystemDocument>('collaboration', userId);
      const lastSyncTime = syncService.getLastSynced('collaboration');
      if (lastSyncTime) {
        setLastSynced(lastSyncTime);
      } else {
        setLastSynced(new Date());
      }
      return documents.map(convertSystemToBibliothequeDoc);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les documents du serveur. Mode hors-ligne activé.",
      });
      
      // En cas d'erreur, chargement des documents locaux comme solution de secours
      try {
        // UNIQUEMENT chercher sous le nouveau nom (collaboration)
        const localData = localStorage.getItem(`collaboration_${userId || 'default'}`);
        
        if (localData) {
          const localDocs = JSON.parse(localData);
          return localDocs.map(convertSystemToBibliothequeDoc);
        }
      } catch (e) {
        console.error('Erreur lors du chargement des documents locaux:', e);
      }
      return [];
    }
  }, [isOnline]);
  
  // Fonction pour synchroniser avec délai (debounce)
  const debounceSyncWithServer = useCallback((
    documents: BibliothequeDocument[], 
    groups: DocumentGroup[], 
    userId?: string
  ) => {
    // Toujours sauvegarder localement immédiatement
    const systemDocs = documents.map(convertBibliothequeToSystemDoc);
    localStorage.setItem(`collaboration_${userId || 'default'}`, JSON.stringify(systemDocs));
    localStorage.setItem(`collaboration_groups_${userId || 'default'}`, JSON.stringify(groups));
    
    // Marquer qu'une synchronisation est en attente
    pendingSyncRef.current = false; // Changed to false since sync is disabled
    
    // Si un timeout est déjà en cours, l'annuler
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // No sync timeout is needed anymore since sync is disabled
    return true;
  }, [isOnline]);
  
  // Fonction principale de synchronisation
  const syncWithServer = useCallback(async (
    documents: BibliothequeDocument[], 
    groups: DocumentGroup[], 
    userId?: string, 
    trigger: "auto" | "manual" | "initial" = "manual"
  ): Promise<boolean> => {
    // Mode hors ligne - enregistrement local uniquement
    const systemDocs = documents.map(convertBibliothequeToSystemDoc);
    localStorage.setItem(`collaboration_${userId || 'default'}`, JSON.stringify(systemDocs));
    localStorage.setItem(`collaboration_groups_${userId || 'default'}`, JSON.stringify(groups));
    
    if (trigger !== "auto") {
      toast({
        title: "Enregistrement local",
        description: "Les modifications ont été enregistrées localement.",
      });
    }
    
    // Call syncAndProcess without any arguments since it now expects 0 args
    const result = await syncAndProcess();
    
    // Simulated success
    if (result.success) {
      setLastSynced(new Date());
      pendingSyncRef.current = false;
      return true;
    }
    
    return false;
  }, [isOnline, syncAndProcess]);
  
  return {
    syncWithServer,
    debounceSyncWithServer,
    loadFromServer,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed
  };
};
