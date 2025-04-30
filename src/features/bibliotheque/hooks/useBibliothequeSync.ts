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
    pendingSyncRef.current = true;
    
    // Si un timeout est déjà en cours, l'annuler
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Programmer une nouvelle synchronisation après 10 secondes
    syncTimeoutRef.current = setTimeout(() => {
      if (pendingSyncRef.current && isOnline) {
        // Exécuter la synchronisation
        syncWithServer(documents, groups, userId, "auto").catch(err => {
          console.error("Erreur lors de la synchronisation différée:", err);
        });
        pendingSyncRef.current = false;
      }
      syncTimeoutRef.current = null;
    }, 10000); // 10 secondes de délai
    
    return true;
  }, [isOnline]);
  
  // Fonction principale de synchronisation
  const syncWithServer = useCallback(async (
    documents: BibliothequeDocument[], 
    groups: DocumentGroup[], 
    userId?: string, 
    trigger: "auto" | "manual" | "initial" = "manual"
  ): Promise<boolean> => {
    if (!isOnline) {
      // Mode hors ligne - enregistrement local uniquement
      const systemDocs = documents.map(convertBibliothequeToSystemDoc);
      localStorage.setItem(`collaboration_${userId || 'default'}`, JSON.stringify(systemDocs));
      localStorage.setItem(`collaboration_groups_${userId || 'default'}`, JSON.stringify(groups));
      
      if (trigger !== "auto") {
        toast({
          variant: "destructive",
          title: "Mode hors ligne",
          description: "Les modifications ont été enregistrées localement uniquement.",
        });
      }
      
      return false;
    }
    
    try {
      // Toujours enregistrer localement d'abord pour éviter la perte de données
      const systemDocs = documents.map(convertBibliothequeToSystemDoc);
      localStorage.setItem(`collaboration_${userId || 'default'}`, JSON.stringify(systemDocs));
      localStorage.setItem(`collaboration_groups_${userId || 'default'}`, JSON.stringify(groups));
      
      // Utiliser le service central pour la synchronisation avec la table "collaboration"
      const result = await syncAndProcess(systemDocs, trigger);
      
      if (result.success) {
        const lastSyncTime = syncService.getLastSynced('collaboration');
        if (lastSyncTime) {
          setLastSynced(lastSyncTime);
        } else {
          setLastSynced(new Date());
        }
        
        // Réinitialiser l'indicateur de synchronisation en attente
        pendingSyncRef.current = false;
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      // L'erreur est déjà gérée dans le hook useSync
      return false;
    }
  }, [isOnline, syncAndProcess]);
  
  return {
    syncWithServer,
    debounceSyncWithServer, // Nouvelle fonction pour la synchronisation différée
    loadFromServer,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed
  };
};
