
import { useCallback, useEffect, useState, useRef } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { useToast } from "@/hooks/use-toast";
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
  const unmountingRef = useRef<boolean>(false);

  // Mettre à jour la référence des données au montage et marquer le composant comme monté
  useEffect(() => {
    mountedRef.current = true;
    unmountingRef.current = false;
    
    if (data && data.length > 0) {
      lastDataRef.current = JSON.parse(JSON.stringify(data));
    }
    
    return () => {
      // Marquer le démontage avant de nettoyer
      unmountingRef.current = true;
      mountedRef.current = false;
      
      // Nettoyer les timeouts au démontage
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
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
  
  // Fonction pour synchroniser les données
  const syncWithServer = useCallback(async () => {
    if (!mountedRef.current || unmountingRef.current) {
      console.log(`useSyncContext: Synchronisation annulée pour ${tableName} - composant démonté`);
      return false;
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log(`useSyncContext: Pas de données à synchroniser pour ${tableName}`);
      return false;
    }

    if (syncInProgressRef.current || checkSyncInProgress()) {
      console.log(`useSyncContext: Synchronisation déjà en cours pour ${tableName}, requête ignorée`);
      pendingSyncRef.current = true;
      return false;
    }

    // Générer un nouvel identifiant d'opération
    operationIdRef.current = `${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const operationId = operationIdRef.current;
    
    console.log(`useSyncContext: Début synchronisation ${tableName} (opération ${operationId})`);
    
    try {
      syncInProgressRef.current = true;
      localStorage.setItem(`sync_in_progress_${tableName}`, 'true');
      localStorage.setItem(`sync_lock_time_${tableName}`, Date.now().toString());
      
      lastSyncAttemptRef.current = Date.now();
      
      // Sauvegarder localement avant même de tenter la synchronisation
      try {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (e) {
        console.error(`useSyncContext: Erreur de sauvegarde locale pour ${tableName}:`, e);
      }
      
      const success = await syncTable(tableName, data, operationId);
      
      if (!mountedRef.current || unmountingRef.current) {
        console.log(`useSyncContext: Synchronisation terminée pour ${tableName} mais composant démonté - résultat ignoré`);
        return false;
      }
      
      if (success) {
        console.log(`useSyncContext: Synchronisation réussie pour ${tableName} (opération ${operationId})`);
        syncRetryCountRef.current = 0;
        pendingSyncRef.current = false;
        
        if (showToasts) {
          toast({
            title: "Synchronisation réussie",
            description: `Les données "${tableName}" ont été synchronisées`,
            duration: 3000
          });
        }
      } else {
        // Échec de la synchronisation
        syncRetryCountRef.current++;
        console.error(`useSyncContext: Échec synchronisation de ${tableName} (opération ${operationId})`);
        
        pendingSyncRef.current = true;
        
        if (showToasts && syncRetryCountRef.current > 1) {
          toast({
            title: "Erreur de synchronisation",
            description: `Les données "${tableName}" n'ont pas pu être synchronisées`,
            variant: "destructive",
            duration: 5000
          });
        }
        
        // Planifier un nouvel essai automatique après délai croissant mais uniquement si
        // nous sommes toujours le composant actif et en ligne
        if (syncRetryCountRef.current < maxRetries && isOnline && mountedRef.current && !unmountingRef.current) {
          const retryDelay = Math.min(2000 * Math.pow(2, syncRetryCountRef.current - 1), 30000);
          
          console.log(`useSyncContext: Nouvel essai pour ${tableName} dans ${retryDelay}ms (essai ${syncRetryCountRef.current}/${maxRetries})`);
          
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          timeoutRef.current = setTimeout(() => {
            if (mountedRef.current && !unmountingRef.current && pendingSyncRef.current) {
              console.log(`useSyncContext: Tentative de re-synchronisation pour ${tableName}`);
              syncWithServer().catch(error => {
                console.error(`useSyncContext: Erreur lors de la re-synchronisation pour ${tableName}:`, error);
              });
            }
          }, retryDelay);
        }
      }
      
      return success;
    } catch (error) {
      if (!mountedRef.current || unmountingRef.current) return false;
      
      console.error(`useSyncContext: Erreur lors de la synchronisation de ${tableName}:`, error);
      pendingSyncRef.current = true;
      
      if (showToasts) {
        toast({
          title: "Erreur de synchronisation",
          description: `Erreur lors de la synchronisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          variant: "destructive",
          duration: 5000
        });
      }
      
      return false;
    } finally {
      if (mountedRef.current) {
        syncInProgressRef.current = false;
      }
      
      // Toujours nettoyer le verrou, même en cas d'erreur
      localStorage.removeItem(`sync_in_progress_${tableName}`);
      localStorage.removeItem(`sync_lock_time_${tableName}`);
    }
  }, [tableName, data, isOnline, syncTable, getStorageKey, checkSyncInProgress, showToasts, toast]);
  
  // Fonction pour notifier des changements de données
  const notifyChanges = useCallback(() => {
    if (!mountedRef.current || unmountingRef.current) return;
    
    // Marquer comme modifié
    setDataChanged(true);
    pendingSyncRef.current = true;
    
    // Annuler tout délai précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Sauvegarder localement immédiatement
    try {
      if (data && Array.isArray(data) && data.length > 0) {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(data));
        console.log(`useSyncContext: Sauvegarde locale des données ${tableName} suite à modification`);
      }
    } catch (e) {
      console.error(`useSyncContext: Erreur de sauvegarde locale pour ${tableName}:`, e);
    }
    
    // Si la synchronisation automatique est activée, lancer avec délai
    if (autoSync && isOnline) {
      const now = Date.now();
      
      // Éviter les synchronisations trop fréquentes
      if (now - lastSyncAttemptRef.current < 1000) {
        console.log(`useSyncContext: Synchronisations trop fréquentes pour ${tableName}, utilisation du délai complet`);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current && !unmountingRef.current) {
          syncWithServer().catch(error => {
            console.error(`useSyncContext: Erreur lors de la synchronisation automatique pour ${tableName}:`, error);
          });
        }
      }, debounceTime);
    } else {
      console.log(`useSyncContext: Synchronisation automatique désactivée pour ${tableName} ou hors ligne`);
    }
  }, [data, isOnline, autoSync, debounceTime, syncWithServer, getStorageKey, tableName]);

  // Mettre à jour les données actuelles si elles ont changé
  useEffect(() => {
    if (data && data.length > 0) {
      try {
        // Sauvegarder une copie pour comparaison
        const lastData = lastDataRef.current || [];
        const lastJson = JSON.stringify(lastData);
        const currentJson = JSON.stringify(data);
        
        // Si les données ont vraiment changé, mettre à jour la référence
        if (lastJson !== currentJson) {
          lastDataRef.current = JSON.parse(currentJson);
          
          // Si le composant est monté depuis au moins 500ms (éviter les syncs initiales inutiles)
          // et que l'autoSync est activé, notifier des changements
          if (autoSync) {
            console.log(`useSyncContext: Données ${tableName} modifiées, planification synchronisation`);
            notifyChanges();
          }
        }
      } catch (e) {
        console.error(`useSyncContext: Erreur lors de la comparaison des données pour ${tableName}:`, e);
      }
    }
  }, [data, tableName, notifyChanges, autoSync]);

  return {
    syncWithServer,
    notifyChanges,
    syncState,
    isOnline,
    dataChanged,
    pendingSync: pendingSyncRef.current
  };
}
