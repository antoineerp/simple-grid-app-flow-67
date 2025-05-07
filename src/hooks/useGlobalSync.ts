
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { 
  AppData, 
  syncAllWithServer, 
  loadAllFromServer, 
  saveAllToStorage, 
  loadAllFromStorage,
  hasUnsyncedChanges,
  getSyncQueueStatus,
  retryFailedSyncs,
  clearFailedSyncs
} from '@/services/sync/globalSyncService';

export const useGlobalSync = () => {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [appData, setAppData] = useState<AppData>({});
  const [queueStatus, setQueueStatus] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    failed: 0,
    hasFailures: false
  });

  // Récupérer l'identifiant technique de l'utilisateur connecté
  const getUserId = (): string => {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) return 'default';
    
    try {
      const currentUser = JSON.parse(currentUserStr);
      // Utiliser l'identifiant technique ou l'id comme identifiant unique
      return currentUser.identifiant_technique || currentUser.id || 'default';
    } catch (e) {
      // Si ce n'est pas du JSON valide, utiliser la chaîne directement
      return currentUserStr;
    }
  };
  
  const userId = getUserId();

  // Mettre à jour le statut de la file d'attente
  const updateQueueStatus = useCallback(() => {
    const status = getSyncQueueStatus();
    setQueueStatus(status);
    return status;
  }, []);

  // Charger les données au démarrage
  useEffect(() => {
    loadData();
    
    // Écouter les mises à jour de données
    const handleDataUpdate = () => {
      setAppData(loadAllFromStorage(userId));
      updateQueueStatus();
    };
    
    window.addEventListener('globalDataUpdate', handleDataUpdate);
    
    // Vérifier périodiquement l'état de la file d'attente
    const intervalId = setInterval(() => {
      updateQueueStatus();
    }, 10000);
    
    return () => {
      window.removeEventListener('globalDataUpdate', handleDataUpdate);
      clearInterval(intervalId);
    };
  }, [userId, updateQueueStatus]);

  // Fonction pour charger les données
  const loadData = async () => {
    if (isOnline) {
      try {
        setIsSyncing(true);
        const serverData = await loadAllFromServer(userId);
        if (serverData) {
          saveAllToStorage(userId, serverData);
          setAppData(serverData);
          setLastSynced(new Date());
          updateQueueStatus();
          setIsSyncing(false);
          return;
        }
      } catch (error) {
        console.error('Erreur lors du chargement depuis le serveur:', error);
      } finally {
        setIsSyncing(false);
      }
    }
    
    // Si hors ligne ou erreur de chargement, utiliser les données locales
    const localData = loadAllFromStorage(userId);
    setAppData(localData);
    updateQueueStatus();
  };

  // Fonction pour sauvegarder les données actuelles
  const saveData = (newData: AppData) => {
    // Ajouter l'horodatage de modification
    const dataWithTimestamp = {
      ...newData,
      lastModified: Date.now()
    };
    
    saveAllToStorage(userId, dataWithTimestamp);
    setAppData(dataWithTimestamp);
    updateQueueStatus();
  };

  // Fonction pour synchroniser les données avec le serveur
  const syncWithServer = async () => {
    if (!isOnline) {
      toast({
        title: "Synchronisation impossible",
        description: "Vous êtes actuellement hors ligne",
        variant: "destructive",
      });
      return false;
    }

    setIsSyncing(true);
    
    try {
      // Récupérer les données les plus récentes du localStorage
      const currentData = loadAllFromStorage(userId);
      
      const success = await syncAllWithServer(userId, currentData);
      
      if (success) {
        const now = new Date();
        setLastSynced(now);
        toast({
          title: "Synchronisation en cours",
          description: "Les données sont en cours de synchronisation avec le serveur",
        });
        
        const status = updateQueueStatus();
        
        // Si la file d'attente est vide ou ne contient que des opérations complétées
        if (status.pending === 0 && status.processing === 0) {
          toast({
            title: "Synchronisation réussie",
            description: "Toutes les données ont été synchronisées avec le serveur",
          });
        }
        
        return true;
      } else {
        toast({
          title: "Synchronisation planifiée",
          description: "Les données seront synchronisées dès que possible",
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
      toast({
        title: "Erreur de synchronisation",
        description: `${error}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Fonction pour réessayer les synchronisations échouées
  const retryFailedOperations = () => {
    retryFailedSyncs();
    updateQueueStatus();
    toast({
      title: "Nouvelle tentative",
      description: "Les opérations échouées seront réessayées",
    });
  };
  
  // Fonction pour effacer les synchronisations échouées
  const clearFailedOperations = () => {
    clearFailedSyncs();
    updateQueueStatus();
    toast({
      title: "Nettoyage",
      description: "Les opérations échouées ont été supprimées",
    });
  };
  
  // Vérifier si des modifications sont en attente de synchronisation
  const hasUnsyncedData = lastSynced ? hasUnsyncedChanges(lastSynced, appData) : false;

  return {
    appData,
    saveData,
    syncWithServer,
    loadData,
    isSyncing,
    isOnline,
    lastSynced,
    queueStatus,
    hasUnsyncedData,
    retryFailedOperations,
    clearFailedOperations
  };
};
