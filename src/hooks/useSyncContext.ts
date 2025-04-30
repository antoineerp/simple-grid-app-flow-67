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
  const syncInProgressRef = useRef<boolean>(false);

  // Identifiants uniques pour les opérations de synchronisation
  const operationIdRef = useRef<string>(`${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  
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
  
  // Vérifier si une synchronisation est déjà en cours pour cette table
  const checkSyncInProgress = useCallback(() => {
    const isSyncingNow = localStorage.getItem(`sync_in_progress_${tableName}`) === 'true';
    
    if (isSyncingNow) {
      // Vérifier si la synchronisation est bloquée depuis trop longtemps (plus de 30 secondes)
      const lockTimestamp = localStorage.getItem(`sync_lock_time_${tableName}`);
      
      if (lockTimestamp) {
        const lockTime = parseInt(lockTimestamp, 10);
        const now = Date.now();
        
        if (now - lockTime > 30000) { // 30 secondes
          console.log(`useSyncContext: Verrou de synchronisation expiré pour ${tableName}, libération forcée`);
          localStorage.removeItem(`sync_in_progress_${tableName}`);
          localStorage.removeItem(`sync_lock_time_${tableName}`);
          return false;
        }
      }
    }
    
    return isSyncingNow || syncInProgressRef.current;
  }, [tableName]);
  
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
          
          // Synchronisation avec Infomaniak si en ligne et pas déjà en cours de synchronisation
          if (autoSync && isOnline && !checkSyncInProgress()) {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            
            // Générer un nouvel ID d'opération pour cette synchronisation
            operationIdRef.current = `${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            
            timeoutRef.current = setTimeout(() => {
              if (pendingSyncRef.current && isOnline && !checkSyncInProgress()) {
                const operationId = operationIdRef.current;
                
                console.log(`useSyncContext: Synchronisation de ${tableName} avec Infomaniak (opération ${operationId})`);
                syncInProgressRef.current = true;
                
                syncTable(tableName, data)
                  .then(result => {
                    // Vérifier que c'est toujours notre synchronisation qui est en cours
                    if (operationIdRef.current === operationId) {
                      if (result) {
                        pendingSyncRef.current = false;
                        setDataChanged(false);
                        console.log(`useSyncContext: Synchronisation de ${tableName} réussie (opération ${operationId})`);
                        
                        // Resauvegarder les données synchronisées
                        localStorage.setItem(storageKey, currentDataStr);
                      } else {
                        console.warn(`useSyncContext: Échec de la synchronisation de ${tableName} (opération ${operationId})`);
                      }
                    } else {
                      console.log(`useSyncContext: Opération de synchronisation ${operationId} annulée, remplacée par ${operationIdRef.current}`);
                    }
                  })
                  .catch(error => {
                    console.error(`useSyncContext: Erreur synchronisation de ${tableName}:`, error);
                  })
                  .finally(() => {
                    syncInProgressRef.current = false;
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
  }, [data, tableName, autoSync, isOnline, debounceTime, syncTable, getStorageKey, checkSyncInProgress]);

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
    if (now - lastSyncAttemptRef.current < 3000) {
      console.log(`useSyncContext: Synchronisation trop fréquente pour ${tableName}, ignorée`);
      return false;
    }
    
    // Vérifier qu'aucune synchronisation n'est en cours
    if (checkSyncInProgress()) {
      console.log(`useSyncContext: Synchronisation déjà en cours pour ${tableName}, nouvelle tentative ignorée`);
      return false;
    }
    
    lastSyncAttemptRef.current = now;

    // Ne pas synchroniser si données vides
    if (!data || data.length === 0) {
      console.log(`useSyncContext: Aucune donnée pour ${tableName}`);
      return true;  // Succès car rien à faire
    }

    // Générer un nouvel ID d'opération
    operationIdRef.current = `${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const operationId = operationIdRef.current;
    
    try {
      console.log(`useSyncContext: Synchronisation de ${tableName} initiée (opération ${operationId})`);
      syncInProgressRef.current = true;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Marquer le début de la synchronisation dans le stockage local
      localStorage.setItem(`sync_in_progress_${tableName}`, 'true');
      localStorage.setItem(`sync_lock_time_${tableName}`, Date.now().toString());
      
      // Synchroniser DIRECTEMENT avec Infomaniak
      const result = await syncTable(tableName, data);
      
      // Vérifier que c'est toujours notre synchronisation qui est en cours
      if (operationIdRef.current === operationId) {
        if (result) {
          setDataChanged(false);
          pendingSyncRef.current = false;
          console.log(`useSyncContext: Synchronisation de ${tableName} réussie (opération ${operationId})`);
          
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
          console.error(`useSyncContext: Échec synchronisation de ${tableName} (opération ${operationId})`);
          
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
      } else {
        console.log(`useSyncContext: Opération de synchronisation ${operationId} annulée, remplacée par ${operationIdRef.current}`);
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
    } finally {
      // Nettoyer les marqueurs de synchronisation
      localStorage.removeItem(`sync_in_progress_${tableName}`);
      localStorage.removeItem(`sync_lock_time_${tableName}`);
      syncInProgressRef.current = false;
    }
  }, [isOnline, syncTable, tableName, data, showToasts, toast, getStorageKey, checkSyncInProgress]);
  
  // Notifier les changements avec mécanisme anti-rebond optimisé
  const notifyChanges = useCallback(() => {
    if (!data || data.length === 0) {
      return;
    }
    
    try {
      // Générer un ID pour cette notification
      const notificationId = `${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Sauvegarder dans localStorage IMMÉDIATEMENT
      const storageKey = getStorageKey();
      const dataString = JSON.stringify(data);
      localStorage.setItem(storageKey, dataString);
      
      console.log(`useSyncContext: Changements notifiés pour ${tableName}, données sauvegardées localement (notification ${notificationId})`);
      
      // Enregistrer cette notification pour éviter les doublons
      const lastNotificationTime = localStorage.getItem(`last_notification_time_${tableName}`);
      const now = Date.now();
      
      // Vérifier si une notification similaire a été déclenchée récemment (moins de 2 secondes)
      if (lastNotificationTime && now - parseInt(lastNotificationTime, 10) < 2000) {
        console.log(`useSyncContext: Notification similaire récente pour ${tableName}, regroupement des modifications`);
        
        // Mettre à jour l'heure de la dernière notification
        localStorage.setItem(`last_notification_time_${tableName}`, now.toString());
        
        // Indiquer changements en attente mais ne pas lancer de nouvelle synchronisation
        pendingSyncRef.current = true;
        setDataChanged(true);
        return;
      }
      
      // Enregistrer cette notification
      localStorage.setItem(`last_notification_time_${tableName}`, now.toString());
      
      // Indiquer changements en attente
      pendingSyncRef.current = true;
      setDataChanged(true);
      
      // Synchroniser IMMÉDIATEMENT si en ligne et pas déjà en cours de synchronisation
      if (isOnline && !checkSyncInProgress()) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Générer un nouvel ID d'opération
        operationIdRef.current = `${tableName}_${now}_${Math.random().toString(36).substring(2, 9)}`;
        const operationId = operationIdRef.current;
        
        timeoutRef.current = setTimeout(() => {
          if (pendingSyncRef.current && isOnline && !checkSyncInProgress()) {
            console.log(`useSyncContext: Synchronisation après notification pour ${tableName} (opération ${operationId})`);
            syncInProgressRef.current = true;
            
            syncTable(tableName, data)
              .then(result => {
                // Vérifier que c'est toujours notre synchronisation qui est en cours
                if (operationIdRef.current === operationId) {
                  if (result) {
                    pendingSyncRef.current = false;
                    setDataChanged(false);
                    console.log(`useSyncContext: Synchronisation après notification réussie pour ${tableName} (opération ${operationId})`);
                    
                    // Resauvegarder après synchronisation réussie
                    localStorage.setItem(storageKey, dataString);
                  } else {
                    console.warn(`useSyncContext: Échec de la synchronisation après notification pour ${tableName} (opération ${operationId})`);
                  }
                } else {
                  console.log(`useSyncContext: Opération de synchronisation ${operationId} annulée, remplacée par ${operationIdRef.current}`);
                }
              })
              .catch(error => {
                console.error(`useSyncContext: Erreur synchronisation après notification pour ${tableName}:`, error);
              })
              .finally(() => {
                syncInProgressRef.current = false;
              });
          }
        }, debounceTime);
      }
    } catch (error) {
      console.error(`useSyncContext: Erreur traitement des changements pour ${tableName}:`, error);
    }
  }, [tableName, data, isOnline, debounceTime, syncTable, getStorageKey, checkSyncInProgress]);

  return {
    isSyncing: syncState.isSyncing || syncInProgressRef.current,
    lastSynced: syncState.lastSynced,
    syncFailed: syncState.syncFailed,
    isOnline,
    syncWithServer,
    notifyChanges,
    dataChanged,
    loadLocalData: function() {
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
    }
  };
}
