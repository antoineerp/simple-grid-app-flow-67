
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
    showToasts = true, 
    autoSync = true, // Synchroniser automatiquement par défaut
    debounceTime = 5000, // 5 secondes par défaut - plus réactif
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
    // Si une syncKey est fournie, l'utiliser pour éviter les conflits
    return syncKey ? 
      `${tableName}_${syncKey}_${userId}` : 
      `${tableName}_${userId}`;
  }, [tableName, syncKey]);
  
  // Stocker les données dans localStorage et déclencher la synchronisation immédiatement si en ligne
  useEffect(() => {
    // Ne déclencher que s'il y a des données et qu'elles ont changé
    if (data.length > 0) {
      const currentDataStr = JSON.stringify(data);
      const lastDataStr = JSON.stringify(lastDataRef.current);
      
      if (currentDataStr !== lastDataStr) {
        const storageKey = getStorageKey();
        console.log(`useSyncContext: Données modifiées pour ${tableName}, sauvegarde et synchronisation`);
        
        // Sauvegarder les données localement (TOUJOURS comme sauvegarde)
        localStorage.setItem(storageKey, currentDataStr);
        setDataChanged(true);
        pendingSyncRef.current = true;
        lastDataRef.current = [...data];
        
        // Synchronisation IMMÉDIATE avec Infomaniak si en ligne
        if (autoSync && isOnline) {
          // Annuler tout timeout existant
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          // Créer un nouveau timeout avec un délai court
          timeoutRef.current = setTimeout(() => {
            if (pendingSyncRef.current && isOnline && data.length > 0) {
              console.log(`useSyncContext: Synchronisation de ${tableName} avec Infomaniak`);
              syncTable(tableName, data)
                .then(result => {
                  if (result) {
                    pendingSyncRef.current = false;
                    setDataChanged(false);
                    console.log(`useSyncContext: Synchronisation de ${tableName} avec Infomaniak réussie`);
                  } else {
                    console.warn(`useSyncContext: Échec de la synchronisation de ${tableName} avec Infomaniak`);
                  }
                })
                .catch(error => {
                  console.error(`useSyncContext: Erreur lors de la synchronisation de ${tableName} avec Infomaniak:`, error);
                });
            }
          }, debounceTime); // Délai réduit à 5 secondes par défaut pour plus de réactivité
        }
      }
    }
    
    // Nettoyage lors du démontage du composant
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
        return JSON.parse(storedData);
      }
    } catch (e) {
      console.error(`useSyncContext: Erreur lors de la lecture des données locales pour ${tableName}:`, e);
    }
    
    return [];
  }, [tableName, getStorageKey]);

  // Méthode de synchronisation adaptée pour cette table spécifique
  const syncWithServer = useCallback(async (): Promise<boolean> => {
    if (!isOnline) {
      if (showToasts) {
        toast({
          title: "Mode hors ligne",
          description: "La synchronisation avec Infomaniak n'est pas disponible en mode hors ligne. Les données sont sauvegardées localement."
        });
      }
      return false;
    }

    // Éviter les tentatives de synchronisation trop fréquentes
    const now = Date.now();
    if (now - lastSyncAttemptRef.current < 3000) {
      console.log(`useSyncContext: Tentative de synchronisation trop fréquente pour ${tableName}, ignorée`);
      return false;
    }
    
    lastSyncAttemptRef.current = now;

    // Ne pas synchroniser si pas de données à envoyer
    if (!data || data.length === 0) {
      console.log(`useSyncContext: Aucune donnée à synchroniser pour ${tableName}`);
      
      if (showToasts) {
        toast({
          title: "Aucune donnée à synchroniser",
          description: `Pas de données à envoyer pour ${tableName}`
        });
      }
      
      return true;  // Succès car rien à faire
    }

    try {
      console.log(`useSyncContext: Synchronisation de ${tableName} avec Infomaniak initiée`);
      
      // Annuler toute synchronisation différée en attente
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Synchroniser DIRECTEMENT avec Infomaniak
      const result = await syncTable(tableName, data);
      
      if (result) {
        setDataChanged(false);
        pendingSyncRef.current = false;
        console.log(`useSyncContext: Synchronisation de ${tableName} avec Infomaniak réussie`);
        
        if (showToasts) {
          toast({
            title: "Synchronisation réussie",
            description: `Les données de ${tableName} ont été synchronisées avec Infomaniak`
          });
        }
        
        // Sauvegarder les données localement (après synchronisation réussie)
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(data));
      } else {
        console.error(`useSyncContext: Échec de la synchronisation de ${tableName} avec Infomaniak`);
        
        if (showToasts) {
          toast({
            variant: "destructive",
            title: "Échec de la synchronisation",
            description: `La synchronisation de ${tableName} avec Infomaniak a échoué. Les données sont sauvegardées localement.`
          });
        }
        
        // Toujours sauvegarder localement en cas d'échec
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
      
      return result;
    } catch (error) {
      console.error(`useSyncContext: Erreur lors de la synchronisation de ${tableName} avec Infomaniak:`, error);
      
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Erreur de synchronisation",
          description: `Une erreur s'est produite lors de la synchronisation de ${tableName} avec Infomaniak. Les données sont sauvegardées localement.`
        });
      }
      
      // Toujours sauvegarder localement en cas d'erreur
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      return false;
    }
  }, [isOnline, syncTable, tableName, data, showToasts, toast, getStorageKey]);
  
  // Méthode pour notifier seulement les changements
  const notifyChanges = useCallback(() => {
    // Ne pas continuer si pas de données
    if (!data || data.length === 0) {
      return;
    }
    
    // Sauvegarder dans localStorage
    const storageKey = getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(data));
    
    // Indiquer que des changements sont en attente
    pendingSyncRef.current = true;
    setDataChanged(true);
    
    // Synchroniser IMMÉDIATEMENT avec Infomaniak si en ligne
    if (isOnline) {
      // Annuler tout timeout existant
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Créer un nouveau timeout avec un délai court
      timeoutRef.current = setTimeout(() => {
        if (pendingSyncRef.current && isOnline && data.length > 0) {
          console.log(`useSyncContext: Synchronisation de ${tableName} avec Infomaniak après notification`);
          syncTable(tableName, data)
            .then(result => {
              if (result) {
                pendingSyncRef.current = false;
                setDataChanged(false);
                console.log(`useSyncContext: Synchronisation de ${tableName} avec Infomaniak réussie après notification`);
              } else {
                console.warn(`useSyncContext: Échec de la synchronisation de ${tableName} avec Infomaniak après notification`);
              }
            })
            .catch(error => {
              console.error(`useSyncContext: Erreur lors de la synchronisation de ${tableName} avec Infomaniak après notification:`, error);
            });
        }
      }, debounceTime);
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
