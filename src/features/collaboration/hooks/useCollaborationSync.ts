
import { useState, useCallback } from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useToast } from '@/hooks/use-toast';

export const useCollaborationSync = () => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const { toast } = useToast();

  // Function to load documents from server
  const loadFromServer = useCallback(async (userId: string): Promise<Document[]> => {
    try {
      setIsSyncing(true);
      setSyncFailed(false);
      
      // Attempt to fetch documents from server
      const response = await fetch(`${process.env.API_URL || ''}/api/collaboration-load.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 'p71x6d_richard' }) // Toujours utiliser cet ID
      });
      
      if (!response.ok) {
        throw new Error(`Erreur réseau: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setLastSynced(new Date());
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
  }, []);

  // Function to sync documents with server
  const syncWithServer = useCallback(async (
    documents: Document[], 
    groups: DocumentGroup[], 
    userId: string
  ): Promise<boolean> => {
    try {
      setIsSyncing(true);
      setSyncFailed(false);
      
      // Préparer les données pour la synchronisation
      const docsData = {
        userId: 'p71x6d_richard', // Toujours utiliser cet ID
        collaboration: documents
      };
      
      const groupsData = {
        userId: 'p71x6d_richard', // Toujours utiliser cet ID
        groups: groups
      };
      
      // Synchroniser les documents
      const docsResponse = await fetch(`${process.env.API_URL || ''}/api/collaboration-sync.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(docsData)
      });
      
      if (!docsResponse.ok) {
        throw new Error(`Erreur réseau documents: ${docsResponse.status}`);
      }
      
      // Synchroniser les groupes
      const groupsResponse = await fetch(`${process.env.API_URL || ''}/api/collaboration-groups-sync.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
  }, []);

  // Debounced version of syncWithServer
  const debounceSyncWithServer = useCallback((
    documents: Document[],
    groups: DocumentGroup[],
    userId: string
  ) => {
    let timeoutId: NodeJS.Timeout;
    return new Promise<boolean>((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await syncWithServer(documents, groups, userId);
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
