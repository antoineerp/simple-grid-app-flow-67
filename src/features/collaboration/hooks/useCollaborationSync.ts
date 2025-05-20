
import { useState, useCallback } from 'react';
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
  const { toast } = useToast();
  
  // Base URL pour les requêtes API
  const baseApiUrl = getApiUrl();

  // Function to load documents from server
  const loadFromServer = useCallback(async (): Promise<Document[]> => {
    try {
      setIsSyncing(true);
      setSyncFailed(false);
      
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
        throw new Error(`Erreur réseau: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setLastSynced(new Date());
        console.log("Données chargées avec succès:", data);
        
        // Sauvegarder en local
        if (data.documents && data.documents.length > 0) {
          saveCollaborationToStorage(data.documents.filter((doc: Document) => !doc.groupId), []);
        }
        
        return data.documents || [];
      } else {
        console.error('Erreur lors du chargement des documents:', data.message);
        setSyncFailed(true);
        return [];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      setSyncFailed(true);
      return [];
    } finally {
      setIsSyncing(false);
    }
  }, [baseApiUrl]);

  // Function to sync documents with server
  const syncWithServer = useCallback(async (
    documents: Document[], 
    groups: DocumentGroup[]
  ): Promise<boolean> => {
    try {
      setIsSyncing(true);
      setSyncFailed(false);
      
      // Préparer les données pour la synchronisation avec l'ID utilisateur fixe
      const docsData = {
        userId: FIXED_USER_ID,
        collaboration: documents
      };
      
      const groupsData = {
        userId: FIXED_USER_ID,
        groups: groups
      };
      
      // Synchroniser les documents - chemin cohérent
      const docsResponse = await fetch(`${baseApiUrl}/collaboration-sync.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify(docsData)
      });
      
      if (!docsResponse.ok) {
        throw new Error(`Erreur réseau documents: ${docsResponse.status}`);
      }
      
      // Synchroniser les groupes - chemin cohérent
      const groupsResponse = await fetch(`${baseApiUrl}/collaboration-groups-sync.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify(groupsData)
      });
      
      if (!groupsResponse.ok) {
        throw new Error(`Erreur réseau groupes: ${groupsResponse.status}`);
      }
      
      // Vérifier les résultats
      const docsResult = await docsResponse.json();
      const groupsResult = await groupsResponse.json();
      
      if (docsResult.success && groupsResult.success) {
        setLastSynced(new Date());
        console.log('Synchronisation réussie:', {
          documents: docsResult,
          groups: groupsResult
        });
        
        // Sauvegarder en local après synchronisation réussie
        saveCollaborationToStorage(documents, groups);
        
        return true;
      } else {
        console.error('Erreur lors de la synchronisation:', {
          documents: docsResult,
          groups: groupsResult
        });
        setSyncFailed(true);
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      setSyncFailed(true);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [baseApiUrl]);

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
        
        const result = await syncWithServer(documents, groups);
        resolve(result);
      }, 1000);
    });
  }, [syncWithServer]);

  // Handle online/offline status changes
  useState(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  return {
    loadFromServer,
    syncWithServer,
    debounceSyncWithServer,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed
  };
};
