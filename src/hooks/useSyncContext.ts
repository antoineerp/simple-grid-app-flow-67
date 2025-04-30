
import { useCallback, useEffect, useState, useRef } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

interface SyncHookOptions {
  showToasts?: boolean;
  autoSync?: boolean; 
  debounceTime?: number;
  syncKey?: string;
}

/**
 * Hook réutilisable pour la synchronisation dans n'importe quelle page
 * qui fournit une interface cohérente pour toutes les tables
 */
export function useSyncContext<T>(tableName: string, data: T[], options: SyncHookOptions = {}) {
  const { syncTable, syncStates, isOnline } = useGlobalSync();
  const { toast } = useToast();
  const { 
    showToasts = false, 
    autoSync = true,
    debounceTime = 2000,
    syncKey = ''
  } = options;
  const [dataChanged, setDataChanged] = useState(false);
  
  // Références pour la synchronisation différée
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSyncRef = useRef<boolean>(false);
  const lastDataRef = useRef<T[]>([]);
  const lastSyncAttemptRef = useRef<number>(0);
  const syncInProgressRef = useRef<boolean>(false);
  const syncRetryCountRef = useRef<number>(0);
  const maxRetries = 3;
  const mountedRef = useRef<boolean>(false);

  // Mettre à jour la référence des données au montage et marquer le composant comme monté
  useEffect(() => {
    mountedRef.current = true;
    
    if (data && data.length > 0) {
      lastDataRef.current = JSON.parse(JSON.stringify(data));
    }
    
    return () => {
      mountedRef.current = false;
      
      // Nettoyer les timeouts au démontage
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Si une synchronisation est en attente, sauvegarder les données localement
      if (pendingSyncRef.current && data && data.length > 0) {
        try {
          const storageKey = getStorageKey();
          localStorage.setItem(storageKey, JSON.stringify(data));
          console.log(`useSyncContext: Sauvegarde des données en attente pour ${tableName} avant démontage`);
        } catch (e) {
          console.error(`useSyncContext: Erreur de sauvegarde avant démontage pour ${tableName}:`, e);
        }
      }
    };
  }, []);

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
    try {
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
    } catch (error) {
      console.error(`useSyncContext: Erreur lors de la vérification du verrou pour ${tableName}:`, error);
      return false; // En cas d'erreur, supposer qu'aucune synchronisation n'est en cours
    }
  }, [tableName]);
  
  // Stocker les données dans localStorage et déclencher la synchronisation
  useEffect(() => {
    if (!data || !Array.isArray(data)) {
      console.log(`useSyncContext: Données invalides pour ${tableName}, synchronisation ignorée`);
      return;
    }
    
    // Ne pas exécuter si le composant est démonté
    if (!mountedRef.current) {
      return;
    }
    
    // Ne déclencher que s'il y a des données et qu'elles ont changé
    if (data && data.length > 0) {
      try {
        // Utiliser JSON.stringify avec try/catch pour éviter les erreurs
        let currentDataStr;
        let lastDataStr;
        
        try {
          currentDataStr = JSON.stringify(data);
          lastDataStr = lastDataRef.current ? JSON.stringify(lastDataRef.current) : '';
        } catch (jsonError) {
          console.error(`useSyncContext: Erreur JSON pour ${tableName}:`, jsonError);
          return;
        }
        
        if (currentDataStr !== lastDataStr) {
          const storageKey = getStorageKey();
          console.log(`useSyncContext: Données modifiées pour ${tableName}, sauvegarde locale`);
          
          // Sauvegarder les données localement IMMÉDIATEMENT
          try {
            localStorage.setItem(storageKey, currentDataStr);
          } catch (storageError) {
            console.error(`useSyncContext: Erreur de stockage local pour ${tableName}:`, storageError);
          }
          
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
              // Vérifier si le composant est toujours monté
              if (!mountedRef.current) {
                return;
              }
              
              if (pendingSyncRef.current && isOnline && !checkSyncInProgress()) {
                const operationId = operationIdRef.current;
                
                console.log(`useSyncContext: Synchronisation de ${tableName} avec le serveur (opération ${operationId})`);
                syncInProgressRef.current = true;
                
                // Nettoyer les erreurs précédentes
                syncRetryCountRef.current = 0;
                
                // Marquer le début de la synchronisation dans le stockage local
                try {
                  localStorage.setItem(`sync_in_progress_${tableName}`, 'true');
                  localStorage.setItem(`sync_lock_time_${tableName}`, Date.now().toString());
                } catch (lockError) {
                  console.error(`useSyncContext: Erreur lors de la pose du verrou pour ${tableName}:`, lockError);
                }
                
                syncTable(tableName, data)
                  .then(result => {
                    // Vérifier que le composant est toujours monté
                    if (!mountedRef.current) {
                      // Libérer le verrou si le composant est démonté
                      try {
                        localStorage.removeItem(`sync_in_progress_${tableName}`);
                        localStorage.removeItem(`sync_lock_time_${tableName}`);
                      } catch (e) {
                        console.error(`useSyncContext: Erreur de nettoyage après démontage pour ${tableName}:`, e);
                      }
                      return;
                    }
                    
                    // Vérifier que c'est toujours notre synchronisation qui est en cours
                    if (operationIdRef.current === operationId) {
                      if (result) {
                        pendingSyncRef.current = false;
                        setDataChanged(false);
                        console.log(`useSyncContext: Synchronisation de ${tableName} réussie (opération ${operationId})`);
                        
                        // Resauvegarder les données synchronisées
                        try {
                          localStorage.setItem(storageKey, currentDataStr);
                        } catch (e) {
                          console.error(`useSyncContext: Erreur de sauvegarde après synchronisation pour ${tableName}:`, e);
                        }
                      } else {
                        console.warn(`useSyncContext: Échec de la synchronisation de ${tableName} (opération ${operationId})`);
                        // Comptabiliser cette tentative
                        syncRetryCountRef.current++;
                        
                        // Retenter si le nombre maximum de tentatives n'est pas atteint
                        if (syncRetryCountRef.current < maxRetries) {
                          console.log(`useSyncContext: Nouvelle tentative planifiée pour ${tableName} (${syncRetryCountRef.current}/${maxRetries})`);
                          pendingSyncRef.current = true; // Garder en attente pour réessayer plus tard
                        }
                      }
                    } else {
                      console.log(`useSyncContext: Opération de synchronisation ${operationId} annulée, remplacée par ${operationIdRef.current}`);
                    }
                  })
                  .catch(error => {
                    if (!mountedRef.current) return;
                    
                    console.error(`useSyncContext: Erreur synchronisation de ${tableName}:`, error);
                    syncRetryCountRef.current++;
                  })
                  .finally(() => {
                    syncInProgressRef.current = false;
                    // Nettoyer les marqueurs de synchronisation
                    try {
                      localStorage.removeItem(`sync_in_progress_${tableName}`);
                      localStorage.removeItem(`sync_lock_time_${tableName}`);
                    } catch (cleanupError) {
                      console.error(`useSyncContext: Erreur lors du nettoyage du verrou pour ${tableName}:`, cleanupError);
                    }
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
        try {
          const parsedData = JSON.parse(storedData);
          console.log(`useSyncContext: Données locales chargées pour ${tableName}:`, parsedData.length);
          return parsedData;
        } catch (jsonError) {
          console.error(`useSyncContext: Erreur parsing données locales pour ${tableName}:`, jsonError);
        }
      }
    } catch (e) {
      console.error(`useSyncContext: Erreur lecture données locales pour ${tableName}:`, e);
    }
    
    return [];
  }, [tableName, getStorageKey]);

  // Synchroniser avec le serveur
  const syncWithServer = useCallback(async (): Promise<boolean> => {
    if (!mountedRef.current) {
      console.log(`useSyncContext: Composant démonté, synchronisation annulée pour ${tableName}`);
      return false;
    }
    
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

    // Vérifier que les données sont valides
    if (!data || !Array.isArray(data)) {
      console.log(`useSyncContext: Données invalides pour ${tableName}`);
      return false;
    }

    // Ne pas synchroniser si données vides
    if (data.length === 0) {
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
      try {
        localStorage.setItem(`sync_in_progress_${tableName}`, 'true');
        localStorage.setItem(`sync_lock_time_${tableName}`, Date.now().toString());
      } catch (lockError) {
        console.error(`useSyncContext: Erreur lors de la pose du verrou pour ${tableName}:`, lockError);
      }
      
      // Synchroniser DIRECTEMENT avec le serveur
      const result = await syncTable(tableName, data);
      
      // Vérifier si le composant est toujours monté
      if (!mountedRef.current) {
        console.log(`useSyncContext: Composant démonté pendant la synchronisation de ${tableName}, nettoyage des verrous`);
        // Nettoyer les verrous même si le composant est démonté
        try {
          localStorage.removeItem(`sync_in_progress_${tableName}`);
          localStorage.removeItem(`sync_lock_time_${tableName}`);
        } catch (e) {
          console.error(`useSyncContext: Erreur de nettoyage après démontage pour ${tableName}:`, e);
        }
        return false;
      }
      
      // Vérifier que c'est toujours notre synchronisation qui est en cours
      if (operationIdRef.current === operationId) {
        if (result) {
          setDataChanged(false);
          pendingSyncRef.current = false;
          syncRetryCountRef.current = 0;
          console.log(`useSyncContext: Synchronisation de ${tableName} réussie (opération ${operationId})`);
          
          if (showToasts) {
            toast({
              title: "Synchronisation réussie",
              description: `Les données ont été synchronisées`
            });
          }
          
          // Sauvegarder données après synchronisation réussie
          const storageKey = getStorageKey();
          try {
            localStorage.setItem(storageKey, JSON.stringify(data));
          } catch (storageError) {
            console.error(`useSyncContext: Erreur de stockage après synchronisation réussie pour ${tableName}:`, storageError);
          }
        } else {
          console.error(`useSyncContext: Échec synchronisation de ${tableName} (opération ${operationId})`);
          syncRetryCountRef.current++;
          
          if (showToasts) {
            toast({
              variant: "destructive",
              title: "Échec de la synchronisation",
              description: `La synchronisation a échoué. Les données sont sauvegardées localement.`
            });
          }
          
          // Sauvegarder localement en cas d'échec
          try {
            const storageKey = getStorageKey();
            localStorage.setItem(storageKey, JSON.stringify(data));
          } catch (storageError) {
            console.error(`useSyncContext: Erreur de stockage après échec de synchronisation pour ${tableName}:`, storageError);
          }
        }
      } else {
        console.log(`useSyncContext: Opération de synchronisation ${operationId} annulée, remplacée par ${operationIdRef.current}`);
      }
      
      return result;
    } catch (error) {
      // Vérifier si le composant est toujours monté
      if (!mountedRef.current) {
        console.log(`useSyncContext: Composant démonté pendant la gestion d'erreur pour ${tableName}`);
        // Nettoyer les verrous même en cas d'erreur
        try {
          localStorage.removeItem(`sync_in_progress_${tableName}`);
          localStorage.removeItem(`sync_lock_time_${tableName}`);
        } catch (e) {
          console.error(`useSyncContext: Erreur de nettoyage après erreur et démontage pour ${tableName}:`, e);
        }
        return false;
      }
      
      console.error(`useSyncContext: Erreur synchronisation de ${tableName}:`, error);
      syncRetryCountRef.current++;
      
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Erreur de synchronisation",
          description: `Une erreur s'est produite lors de la synchronisation. Les données sont sauvegardées localement.`
        });
      }
      
      // Sauvegarder localement en cas d'erreur
      try {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (storageError) {
        console.error(`useSyncContext: Erreur de stockage après erreur de synchronisation pour ${tableName}:`, storageError);
      }
      
      return false;
    } finally {
      // Nettoyer les marqueurs de synchronisation
      try {
        localStorage.removeItem(`sync_in_progress_${tableName}`);
        localStorage.removeItem(`sync_lock_time_${tableName}`);
      } catch (cleanupError) {
        console.error(`useSyncContext: Erreur lors du nettoyage du verrou pour ${tableName}:`, cleanupError);
      }
      syncInProgressRef.current = false;
    }
  }, [isOnline, syncTable, tableName, data, showToasts, toast, getStorageKey, checkSyncInProgress]);
  
  // Notifier les changements avec mécanisme anti-rebond optimisé
  const notifyChanges = useCallback(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log(`useSyncContext: Données invalides pour notifyChanges (${tableName}), ignoré`);
      return;
    }
    
    try {
      // Générer un ID pour cette notification
      const notificationId = `${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Sauvegarder dans localStorage IMMÉDIATEMENT
      const storageKey = getStorageKey();
      let dataString;
      
      try {
        dataString = JSON.stringify(data);
        localStorage.setItem(storageKey, dataString);
      } catch (storageError) {
        console.error(`useSyncContext: Erreur de stockage pour notifyChanges (${tableName}):`, storageError);
        return;
      }
      
      console.log(`useSyncContext: Changements notifiés pour ${tableName}, données sauvegardées localement (notification ${notificationId})`);
      
      // Enregistrer cette notification pour éviter les doublons
      let lastNotificationTime;
      try {
        lastNotificationTime = localStorage.getItem(`last_notification_time_${tableName}`);
      } catch (storageError) {
        console.error(`useSyncContext: Erreur de lecture de la dernière notification pour ${tableName}:`, storageError);
      }
      
      const now = Date.now();
      
      // Vérifier si une notification similaire a été déclenchée récemment (moins de 2 secondes)
      if (lastNotificationTime && now - parseInt(lastNotificationTime, 10) < 2000) {
        console.log(`useSyncContext: Notification similaire récente pour ${tableName}, regroupement des modifications`);
        
        // Mettre à jour l'heure de la dernière notification
        try {
          localStorage.setItem(`last_notification_time_${tableName}`, now.toString());
        } catch (storageError) {
          console.error(`useSyncContext: Erreur de mise à jour du temps de notification pour ${tableName}:`, storageError);
        }
        
        // Indiquer changements en attente mais ne pas lancer de nouvelle synchronisation
        pendingSyncRef.current = true;
        setDataChanged(true);
        return;
      }
      
      // Enregistrer cette notification
      try {
        localStorage.setItem(`last_notification_time_${tableName}`, now.toString());
      } catch (storageError) {
        console.error(`useSyncContext: Erreur d'enregistrement du temps de notification pour ${tableName}:`, storageError);
      }
      
      // Indiquer changements en attente
      pendingSyncRef.current = true;
      setDataChanged(true);
      
      // Synchroniser après un délai si en ligne et pas déjà en cours de synchronisation
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
            syncRetryCountRef.current = 0;
            
            // Marquer le début de la synchronisation dans le stockage local
            try {
              localStorage.setItem(`sync_in_progress_${tableName}`, 'true');
              localStorage.setItem(`sync_lock_time_${tableName}`, Date.now().toString());
            } catch (lockError) {
              console.error(`useSyncContext: Erreur lors de la pose du verrou pour ${tableName}:`, lockError);
            }
            
            syncTable(tableName, data)
              .then(result => {
                // Vérifier que c'est toujours notre synchronisation qui est en cours
                if (operationIdRef.current === operationId) {
                  if (result) {
                    pendingSyncRef.current = false;
                    setDataChanged(false);
                    console.log(`useSyncContext: Synchronisation après notification réussie pour ${tableName} (opération ${operationId})`);
                    
                    // Resauvegarder après synchronisation réussie
                    try {
                      localStorage.setItem(storageKey, dataString);
                    } catch (storageError) {
                      console.error(`useSyncContext: Erreur de sauvegarde après synchronisation pour ${tableName}:`, storageError);
                    }
                  } else {
                    console.warn(`useSyncContext: Échec de la synchronisation après notification pour ${tableName} (opération ${operationId})`);
                    syncRetryCountRef.current++;
                  }
                } else {
                  console.log(`useSyncContext: Opération de synchronisation ${operationId} annulée, remplacée par ${operationIdRef.current}`);
                }
              })
              .catch(error => {
                console.error(`useSyncContext: Erreur synchronisation après notification pour ${tableName}:`, error);
                syncRetryCountRef.current++;
              })
              .finally(() => {
                syncInProgressRef.current = false;
                // Nettoyer les marqueurs de synchronisation
                try {
                  localStorage.removeItem(`sync_in_progress_${tableName}`);
                  localStorage.removeItem(`sync_lock_time_${tableName}`);
                } catch (cleanupError) {
                  console.error(`useSyncContext: Erreur lors du nettoyage du verrou pour ${tableName}:`, cleanupError);
                }
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
    loadLocalData
  };
}
