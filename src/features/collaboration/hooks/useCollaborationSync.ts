
import { useState, useCallback, useEffect } from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { saveCollaborationToStorage } from '@/services/collaboration/collaborationService';

// ID utilisateur fixe pour toute l'application
const FIXED_USER_ID = 'p71x6d_richard';

export const useCollaborationSync = () => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const [syncAttempts, setSyncAttempts] = useState<number>(0);
  const { toast } = useToast();
  
  // Base URL pour les requêtes API
  const baseApiUrl = getApiUrl();

  // Vérifier l'état de la connexion Internet
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Essayer de synchroniser lorsque la connexion est rétablie
      console.log("Connexion Internet rétablie");
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log("Connexion Internet perdue");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Function to load documents from server with retry mechanism
  const loadFromServer = useCallback(async (): Promise<Document[]> => {
    try {
      setIsSyncing(true);
      setSyncFailed(false);
      
      // Si hors ligne, ne pas tenter de charger depuis le serveur
      if (!isOnline) {
        console.log("Impossible de charger les données: Hors ligne");
        throw new Error("Hors ligne");
      }
      
      // Utilisation cohérente des chemins avec getApiUrl et GET pour le chargement
      const url = `${baseApiUrl}/collaboration-load.php?userId=${FIXED_USER_ID}`;
      console.log("Tentative de chargement depuis:", url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur HTTP ${response.status}: ${errorText}`);
        throw new Error(`Erreur réseau: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setLastSynced(new Date());
        console.log("Données chargées avec succès:", data);
        
        // Sauvegarder en local
        if (data.documents && data.documents.length > 0) {
          const groupDocs = data.documents.filter((doc: Document) => doc.groupId);
          const nonGroupDocs = data.documents.filter((doc: Document) => !doc.groupId);
          
          // Extraire les groupes uniques
          const uniqueGroupIds = [...new Set(groupDocs.map((doc: Document) => doc.groupId))];
          const groups: DocumentGroup[] = uniqueGroupIds.map(groupId => {
            const docsInGroup = groupDocs.filter((doc: Document) => doc.groupId === groupId);
            return {
              id: groupId as string,
              name: `Groupe ${groupId}`,
              expanded: false,
              items: docsInGroup
            };
          });
          
          saveCollaborationToStorage(nonGroupDocs, groups);
        }
        
        return data.documents || [];
      } else {
        console.error('Erreur lors du chargement des documents:', data.message);
        setSyncFailed(true);
        setSyncAttempts(prev => prev + 1);
        return [];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      setSyncFailed(true);
      setSyncAttempts(prev => prev + 1);
      return [];
    } finally {
      setIsSyncing(false);
    }
  }, [baseApiUrl, isOnline]);

  // Function to sync documents with server with better error handling
  const syncWithServer = useCallback(async (
    documents: Document[], 
    groups: DocumentGroup[]
  ): Promise<boolean> => {
    try {
      setIsSyncing(true);
      setSyncFailed(false);
      
      // Si hors ligne, ne pas tenter de synchroniser
      if (!isOnline) {
        console.log("Impossible de synchroniser: Hors ligne");
        toast({
          variant: "destructive",
          title: "Mode hors ligne",
          description: "La synchronisation n'est pas possible en mode hors ligne"
        });
        return false;
      }
      
      // Extraction des documents des groupes pour l'envoi
      const allGroupDocuments = groups.flatMap(group => 
        group.items.map(item => ({...item, groupId: group.id}))
      );
      
      // Tous les documents à envoyer au serveur
      const allDocuments = [...documents, ...allGroupDocuments];
      
      // Groupes sans les items pour l'envoi au serveur
      const groupsData = groups.map(({items, ...rest}) => rest);
      
      // Préparer les données pour la synchronisation avec l'ID utilisateur fixe
      const syncData = {
        userId: FIXED_USER_ID,
        collaboration: allDocuments
      };
      
      const groupsPayload = {
        userId: FIXED_USER_ID,
        groups: groupsData
      };
      
      console.log("Synchronisation des documents:", syncData);
      console.log("Synchronisation des groupes:", groupsPayload);
      
      // Synchroniser les documents - POST request
      const docsResponse = await fetch(`${baseApiUrl}/collaboration-sync.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify(syncData)
      });
      
      if (!docsResponse.ok) {
        const errorText = await docsResponse.text();
        console.error(`Erreur HTTP documents ${docsResponse.status}: ${errorText}`);
        throw new Error(`Erreur réseau documents: ${docsResponse.status}`);
      }
      
      // Synchroniser les groupes - POST request
      const groupsResponse = await fetch(`${baseApiUrl}/collaboration-groups-sync.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify(groupsPayload)
      });
      
      if (!groupsResponse.ok) {
        const errorText = await groupsResponse.text();
        console.error(`Erreur HTTP groupes ${groupsResponse.status}: ${errorText}`);
        throw new Error(`Erreur réseau groupes: ${groupsResponse.status}`);
      }
      
      // Vérifier les résultats
      const docsResult = await docsResponse.json();
      const groupsResult = await groupsResponse.json();
      
      if (docsResult.success && groupsResult.success) {
        setLastSynced(new Date());
        setSyncAttempts(0);
        console.log('Synchronisation réussie:', {
          documents: docsResult,
          groups: groupsResult
        });
        
        // Sauvegarder en local après synchronisation réussie
        saveCollaborationToStorage(documents, groups);
        
        toast({
          title: "Synchronisation réussie",
          description: "Les documents ont été synchronisés avec le serveur"
        });
        
        return true;
      } else {
        console.error('Erreur lors de la synchronisation:', {
          documents: docsResult,
          groups: groupsResult
        });
        setSyncFailed(true);
        setSyncAttempts(prev => prev + 1);
        
        toast({
          variant: "destructive",
          title: "Erreur de synchronisation",
          description: "Les documents n'ont pas pu être synchronisés avec le serveur"
        });
        
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      setSyncFailed(true);
      setSyncAttempts(prev => prev + 1);
      
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Une erreur est survenue"
      });
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [baseApiUrl, isOnline, toast]);

  // Debounced version of syncWithServer
  const debounceSyncWithServer = useCallback((
    documents: Document[],
    groups: DocumentGroup[]
  ) => {
    let timeoutId: NodeJS.Timeout;
    return new Promise<boolean>((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        // Sauvegarder d'abord localement avant de tenter la synchro
        saveCollaborationToStorage(documents, groups);
        
        if (isOnline) {
          const result = await syncWithServer(documents, groups);
          resolve(result);
        } else {
          console.log("Mode hors ligne: sauvegarde locale uniquement");
          resolve(false);
        }
      }, 1000);
    });
  }, [syncWithServer, isOnline]);

  return {
    loadFromServer,
    syncWithServer,
    debounceSyncWithServer,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed,
    syncAttempts
  };
};
