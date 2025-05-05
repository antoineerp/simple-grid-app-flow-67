
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from '@/services/auth/authService';
import { syncRepairTool } from '@/utils/syncRepairTool';
import { dataSyncManager } from '@/services/sync/DataSyncManager';

/**
 * Hook optimisé pour gérer une collection de données avec synchronisation
 * Version simplifiée et améliorée basée sur les meilleures pratiques
 */
export function useSyncedData<T>(
  tableName: string,
  initialData: T[] = [],
  loadDataFn?: (userId?: string) => Promise<T[]>,
  saveDataFn?: (data: T[], userId?: string) => Promise<boolean>
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [currentUser, setCurrentUser] = useState<string>(getCurrentUser()?.identifiant_technique || 'default');
  const { toast } = useToast();
  
  // Utiliser une référence pour éviter les synchronisations multiples
  const syncInProgressRef = useRef<boolean>(false);
  const initialLoadDoneRef = useRef<boolean>(false);
  const dataChangedRef = useRef<boolean>(false);
  
  // Fonction pour charger les données
  const loadData = useCallback(async () => {
    if (syncInProgressRef.current) {
      console.log(`useSyncedData(${tableName}): Chargement ignoré - synchronisation déjà en cours`);
      return;
    }
    
    try {
      setIsSyncing(true);
      syncInProgressRef.current = true;
      
      // Si une fonction de chargement est fournie, l'utiliser
      if (loadDataFn) {
        console.log(`useSyncedData(${tableName}): Chargement des données pour ${currentUser}`);
        const loadedData = await loadDataFn(currentUser);
        
        if (loadedData && loadedData.length > 0) {
          console.log(`useSyncedData(${tableName}): ${loadedData.length} éléments chargés`);
          setData(loadedData);
          setLastSynced(new Date());
        } else {
          console.log(`useSyncedData(${tableName}): Aucune donnée chargée ou fonction de chargement non fournie`);
        }
      } else {
        // Sinon, utiliser le DataSyncManager pour charger depuis localStorage
        const loadedData = dataSyncManager.getLocalData<T>(tableName);
        if (loadedData && loadedData.length > 0) {
          console.log(`useSyncedData(${tableName}): ${loadedData.length} éléments chargés depuis localStorage`);
          setData(loadedData);
          setLastSynced(new Date());
        }
      }
      
      initialLoadDoneRef.current = true;
    } catch (error) {
      console.error(`useSyncedData(${tableName}): Erreur lors du chargement des données`, error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Une erreur est survenue lors du chargement des données."
      });
    } finally {
      setIsSyncing(false);
      syncInProgressRef.current = false;
    }
  }, [tableName, currentUser, loadDataFn, toast]);
  
  // Fonction pour sauvegarder les données avec debounce
  const saveData = useCallback(async (newData: T[]) => {
    if (!dataChangedRef.current) {
      console.log(`useSyncedData(${tableName}): Sauvegarde ignorée - données non modifiées`);
      return;
    }
    
    if (syncInProgressRef.current) {
      console.log(`useSyncedData(${tableName}): Sauvegarde ignorée - synchronisation déjà en cours`);
      return;
    }
    
    try {
      setIsSyncing(true);
      syncInProgressRef.current = true;
      
      // Utiliser le DataSyncManager pour la sauvegarde avec debounce
      dataSyncManager.saveDataWithDebounce(tableName, newData, saveDataFn);
      
      // Mettre à jour le dernier timestamp de synchronisation
      setLastSynced(new Date());
      dataChangedRef.current = false;
      
    } catch (error) {
      console.error(`useSyncedData(${tableName}): Erreur lors de la sauvegarde des données`, error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde des données."
      });
    } finally {
      setIsSyncing(false);
      syncInProgressRef.current = false;
    }
  }, [tableName, saveDataFn, toast]);
  
  // Mise à jour des données avec marquage explicite des modifications
  const updateData = useCallback((newData: T[]) => {
    setData(newData);
    dataChangedRef.current = true;
    
    // Planifier une sauvegarde différée pour éviter de trop nombreuses synchronisations
    saveData(newData).catch(console.error);
    
    return newData;
  }, [saveData]);
  
  // Forcer le rechargement des données
  const forceReload = useCallback(async () => {
    console.log(`useSyncedData(${tableName}): Rechargement forcé des données`);
    syncInProgressRef.current = false; // Réinitialiser le verrou pour permettre le rechargement
    await loadData();
  }, [loadData, tableName]);
  
  // Réparer la synchronisation
  const repairSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      
      // Réparer l'historique de synchronisation
      await syncRepairTool.repairSyncHistory();
      
      // Vérifier et réparer les tables
      await syncRepairTool.checkAndRepairTables();
      
      // Supprimer les duplications
      await syncRepairTool.removeDuplicates();
      
      // Réinitialiser la file d'attente
      await syncRepairTool.resetSyncQueue();
      
      // Forcer le rechargement des données
      await forceReload();
      
      toast({
        title: "Synchronisation réparée",
        description: "Les problèmes de synchronisation ont été réparés et les données ont été rechargées."
      });
    } catch (error) {
      console.error(`useSyncedData(${tableName}): Erreur lors de la réparation`, error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de réparer la synchronisation. Veuillez réessayer."
      });
    } finally {
      setIsSyncing(false);
    }
  }, [forceReload, tableName, toast]);
  
  // Écouter les changements d'utilisateur
  useEffect(() => {
    const handleUserChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.user) {
        const newUser = customEvent.detail.user;
        console.log(`useSyncedData(${tableName}): Changement d'utilisateur - ${newUser}`);
        setCurrentUser(newUser);
        
        // Réinitialiser l'état
        initialLoadDoneRef.current = false;
        dataChangedRef.current = false;
        
        // Recharger les données pour le nouvel utilisateur après un court délai
        setTimeout(() => {
          forceReload().catch(console.error);
        }, 500);
      }
    };
    
    window.addEventListener('database-user-changed', handleUserChange);
    
    return () => {
      window.removeEventListener('database-user-changed', handleUserChange);
    };
  }, [forceReload, tableName]);
  
  // Surveiller l'état de la connexion
  useEffect(() => {
    const handleOnline = () => {
      console.log(`useSyncedData(${tableName}): Connexion rétablie`);
      setIsOnline(true);
      // Si les données ont été modifiées, tenter une synchronisation
      if (dataChangedRef.current) {
        saveData(data).catch(console.error);
      }
    };
    
    const handleOffline = () => {
      console.log(`useSyncedData(${tableName}): Connexion perdue`);
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [data, saveData, tableName]);
  
  // Chargement initial des données
  useEffect(() => {
    if (!initialLoadDoneRef.current) {
      console.log(`useSyncedData(${tableName}): Chargement initial des données`);
      loadData().catch(console.error);
    }
  }, [loadData, tableName]);
  
  return {
    data,
    updateData,
    isSyncing,
    isOnline,
    lastSynced,
    forceReload,
    repairSync,
    currentUser
  };
}
