import { useCallback, useEffect, useState, useRef } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { SyncHookOptions, SyncOperationResult } from '../types/syncTypes';
import { checkSyncInProgress, acquireLock, releaseLock } from '../utils/syncLockManager';
import { hasAuthenticationError } from '../utils/errorLogger';
import { getStorageKey, saveLocalData } from '../utils/syncStorageManager';
import { executeSyncOperation, isSynchronizing, cancelPendingSynchronizations } from '../utils/syncOperations';

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
    syncKey = '',
    maxRetries = 3,
    hideIndicators = true  // Par défaut, on cache les indicateurs
  } = options;
  
  const [dataChanged, setDataChanged] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Références pour la synchronisation différée
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSyncRef = useRef<boolean>(false);
  const lastDataRef = useRef<T[]>([]);
  const lastSyncAttemptRef = useRef<number>(0);
  const syncInProgressRef = useRef<boolean>(false);
  const syncRetryCountRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(false);
  const unmountingRef = useRef<boolean>(false);
  const authErrorShownRef = useRef<boolean>(false);
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const operationIdRef = useRef<string>(`${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Obtenir l'état de synchronisation pour cette table
  const syncState = syncStates[tableName] || {
    isSyncing: false,
    lastSynced: null,
    syncFailed: false
  };

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
      
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
        lockTimeoutRef.current = null;
      }
      
      // Annuler les synchronisations en cours pour éviter les fuites
      if (syncInProgressRef.current) {
        try {
          cancelPendingSynchronizations(tableName);
        } catch (e) {
          console.error(`useSyncContext: Erreur lors de l'annulation des synchronisations pour ${tableName}:`, e);
        }
      }
      
      // Libérer les verrous au démontage
      try {
        releaseLock(tableName);
      } catch (e) {
        console.error(`useSyncContext: Erreur lors du nettoyage des verrous pour ${tableName}:`, e);
      }
      
      // Si une synchronisation est en attente, sauvegarder les données localement
      if (pendingSyncRef.current && data && data.length > 0) {
        try {
          saveLocalData(tableName, data, syncKey);
          console.log(`useSyncContext: Sauvegarde des données en attente pour ${tableName} avant démontage`);
        } catch (e) {
          console.error(`useSyncContext: Erreur de sauvegarde avant démontage pour ${tableName}:`, e);
        }
      }
    };
  }, []);
  
  // Nouvelle fonction pour récupérer les erreurs et réinitialiser l'état
  const resetSyncState = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    syncInProgressRef.current = false;
    setIsSyncing(false);
    
    // Libérer les verrous potentiellement bloqués
    releaseLock(tableName);
  }, [tableName]);
  
  // Fonction pour synchroniser les données - utilise maintenant la file d'attente
  const syncWithServer = useCallback(async (): Promise<boolean> => {
    if (!mountedRef.current || unmountingRef.current) {
      console.log(`useSyncContext: Synchronisation annulée pour ${tableName} - composant démonté`);
      return false;
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log(`useSyncContext: Pas de données à synchroniser pour ${tableName}`);
      return false;
    }

    // Si une synchronisation est déjà en cours pour cette table, ne pas en lancer une autre
    if (isSynchronizing(tableName)) {
      console.log(`useSyncContext: Synchronisation déjà en file d'attente pour ${tableName}, requête ignorée`);
      pendingSyncRef.current = true;
      return false;
    }

    // Set local syncing state
    syncInProgressRef.current = true;
    setIsSyncing(true);

    // Générer un nouvel identifiant d'opération
    operationIdRef.current = `${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const operationId = operationIdRef.current;
    
    console.log(`useSyncContext: Début synchronisation ${tableName} (opération ${operationId})`);
    
    try {
      lastSyncAttemptRef.current = Date.now();
      
      // Sauvegarder localement avant tout pour éviter la perte de données
      saveLocalData(tableName, data, syncKey);
      
      // Exécuter l'opération de synchronisation via la file d'attente
      const result = await executeSyncOperation(
        tableName,
        data,
        syncTable,
        syncKey,
        "manual"
      );
      
      if (!mountedRef.current || unmountingRef.current) {
        console.log(`useSyncContext: Synchronisation terminée pour ${tableName} mais composant démonté - résultat ignoré`);
        syncInProgressRef.current = false;
        setIsSyncing(false);
        
        return false;
      }
      
      if (result.success) {
        console.log(`useSyncContext: Synchronisation réussie pour ${tableName} (opération ${operationId})`);
        syncRetryCountRef.current = 0;
        pendingSyncRef.current = false;
        authErrorShownRef.current = false;
        
        // N'afficher les toasts que si explicitement demandé et que hideIndicators est false
        if (showToasts && !hideIndicators) {
          toast({
            title: "Synchronisation réussie",
            description: `Les données "${tableName}" ont été synchronisées`,
            duration: 3000
          });
        }
        
        return true;
      } else {
        // Échec de la synchronisation
        syncRetryCountRef.current++;
        console.error(`useSyncContext: Échec synchronisation de ${tableName} (opération ${operationId})`);
        
        pendingSyncRef.current = true;
        
        // Afficher un toast d'erreur seulement si les indicateurs ne sont pas cachés
        if (showToasts && !hideIndicators && syncRetryCountRef.current > 1 && !authErrorShownRef.current) {
          // Vérifier si c'est une erreur d'authentification dans les logs récents
          const isAuthError = hasAuthenticationError();
          
          if (isAuthError) {
            authErrorShownRef.current = true;
            toast({
              title: "Erreur d'authentification",
              description: "Vous devez vous reconnecter pour accéder à cette fonctionnalité",
              variant: "destructive",
              duration: 5000
            });
          } else {
            toast({
              title: "Erreur de synchronisation",
              description: `Les données "${tableName}" n'ont pas pu être synchronisées`,
              variant: "destructive",
              duration: 5000
            });
          }
        }
        
        // Planifier un nouvel essai automatique avec délai croissant
        // mais uniquement si nous sommes toujours le composant actif et en ligne
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
                resetSyncState();
              });
            }
          }, retryDelay);
        } else {
          // Réinitialiser l'état de synchronisation
          syncInProgressRef.current = false;
          setIsSyncing(false);
        }
        
        return false;
      }
    } catch (error) {
      console.error(`useSyncContext: Erreur lors de la synchronisation de ${tableName}:`, error);
      pendingSyncRef.current = true;
      
      // Réinitialiser l'état de synchronisation
      resetSyncState();
      
      // Vérifier si c'est une erreur d'authentification
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isAuthError = errorMessage.includes('authentifi') || 
                        errorMessage.includes('auth') || 
                        errorMessage.includes('token') || 
                        errorMessage.includes('permission');
      
      // N'afficher les toasts que si les indicateurs ne sont pas cachés
      if (isAuthError && !authErrorShownRef.current && !hideIndicators) {
        authErrorShownRef.current = true;
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez vous reconnecter pour accéder à cette fonctionnalité",
          variant: "destructive",
          duration: 5000
        });
      } else if (showToasts && !isAuthError && !hideIndicators) {
        toast({
          title: "Erreur de synchronisation",
          description: `Erreur lors de la synchronisation: ${errorMessage}`,
          variant: "destructive",
          duration: 5000
        });
      }
      
      return false;
    } finally {
      syncInProgressRef.current = false;
      setIsSyncing(false);
    }
  }, [tableName, data, isOnline, syncTable, syncKey, showToasts, toast, maxRetries, resetSyncState, hideIndicators]);
  
  // Fonction pour notifier des changements de données avec délai
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
    saveLocalData(tableName, data, syncKey);
    
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
            resetSyncState();
          });
        }
      }, debounceTime);
    } else {
      console.log(`useSyncContext: Synchronisation automatique désactivée pour ${tableName} ou hors ligne`);
    }
  }, [data, isOnline, autoSync, debounceTime, syncWithServer, syncKey, tableName, resetSyncState]);

  // Mettre à jour les données actuelles si elles ont changé
  useEffect(() => {
    if (data && data.length > 0) {
      try {
        // Sauvegarder une copie pour comparaison
        const lastData = lastDataRef.current || [];
        
        // Shallow comparison of arrays is insufficient, need deep compare
        const lastDataJson = JSON.stringify(lastData);
        const currentDataJson = JSON.stringify(data);
        
        // Si les données ont vraiment changé, mettre à jour la référence
        if (lastDataJson !== currentDataJson) {
          lastDataRef.current = JSON.parse(currentDataJson);
          
          // Si le composant est monté et que l'autoSync est activé, notifier des changements
          if (mountedRef.current && autoSync) {
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
    pendingSync: pendingSyncRef.current,
    isSyncing: syncState.isSyncing || isSyncing,
    lastSynced: syncState.lastSynced,
    syncFailed: syncState.syncFailed,
    acquireLock,
    releaseLock,
    resetSyncState
  };
}
