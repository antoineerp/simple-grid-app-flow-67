
import { useState, useCallback, useRef, useEffect } from 'react';
import { Document as BibliothequeDocument, DocumentGroup } from '@/types/bibliotheque';
import { Document as SystemDocument } from '@/types/documents';
import { syncService } from '@/services/sync/SyncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSync } from '@/hooks/useSync';
import { toast } from '@/components/ui/use-toast';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { markDataChanged } from '@/utils/syncStorageCleaner';

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
  const documentsRef = useRef<BibliothequeDocument[]>([]);
  const groupsRef = useRef<DocumentGroup[]>([]);
  const lastChangedRef = useRef<Date | null>(null);
  
  // Fonction pour charger les documents depuis le serveur
  const loadFromServer = useCallback(async (userId?: string): Promise<BibliothequeDocument[]> => {
    // Toujours utiliser l'utilisateur courant si non spécifié
    const currentUser = userId || getDatabaseConnectionCurrentUser() || 'default';
    console.log(`useBibliothequeSync: Chargement des documents pour l'utilisateur ${currentUser}`);
    
    if (!isOnline) {
      console.log('Mode hors ligne - chargement des documents locaux');
      try {
        // UNIQUEMENT chercher sous le nouveau nom (collaboration)
        const localData = localStorage.getItem(`collaboration_${currentUser}`);
        
        if (localData) {
          const localDocs = JSON.parse(localData);
          console.log(`Chargé ${localDocs.length} documents depuis le stockage local`);
          return localDocs.map(convertSystemToBibliothequeDoc);
        }
      } catch (e) {
        console.error('Erreur lors du chargement des documents locaux:', e);
      }
      return [];
    }
    
    try {
      // Utiliser le service central pour charger les données
      console.log(`Chargement des documents depuis le serveur pour ${currentUser}`);
      const documents = await syncService.loadDataFromServer<SystemDocument>('collaboration', currentUser);
      const lastSyncTime = syncService.getLastSynced('collaboration');
      
      console.log(`Chargé ${documents.length} documents depuis le serveur`);
      
      if (lastSyncTime) {
        setLastSynced(lastSyncTime);
      } else {
        setLastSynced(new Date());
      }
      
      // Mettre à jour le stockage local avec les données fraîchement chargées
      const systemDocs = documents;
      localStorage.setItem(`collaboration_${currentUser}`, JSON.stringify(systemDocs));
      
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
        const localData = localStorage.getItem(`collaboration_${currentUser}`);
        
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

  // Effet pour déclencher la synchronisation automatique
  useEffect(() => {
    // Intervalle de vérification de synchronisation automatique toutes les 30 secondes
    const autoSyncInterval = setInterval(() => {
      if (lastChangedRef.current && documentsRef.current.length > 0 && groupsRef.current.length > 0) {
        const now = new Date();
        const timeSinceLastChange = now.getTime() - lastChangedRef.current.getTime();
        
        // Si des modifications ont été faites il y a plus de 10 secondes, synchroniser
        if (timeSinceLastChange > 10000 && !isSyncing) {
          console.log('Synchronisation automatique déclenchée');
          
          // Utiliser l'utilisateur courant
          const currentUser = getDatabaseConnectionCurrentUser() || 'default';
          
          syncWithServer(documentsRef.current, groupsRef.current, currentUser, "auto")
            .catch(err => console.error("Erreur lors de la synchronisation automatique:", err));
        }
      }
    }, 30000); // Vérifier toutes les 30 secondes
    
    return () => clearInterval(autoSyncInterval);
  }, [isSyncing]);
  
  // Fonction pour synchroniser avec délai (debounce)
  const debounceSyncWithServer = useCallback((
    documents: BibliothequeDocument[], 
    groups: DocumentGroup[], 
    userId?: string
  ) => {
    // Toujours utiliser l'utilisateur courant si non spécifié
    const currentUser = userId || getDatabaseConnectionCurrentUser() || 'default';
    
    // Mettre à jour les références pour la synchronisation automatique
    documentsRef.current = documents;
    groupsRef.current = groups;
    lastChangedRef.current = new Date();
    
    // Toujours sauvegarder localement immédiatement
    const systemDocs = documents.map(convertBibliothequeToSystemDoc);
    localStorage.setItem(`collaboration_${currentUser}`, JSON.stringify(systemDocs));
    localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(groups));
    
    // Marquer qu'une synchronisation est en attente
    pendingSyncRef.current = true;
    markDataChanged('collaboration');
    
    // Si un timeout est déjà en cours, l'annuler
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Programmer une nouvelle synchronisation après 10 secondes
    syncTimeoutRef.current = setTimeout(() => {
      if (pendingSyncRef.current && isOnline) {
        // Exécuter la synchronisation
        syncWithServer(documents, groups, currentUser, "auto").catch(err => {
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
    // Toujours utiliser l'utilisateur courant si non spécifié
    const currentUser = userId || getDatabaseConnectionCurrentUser() || 'default';
    
    console.log(`Synchronisation pour l'utilisateur: ${currentUser} (${documents.length} documents)`);
    
    if (!isOnline) {
      // Mode hors ligne - enregistrement local uniquement
      const systemDocs = documents.map(convertBibliothequeToSystemDoc);
      localStorage.setItem(`collaboration_${currentUser}`, JSON.stringify(systemDocs));
      localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(groups));
      markDataChanged('collaboration');
      
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
      localStorage.setItem(`collaboration_${currentUser}`, JSON.stringify(systemDocs));
      localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(groups));
      
      // Marquer que les données ont été modifiées
      markDataChanged('collaboration');
      
      // Préparer les options pour syncAndProcess
      const options = { userId: currentUser };
      
      // Utiliser le service central pour la synchronisation avec la table "collaboration"
      const result = await syncAndProcess(systemDocs, trigger, options);
      
      if (result.success) {
        const lastSyncTime = syncService.getLastSynced('collaboration');
        if (lastSyncTime) {
          setLastSynced(lastSyncTime);
        } else {
          setLastSynced(new Date());
        }
        
        // Réinitialiser l'indicateur de synchronisation en attente
        pendingSyncRef.current = false;
        
        console.log(`Synchronisation réussie pour ${currentUser} (${documents.length} documents)`);
        return true;
      }
      
      console.error(`Échec de la synchronisation pour ${currentUser}:`, result.message);
      return false;
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      // L'erreur est déjà gérée dans le hook useSync
      return false;
    }
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
