
import { useCallback, useEffect, useState, useRef } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { useToast } from '@/hooks/use-toast';
import { triggerSync } from '@/services/sync/triggerSync';
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
  const { syncStates, syncTable, isOnline } = useGlobalSync();
  const { toast } = useToast();
  const { 
    showToasts = true, 
    autoSync = false, 
    debounceTime = 10000, // 10 secondes par défaut
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
  
  // Stocker les données dans localStorage et déclencher la synchronisation différée
  useEffect(() => {
    // Ne déclencher que s'il y a des données et qu'elles ont changé
    if (data.length > 0) {
      const currentDataStr = JSON.stringify(data);
      const lastDataStr = JSON.stringify(lastDataRef.current);
      
      if (currentDataStr !== lastDataStr) {
        const storageKey = getStorageKey();
        console.log(`Données modifiées pour ${tableName}, sauvegarde locale avec clé ${storageKey}`);
        
        // Sauvegarder les données localement
        localStorage.setItem(storageKey, currentDataStr);
        setDataChanged(true);
        pendingSyncRef.current = true;
        lastDataRef.current = [...data];
        
        // Si autoSync est activé, planifier une synchronisation différée
        if (autoSync && isOnline) {
          // Annuler tout timeout existant
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          console.log(`Programmation de synchronisation différée pour ${tableName} dans ${debounceTime}ms`);
          
          // Créer un nouveau timeout
          timeoutRef.current = setTimeout(() => {
            if (pendingSyncRef.current && isOnline && data.length > 0) {
              console.log(`Exécution de synchronisation différée pour ${tableName}`);
              syncTable(tableName, data)
                .then(result => {
                  if (result) {
                    pendingSyncRef.current = false;
                    setDataChanged(false);
                    console.log(`Synchronisation différée de ${tableName} réussie`);
                  } else {
                    console.warn(`Échec de la synchronisation différée de ${tableName}`);
                  }
                })
                .catch(error => {
                  console.error(`Erreur lors de la synchronisation différée de ${tableName}:`, error);
                });
            }
          }, debounceTime);
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
      console.error(`Erreur lors de la lecture des données locales pour ${tableName}:`, e);
    }
    
    return [];
  }, [tableName, getStorageKey]);

  // Méthode de synchronisation adaptée pour cette table spécifique
  const syncWithServer = useCallback(async (): Promise<boolean> => {
    if (!isOnline) {
      if (showToasts) {
        toast({
          title: "Mode hors ligne",
          description: "La synchronisation n'est pas disponible en mode hors ligne"
        });
      }
      return false;
    }

    // Éviter les tentatives de synchronisation trop fréquentes (au moins 3 secondes entre les tentatives)
    const now = Date.now();
    if (now - lastSyncAttemptRef.current < 3000) {
      console.log(`Tentative de synchronisation trop fréquente pour ${tableName}, ignorée`);
      return false;
    }
    
    lastSyncAttemptRef.current = now;

    // Ne pas synchroniser si pas de données à envoyer
    if (!data || data.length === 0) {
      console.log(`Aucune donnée à synchroniser pour ${tableName}`);
      
      if (showToasts) {
        toast({
          title: "Aucune donnée à synchroniser",
          description: `Pas de données à envoyer pour ${tableName}`
        });
      }
      
      return true;  // Succès car rien à faire
    }

    try {
      console.log(`Synchronisation de ${tableName} initiée avec ${data.length} éléments`);
      
      // Annuler toute synchronisation différée en attente
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Utiliser uniquement les paramètres nécessaires: tableName et data
      const result = await syncTable(tableName, data);
      
      if (result) {
        setDataChanged(false);
        pendingSyncRef.current = false;
        console.log(`Synchronisation de ${tableName} réussie`);
        
        if (showToasts) {
          toast({
            title: "Synchronisation réussie",
            description: `Les données de ${tableName} ont été synchronisées`
          });
        }
        
        // Sauvegarder les données localement avec la date de synchronisation
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(data));
        localStorage.setItem(`${storageKey}_last_sync`, new Date().toISOString());
      } else {
        console.error(`Échec de la synchronisation de ${tableName}`);
        
        if (showToasts) {
          toast({
            variant: "destructive",
            title: "Échec de la synchronisation",
            description: `La synchronisation de ${tableName} a échoué`
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${tableName}:`, error);
      
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Erreur de synchronisation",
          description: `Une erreur s'est produite lors de la synchronisation de ${tableName}`
        });
      }
      
      return false;
    }
  }, [isOnline, syncTable, tableName, data, showToasts, toast, getStorageKey]);
  
  // Méthode pour notifier seulement les changements (sauvegarde locale)
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
    
    // Si autoSync est activé, planifier une synchronisation différée
    if (autoSync && isOnline) {
      // Annuler tout timeout existant
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Créer un nouveau timeout
      timeoutRef.current = setTimeout(() => {
        if (pendingSyncRef.current && isOnline && data.length > 0) {
          console.log(`Synchronisation différée après notification de changements dans ${tableName}`);
          syncTable(tableName, data)
            .then(() => {
              pendingSyncRef.current = false;
              setDataChanged(false);
            })
            .catch(error => {
              console.error(`Erreur lors de la synchronisation différée de ${tableName}:`, error);
            });
        }
      }, debounceTime);
    }
  }, [tableName, data, autoSync, isOnline, debounceTime, syncTable, getStorageKey]);

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
