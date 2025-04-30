
import { useCallback, useEffect, useState, useRef } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

interface SyncHookOptions {
  showToasts?: boolean;
  autoSync?: boolean; // Option pour synchroniser automatiquement au chargement
  debounceTime?: number; // Temps d'attente avant synchronisation (ms)
  syncKey?: string; // Clé unique pour éviter les conflits
}

/**
 * Hook réutilisable pour la synchronisation dans n'importe quelle page
 * qui fournit une interface cohérente pour toutes les tables
 */
export function useSyncContext<T>(tableName: string, data: T[], options: SyncHookOptions = {}) {
  const { syncTable, syncStates, isOnline } = useGlobalSync();
  const { toast } = useToast();
  const { 
    showToasts = false, // Ne pas afficher les toasts par défaut 
    autoSync = true,
    debounceTime = 2000,
    syncKey = ''
  } = options;
  const [dataChanged, setDataChanged] = useState(false);
  
  // Références pour la synchronisation différée
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSyncRef = useRef<boolean>(false);
  const lastDataRef = useRef<T[]>(data);
  const lastSyncAttemptRef = useRef<number>(0);

  // Obtenir l'état de synchronisation pour cette table
  const syncState = syncStates[tableName] || {
    isSyncing: false,
    lastSynced: null,
    syncFailed: false
  };
  
  // Générer une clé unique pour le stockage local
  const getStorageKey = useCallback(() => {
    const userId = getCurrentUser() || 'default';
    return syncKey ? 
      `${tableName}_${syncKey}_${userId}` : 
      `${tableName}_${userId}`;
  }, [tableName, syncKey]);
  
  // Stocker les données dans localStorage et déclencher la synchronisation
  useEffect(() => {
    // Ne déclencher que s'il y a des données et qu'elles ont changé
    if (data && data.length > 0) {
      try {
        const currentDataStr = JSON.stringify(data);
        const lastDataStr = JSON.stringify(lastDataRef.current);
        
        if (currentDataStr !== lastDataStr) {
          const storageKey = getStorageKey();
          console.log(`useSyncContext: Données modifiées pour ${tableName}, sauvegarde locale`);
          
          // Sauvegarder les données localement IMMÉDIATEMENT
          localStorage.setItem(storageKey, currentDataStr);
          setDataChanged(true);
          pendingSyncRef.current = true;
          lastDataRef.current = JSON.parse(JSON.stringify(data)); // Copie profonde
          
          // Synchronisation avec Infomaniak si en ligne
          if (autoSync && isOnline) {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            
            timeoutRef.current = setTimeout(() => {
              if (pendingSyncRef.current && isOnline) {
                console.log(`useSyncContext: Synchronisation de ${tableName} avec Infomaniak`);
                syncTable(tableName, data)
                  .then(result => {
                    if (result) {
                      pendingSyncRef.current = false;
                      setDataChanged(false);
                      console.log(`useSyncContext: Synchronisation de ${tableName} réussie`);
                      
                      // Resauvegarder les données synchronisées
                      localStorage.setItem(storageKey, currentDataStr);
                    } else {
                      console.warn(`useSyncContext: Échec de la synchronisation de ${tableName}`);
                    }
                  })
                  .catch(error => {
                    console.error(`useSyncContext: Erreur synchronisation de ${tableName}:`, error);
                  });
              }
            }, debounceTime);
          }
        }
      } catch (error) {
        console.error(`useSyncContext: Erreur traitement des données ${tableName}:`, error);
      }
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, tableName, autoSync, isOnline, debounceTime, syncTable, getStorageKey]);

  // Récupérer les données locales
  const loadLocalData = useCallback((): T[] => {
    try {
      const storageKey = getStorageKey();
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log(`useSyncContext: Données locales chargées pour ${tableName}:`, parsedData.length);
        return parsedData;
      }
    } catch (e) {
      console.error(`useSyncContext: Erreur lecture données locales pour ${tableName}:`, e);
    }
    
    return [];
  }, [tableName, getStorageKey]);

  // Synchroniser avec le serveur
  const syncWithServer = useCallback(async (): Promise<boolean> => {
    if (!isOnline) {
      console.log(`useSyncContext: Mode hors ligne pour ${tableName}, synchronisation impossible`);
      if (showToasts) {
        toast({
          title: "Mode hors ligne",
          description: "La synchronisation n'est pas disponible en mode hors ligne. Les données sont sauvegardées localement."
        });
      }
      return false;
    }

    // Éviter les tentatives trop fréquentes
    const now = Date.now();
    if (now - lastSyncAttemptRef.current < 2000) {
      console.log(`useSyncContext: Synchronisation trop fréquente pour ${tableName}, ignorée`);
      return false;
    }
    
    lastSyncAttemptRef.current = now;

    // Ne pas synchroniser si données vides
    if (!data || data.length === 0) {
      console.log(`useSyncContext: Aucune donnée pour ${tableName}`);
      return true;  // Succès car rien à faire
    }

    try {
      console.log(`useSyncContext: Synchronisation de ${tableName} initiée`);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Synchroniser DIRECTEMENT avec Infomaniak
      const result = await syncTable(tableName, data);
      
      if (result) {
        setDataChanged(false);
        pendingSyncRef.current = false;
        console.log(`useSyncContext: Synchronisation de ${tableName} réussie`);
        
        if (showToasts) {
          toast({
            title: "Synchronisation réussie",
            description: `Les données ont été synchronisées`
          });
        }
        
        // Sauvegarder données après synchronisation réussie
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(data));
      } else {
        console.error(`useSyncContext: Échec synchronisation de ${tableName}`);
        
        if (showToasts) {
          toast({
            variant: "destructive",
            title: "Échec de la synchronisation",
            description: `La synchronisation a échoué. Les données sont sauvegardées localement.`
          });
        }
        
        // Sauvegarder localement en cas d'échec
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
      
      return result;
    } catch (error) {
      console.error(`useSyncContext: Erreur synchronisation de ${tableName}:`, error);
      
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Erreur de synchronisation",
          description: `Une erreur s'est produite lors de la synchronisation. Les données sont sauvegardées localement.`
        });
      }
      
      // Sauvegarder localement en cas d'erreur
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      return false;
    }
  }, [isOnline, syncTable, tableName, data, showToasts, toast, getStorageKey]);
  
  // Notifier les changements
  const notifyChanges = useCallback(() => {
    if (!data || data.length === 0) {
      return;
    }
    
    try {
      // Sauvegarder dans localStorage IMMÉDIATEMENT
      const storageKey = getStorageKey();
      const dataString = JSON.stringify(data);
      localStorage.setItem(storageKey, dataString);
      
      console.log(`useSyncContext: Changements notifiés pour ${tableName}, données sauvegardées localement`);
      
      // Indiquer changements en attente
      pendingSyncRef.current = true;
      setDataChanged(true);
      
      // Synchroniser IMMÉDIATEMENT si en ligne
      if (isOnline) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          if (pendingSyncRef.current && isOnline) {
            console.log(`useSyncContext: Synchronisation après notification pour ${tableName}`);
            syncTable(tableName, data)
              .then(result => {
                if (result) {
                  pendingSyncRef.current = false;
                  setDataChanged(false);
                  console.log(`useSyncContext: Synchronisation après notification réussie pour ${tableName}`);
                  
                  // Resauvegarder après synchronisation réussie
                  localStorage.setItem(storageKey, dataString);
                }
              })
              .catch(error => {
                console.error(`useSyncContext: Erreur synchronisation après notification pour ${tableName}:`, error);
              });
          }
        }, debounceTime);
      }
    } catch (error) {
      console.error(`useSyncContext: Erreur traitement des changements pour ${tableName}:`, error);
    }
  }, [tableName, data, isOnline, debounceTime, syncTable, getStorageKey]);

  return {
    isSyncing: syncState.isSyncing,
    lastSynced: syncState.lastSynced,
    syncFailed: syncState.syncFailed,
    isOnline,
    syncWithServer,
    notifyChanges,
    dataChanged,
    loadLocalData
  };
}
