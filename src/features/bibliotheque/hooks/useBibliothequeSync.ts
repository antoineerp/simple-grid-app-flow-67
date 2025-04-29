
import { useState } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

export const useBibliothequeSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { isOnline } = useNetworkStatus();

  const loadFromServer = async (): Promise<Document[]> => {
    if (!isOnline) {
      throw new Error('Impossible de charger les documents en mode hors ligne');
    }

    setIsSyncing(true);
    
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/bibliotheque-load.php`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Échec du chargement des documents');
      }
      
      setLastSynced(new Date());
      setSyncFailed(false);
      
      return result.documents || [];
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      setSyncFailed(true);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncWithServer = async (
    documents: Document[], 
    groups: DocumentGroup[],
    userId: string
  ): Promise<boolean> => {
    if (!isOnline) {
      return false;
    }
    
    setIsSyncing(true);
    
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/bibliotheque-sync.php`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documents,
          groups,
          userId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Échec de la synchronisation');
      }
      
      setLastSynced(new Date());
      setSyncFailed(false);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la synchronisation de la bibliothèque:', error);
      setSyncFailed(true);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    syncFailed,
    lastSynced,
    isOnline,
    loadFromServer,
    syncWithServer
  };
};
