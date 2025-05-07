
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { 
  AppData, 
  syncAllWithServer, 
  loadAllFromServer, 
  saveAllToStorage, 
  loadAllFromStorage 
} from '@/services/sync/globalSyncService';

export const useGlobalSync = () => {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [appData, setAppData] = useState<AppData>({});
  const currentUser = localStorage.getItem('currentUser') || 'default';

  // Charger les données au démarrage
  useEffect(() => {
    loadData();
    
    // Écouter les mises à jour de données
    const handleDataUpdate = () => {
      setAppData(loadAllFromStorage(currentUser));
    };
    
    window.addEventListener('globalDataUpdate', handleDataUpdate);
    
    return () => {
      window.removeEventListener('globalDataUpdate', handleDataUpdate);
    };
  }, [currentUser]);

  // Fonction pour charger les données
  const loadData = async () => {
    if (isOnline) {
      try {
        const serverData = await loadAllFromServer(currentUser);
        if (serverData) {
          saveAllToStorage(currentUser, serverData);
          setAppData(serverData);
          setLastSynced(new Date());
          return;
        }
      } catch (error) {
        console.error('Erreur lors du chargement depuis le serveur:', error);
      }
    }
    
    // Si hors ligne ou erreur de chargement, utiliser les données locales
    const localData = loadAllFromStorage(currentUser);
    setAppData(localData);
  };

  // Fonction pour sauvegarder les données actuelles
  const saveData = (newData: AppData) => {
    saveAllToStorage(currentUser, newData);
    setAppData(newData);
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
      const currentData = loadAllFromStorage(currentUser);
      
      const success = await syncAllWithServer(currentUser, currentData);
      
      if (success) {
        toast({
          title: "Synchronisation réussie",
          description: "Toutes les données ont été synchronisées avec le serveur",
        });
        setLastSynced(new Date());
        return true;
      } else {
        toast({
          title: "Échec de la synchronisation",
          description: "Une erreur est survenue lors de la synchronisation",
          variant: "destructive",
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

  return {
    appData,
    saveData,
    syncWithServer,
    loadData,
    isSyncing,
    isOnline,
    lastSynced
  };
};
