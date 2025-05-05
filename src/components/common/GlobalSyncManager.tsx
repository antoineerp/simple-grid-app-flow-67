
import React, { useEffect, useState } from 'react';
import { useInterval } from '@/hooks/useInterval';
import { useToast } from '@/hooks/use-toast';
import { dataSyncManager, SyncStatus } from '@/services/sync/DataSyncManager';
import { getCurrentUser } from '@/services/auth/authService';
import { databaseHelper } from '@/services/sync/DatabaseHelper';

const SYNC_INTERVAL = 60 * 1000; // 1 minute

export const GlobalSyncManager: React.FC = () => {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Écouter les changements de statut en ligne/hors ligne
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialisation et premier chargement
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsSyncing(true);
        
        // Initialiser la base de données locale
        await databaseHelper.initDatabase();
        
        // Si en ligne, synchroniser avec le serveur
        if (isOnline) {
          await syncAll();
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Erreur d'initialisation:", error);
        setSyncFailed(true);
      } finally {
        setIsSyncing(false);
      }
    };
    
    initialize();
  }, []);

  // Vérifier l'état de synchronisation global
  useEffect(() => {
    const status = dataSyncManager.getSyncStatus();
    setSyncFailed(status === SyncStatus.Error);
  }, []);

  // Synchronisation périodique si en ligne
  useInterval(async () => {
    if (isInitialized && isOnline && !isSyncing) {
      await syncAll();
    }
  }, SYNC_INTERVAL);

  // Fonction pour synchroniser toutes les tables
  const syncAll = async () => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      setSyncFailed(false);
      
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log("Pas d'utilisateur connecté, synchronisation ignorée");
        return;
      }
      
      // Synchroniser toutes les tables avec modifications en attente
      await dataSyncManager.syncAllTables();
      
      setLastSynced(new Date());
      
      console.log("Synchronisation globale terminée");
    } catch (error) {
      console.error("Erreur de synchronisation:", error);
      setSyncFailed(true);
      
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser les données avec le serveur",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset de l'état de synchronisation et tentative de synchronisation
  const resetSyncStatus = async () => {
    try {
      await syncAll();
    } catch (error) {
      console.error("Échec de la resynchronisation:", error);
    }
  };

  return null; // Ce composant n'affiche rien, il gère seulement la synchronisation
};
