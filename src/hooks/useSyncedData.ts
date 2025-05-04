
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { syncRepairTool } from '@/utils/syncRepairTool';

/**
 * Hook pour gérer une collection de données avec synchronisation
 * Basé sur l'implémentation réussie de GestionDocumentaire.tsx
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
  const [currentUser, setCurrentUser] = useState<string>(getDatabaseConnectionCurrentUser() || 'default');
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
        // Sinon, essayer de charger depuis localStorage
        const storedData = localStorage.getItem(`${tableName}_${currentUser}`);
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            console.log(`useSyncedData(${tableName}): ${parsedData.length} éléments chargés depuis localStorage`);
            setData(parsedData);
          } catch (e) {
            console.error(`useSyncedData(${tableName}): Erreur lors du parsing des données`, e);
          }
        }
      }
      
      initialLoadDoneRef.current = true;
    } catch (error) {
      console.error(`useSyncedData(${tableName}): Erreur lors du chargement des données`, error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement des données."
      });
    } finally {
      setIsSyncing(false);
      syncInProgressRef.current = false;
    }
  }, [tableName, currentUser, loadDataFn, toast]);
  
  // Fonction pour sauvegarder les données
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
      
      // Sauvegarder localement dans tous les cas pour éviter la perte de données
      localStorage.setItem(`${tableName}_${currentUser}`, JSON.stringify(newData));
      
      // Si une fonction de sauvegarde est fournie et que nous sommes en ligne, synchroniser avec le serveur
      if (saveDataFn && isOnline) {
        console.log(`useSyncedData(${tableName}): Synchronisation avec le serveur`);
        const success = await saveDataFn(newData, currentUser);
        
        if (success) {
          console.log(`useSyncedData(${tableName}): Synchronisation réussie`);
          setLastSynced(new Date());
          dataChangedRef.current = false;
        } else {
          console.log(`useSyncedData(${tableName}): Échec de la synchronisation`);
        }
      } else {
        console.log(`useSyncedData(${tableName}): Données sauvegardées localement uniquement`);
      }
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
  }, [tableName, currentUser, saveDataFn, isOnline, toast]);
  
  // Mise à jour des données avec marquage explicite des modifications
  const updateData = useCallback((newData: T[]) => {
    setData(newData);
    dataChangedRef.current = true;
    
    // Planifier une sauvegarde différée pour éviter de trop nombreuses synchronisations
    const timer = setTimeout(() => {
      saveData(newData).catch(console.error);
    }, 2000);
    
    return () => clearTimeout(timer);
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
        console.log(`useSyncedData(${tableName}): Tentative de synchronisation après reconnexion`);
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
