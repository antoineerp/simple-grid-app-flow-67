
import { useState } from 'react';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/types/documents';

interface SyncOptions<T> {
  endpoint: string;
  loadEndpoint?: string;
  data: T[];
  userId: string;
  dataName?: string;
  maxRetries?: number;
  retryDelay?: number;
}

interface LoadOptions {
  endpoint?: string;
  loadEndpoint: string;
  userId: string;
  maxRetries?: number;
  retryDelay?: number;
}

export function useSyncService() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async function syncWithServer<T>(options: SyncOptions<T>): Promise<boolean> {
    const { 
      endpoint, 
      data, 
      userId, 
      dataName = 'data',
      maxRetries = 3,
      retryDelay = 1000
    } = options;
    
    if (isSyncing) {
      console.log("SyncService: Une synchronisation est déjà en cours, nouvelle requête ignorée");
      return false;
    }
    
    console.log(`SyncService: Début de synchronisation avec ${endpoint}`);
    setIsSyncing(true);
    
    let attempt = 0;
    
    try {
      while (attempt < maxRetries) {
        try {
          console.log(`SyncService: Tentative ${attempt + 1}/${maxRetries}`);
          
          const response = await fetch(`${getApiUrl()}/${endpoint}`, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: userId,
              [dataName]: data
            })
          });
          
          if (!response.ok) {
            console.error(`SyncService: Réponse non-OK: ${response.status} ${response.statusText}`);
            throw new Error(`Erreur HTTP: ${response.status}`);
          }
          
          const result = await response.json();
          console.log(`SyncService: Réponse reçue:`, result);
          
          if (result.success === true) {
            setLastSynced(new Date());
            setSyncFailed(false);
            return true;
          } else {
            throw new Error(`Échec de la synchronisation: ${result.message || 'Raison inconnue'}`);
          }
        } catch (error) {
          attempt++;
          console.error(`SyncService: Erreur tentative ${attempt}:`, error);
          
          if (attempt >= maxRetries) {
            throw error;
          }
          
          // Attendre avant de réessayer
          await sleep(retryDelay);
        }
      }
      
      return false;
    } catch (error) {
      console.error("SyncService: Échec de synchronisation après toutes les tentatives:", error);
      setSyncFailed(true);
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Impossible de synchroniser avec le serveur",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }
  
  async function loadFromServer<T>(options: LoadOptions): Promise<T[] | null> {
    const { 
      loadEndpoint,
      userId,
      maxRetries = 3,
      retryDelay = 1000
    } = options;
    
    if (isSyncing) {
      console.log("SyncService: Un chargement est déjà en cours, nouvelle requête ignorée");
      return null;
    }
    
    console.log(`SyncService: Début de chargement depuis ${loadEndpoint}`);
    setIsSyncing(true);
    
    let attempt = 0;
    
    try {
      while (attempt < maxRetries) {
        try {
          console.log(`SyncService: Tentative de chargement ${attempt + 1}/${maxRetries}`);
          
          const apiUrl = getApiUrl();
          console.log(`SyncService: URL complète: ${apiUrl}/${loadEndpoint}?userId=${encodeURIComponent(userId)}`);
          
          const response = await fetch(`${apiUrl}/${loadEndpoint}?userId=${encodeURIComponent(userId)}`, {
            method: 'GET',
            headers: getAuthHeaders()
          });
          
          if (!response.ok) {
            console.error(`SyncService: Réponse non-OK: ${response.status} ${response.statusText}`);
            throw new Error(`Erreur HTTP: ${response.status}`);
          }
          
          // Vérifier que la réponse n'est pas vide
          const text = await response.text();
          if (!text || !text.trim()) {
            console.error("SyncService: Réponse vide du serveur");
            throw new Error("Réponse vide du serveur");
          }
          
          // Vérifier que la réponse est bien du JSON
          let result;
          try {
            result = JSON.parse(text);
          } catch (parseError) {
            console.error("SyncService: Erreur parsing JSON:", parseError);
            console.error("SyncService: Réponse brute:", text.substring(0, 500));
            throw new Error("Format de réponse invalide");
          }
          
          console.log(`SyncService: Données chargées:`, result);
          
          // Vérifier que les données sont bien présentes
          if (result.success && result.documents && Array.isArray(result.documents)) {
            setLastSynced(new Date());
            setSyncFailed(false);
            return result.documents;
          } else if (result.documents && Array.isArray(result.documents)) {
            setLastSynced(new Date());
            setSyncFailed(false);
            return result.documents;
          } else if (result.data && Array.isArray(result.data)) {
            setLastSynced(new Date());
            setSyncFailed(false);
            return result.data;
          } else if (Array.isArray(result)) {
            setLastSynced(new Date());
            setSyncFailed(false);
            return result;
          } else {
            console.error("SyncService: Format de données inattendu:", result);
            throw new Error("Format de données inattendu");
          }
        } catch (error) {
          attempt++;
          console.error(`SyncService: Erreur chargement tentative ${attempt}:`, error);
          
          if (attempt >= maxRetries) {
            throw error;
          }
          
          // Attendre avant de réessayer
          await sleep(retryDelay);
        }
      }
      
      return null;
    } catch (error) {
      console.error("SyncService: Échec de chargement après toutes les tentatives:", error);
      setSyncFailed(true);
      
      // Ne pas afficher de toast pour les erreurs de chargement si ce n'est pas la première fois
      if (!lastSynced) {
        toast({
          title: "Erreur de chargement",
          description: error instanceof Error ? error.message : "Impossible de charger les données du serveur",
          variant: "destructive"
        });
      }
      
      return null;
    } finally {
      setIsSyncing(false);
    }
  }
  
  const resetSyncStatus = () => {
    setSyncFailed(false);
  };

  return {
    syncWithServer,
    loadFromServer,
    isSyncing,
    syncFailed,
    lastSynced,
    resetSyncStatus
  };
}
