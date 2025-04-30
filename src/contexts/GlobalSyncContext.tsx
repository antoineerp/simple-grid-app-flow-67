import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { triggerSync } from '@/services/sync/triggerSync';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';

interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
}

// Define the interface for sync results to match what triggerSync returns
interface SyncResult {
  success: boolean;
  message: string;
  timestamp?: string;
}

interface GlobalSyncContextType {
  // États de synchronisation par table
  syncStates: Record<string, SyncState>;
  
  // Méthode pour synchroniser une table spécifique
  syncTable: <T>(tableName: string, data: T[], operationId?: string) => Promise<boolean>;
  
  // Méthode pour synchroniser toutes les tables
  syncAll: () => Promise<Record<string, boolean>>;
  
  // Méthode pour mettre à jour l'état de synchronisation d'une table
  updateSyncState: (tableName: string, state: Partial<SyncState>) => void;
  
  // État de connexion
  isOnline: boolean;
  
  // Propriétés additionnelles nécessaires
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
}

// Création du contexte avec des valeurs par défaut
const GlobalSyncContext = createContext<GlobalSyncContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
export const useGlobalSync = () => {
  const context = useContext(GlobalSyncContext);
  if (context === undefined) {
    throw new Error("useGlobalSync doit être utilisé à l'intérieur d'un GlobalSyncProvider");
  }
  return context;
};

// Provider du contexte
export const GlobalSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncStates, setSyncStates] = useState<Record<string, SyncState>>({});
  const { isOnline, lastCheckTime } = useNetworkStatus();
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const initialSyncDoneRef = useRef<boolean>(false);
  const syncRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSyncTablesRef = useRef<Set<string>>(new Set());
  const syncOperationsRef = useRef<Record<string, string>>({});
  const syncOperationBatch = useRef(Date.now()); // Batch identifier pour regrouper les opérations
  
  // État global de synchronisation
  const [globalSyncState, setGlobalSyncState] = useState<{
    isSyncing: boolean;
    lastSynced: Date | null;
    syncFailed: boolean;
  }>({
    isSyncing: false,
    lastSynced: null,
    syncFailed: false
  });
  
  // Log le mode de synchronisation au démarrage
  useEffect(() => {
    console.log("GlobalSyncContext: Mode de synchronisation - PRIORITÉ SERVEUR");
    console.log(`GlobalSyncContext: Statut de la connexion - ${isOnline ? "En ligne" : "Hors ligne"}`);
    
    // Si la connexion change, vérifier et synchroniser
    if (isOnline && !initialSyncDoneRef.current) {
      console.log("GlobalSyncContext: Connexion établie, préparation synchronisation initiale");
      initialSyncDoneRef.current = true;
      
      // Synchronisation après un court délai pour initialisation
      setTimeout(() => {
        syncAll().catch(error => {
          console.error("GlobalSyncContext: Erreur synchronisation initiale:", error);
        });
      }, 2000);
    }
  }, [isOnline]);
  
  // Mettre à jour l'état global de synchronisation quand les états individuels changent
  useEffect(() => {
    const anyIsSyncing = Object.values(syncStates).some(state => state.isSyncing);
    const anySyncFailed = Object.values(syncStates).some(state => state.syncFailed);
    const lastSyncDates = Object.values(syncStates)
      .map(state => state.lastSynced)
      .filter(date => date !== null) as Date[];
    
    const lastSynced = lastSyncDates.length > 0
      ? new Date(Math.max(...lastSyncDates.map(d => d.getTime())))
      : null;
    
    setGlobalSyncState({
      isSyncing: anyIsSyncing,
      syncFailed: anySyncFailed,
      lastSynced
    });
  }, [syncStates]);
  
  // Écouter les événements de synchronisation forcée
  useEffect(() => {
    const handleForceSyncRequired = (event: CustomEvent) => {
      console.log("GlobalSyncContext: Événement de synchronisation forcée reçu:", event.detail);
      
      if (isOnline && event.detail && event.detail.tables && Array.isArray(event.detail.tables)) {
        // Synchroniser uniquement les tables spécifiées
        event.detail.tables.forEach((tableName: string) => {
          pendingSyncTablesRef.current.add(tableName);
        });
        
        // Créer un nouveau batch d'opérations
        syncOperationBatch.current = Date.now();
        
        // Planifier une synchronisation
        if (syncRetryTimeoutRef.current) {
          clearTimeout(syncRetryTimeoutRef.current);
        }
        
        syncRetryTimeoutRef.current = setTimeout(() => {
          if (isOnline) {
            console.log("GlobalSyncContext: Déclenchement de la synchronisation forcée");
            syncAll().catch(error => {
              console.error("GlobalSyncContext: Erreur lors de la synchronisation forcée:", error);
            });
          }
        }, 1000);
      }
    };
    
    window.addEventListener('force-sync-required', handleForceSyncRequired as EventListener);
    window.addEventListener('connectivity-restored', handleForceSyncRequired as EventListener);
    
    return () => {
      window.removeEventListener('force-sync-required', handleForceSyncRequired as EventListener);
      window.removeEventListener('connectivity-restored', handleForceSyncRequired as EventListener);
    };
  }, [isOnline]);
  
  // Écouter les changements de route pour re-synchroniser les données si nécessaire
  useEffect(() => {
    const handleRouteChange = () => {
      console.log("GlobalSyncContext: Changement de route détecté, vérification des synchronisations en attente");
      
      if (isOnline && pendingSyncTablesRef.current.size > 0) {
        console.log("GlobalSyncContext: Tables en attente de synchronisation:", Array.from(pendingSyncTablesRef.current));
        
        // Créer un nouveau batch d'opérations
        syncOperationBatch.current = Date.now();
        
        // Tenter de synchroniser les données en attente après un changement de route
        setTimeout(() => {
          Array.from(pendingSyncTablesRef.current).forEach(tableName => {
            console.log(`GlobalSyncContext: Tentative de re-synchronisation pour ${tableName} après navigation`);
            
            // Récupérer les données depuis localStorage
            try {
              const storageKey = `${tableName}_${currentUser || 'default'}`;
              const storedData = localStorage.getItem(storageKey);
              
              if (storedData) {
                const data = JSON.parse(storedData);
                if (data && data.length > 0) {
                  console.log(`GlobalSyncContext: Données trouvées pour ${tableName}, synchronisation de ${data.length} éléments`);
                  
                  // Générer un identifiant d'opération unique pour cette synchronisation
                  const operationId = `${tableName}_${syncOperationBatch.current}_${Math.random().toString(36).substring(2, 8)}`;
                  syncOperationsRef.current[tableName] = operationId;
                  
                  syncTable(tableName, data, operationId)
                    .then(success => {
                      // Vérifier que c'est bien notre opération qui s'est terminée
                      if (syncOperationsRef.current[tableName] === operationId) {
                        if (success) {
                          console.log(`GlobalSyncContext: Re-synchronisation réussie pour ${tableName} (${operationId})`);
                          pendingSyncTablesRef.current.delete(tableName);
                          delete syncOperationsRef.current[tableName];
                        } else {
                          console.warn(`GlobalSyncContext: Re-synchronisation échouée pour ${tableName} (${operationId})`);
                        }
                      } else {
                        console.log(`GlobalSyncContext: Ignorer le résultat de ${operationId} car une opération plus récente est en cours`);
                      }
                    })
                    .catch(err => console.error(`GlobalSyncContext: Erreur re-synchronisation ${tableName} (${operationId}):`, err));
                }
              }
            } catch (error) {
              console.error(`GlobalSyncContext: Erreur récupération données ${tableName}:`, error);
            }
          });
        }, 500);
      }
    };
    
    // Écouter les événements de changement d'URL
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isOnline, currentUser]);
  
  // Méthode pour mettre à jour l'état de synchronisation d'une table
  const updateSyncState = useCallback((tableName: string, state: Partial<SyncState>) => {
    setSyncStates(prev => ({
      ...prev,
      [tableName]: {
        ...(prev[tableName] || { isSyncing: false, lastSynced: null, syncFailed: false }),
        ...state
      }
    }));
  }, []);
  
  // Méthode pour synchroniser une table spécifique avec un ID d'opération
  const syncTable = useCallback(async <T,>(
    tableName: string, 
    data: T[], 
    operationId?: string
  ): Promise<boolean> => {
    if (!tableName || !data) {
      console.error("GlobalSyncContext: Tentative de synchronisation avec données/table invalides");
      return false;
    }
    
    // Générer un ID d'opération s'il n'est pas fourni
    const syncOperationId = operationId || `${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    console.log(`GlobalSyncContext: Opération ${syncOperationId} - Synchronisation de ${tableName} avec ${data.length} éléments`);
    
    // Enregistrer l'opération en cours
    syncOperationsRef.current[tableName] = syncOperationId;
    
    if (!isOnline) {
      console.log(`GlobalSyncContext: Mode hors ligne, données ${tableName} sauvegardées localement (${syncOperationId})`);
      
      // Sauvegarder dans localStorage
      try {
        const userId = currentUser || 'default';
        localStorage.setItem(`${tableName}_${userId}`, JSON.stringify(data));
      } catch (error) {
        console.error(`GlobalSyncContext: Erreur sauvegarde locale ${tableName} (${syncOperationId}):`, error);
      }
      
      // Marquer comme en attente de synchronisation
      pendingSyncTablesRef.current.add(tableName);
      
      return false;
    }
    
    // Utiliser un verrou pour cette synchronisation spécifique
    const lockKey = `sync_in_progress_${tableName}`;
    const lockTimeKey = `sync_lock_time_${tableName}`;
    
    try {
      // Vérifier si une synchronisation est déjà en cours pour cette table
      const existingLock = localStorage.getItem(lockKey);
      const lockTime = localStorage.getItem(lockTimeKey);
      
      if (existingLock === 'true') {
        // Vérifier si le verrou est ancien (plus de 30 secondes)
        if (lockTime && (Date.now() - parseInt(lockTime)) > 30000) {
          console.log(`GlobalSyncContext: Verrou périmé pour ${tableName}, forçage de la synchronisation (${syncOperationId})`);
          // Supprimer le verrou périmé
          localStorage.removeItem(lockKey);
          localStorage.removeItem(lockTimeKey);
        } else {
          console.log(`GlobalSyncContext: Synchronisation déjà en cours pour ${tableName}, requête mise en attente (${syncOperationId})`);
          pendingSyncTablesRef.current.add(tableName);
          return false;
        }
      }
      
      // Poser un verrou
      localStorage.setItem(lockKey, 'true');
      localStorage.setItem(lockTimeKey, Date.now().toString());
      
      // Mettre à jour l'état pour indiquer que la synchronisation est en cours
      updateSyncState(tableName, { isSyncing: true });
      
      console.log(`GlobalSyncContext: Synchronisation ${tableName} initiée (${syncOperationId}), ${data.length} éléments`);
      
      // Assurer que toutes les entrées ont un ID unique
      const processedData = data.map((item: any) => {
        if (!item.id) {
          return { ...item, id: crypto.randomUUID() };
        }
        return item;
      });
      
      // Utiliser le service triggerSync pour la synchronisation
      const result = await triggerSync.triggerTableSync(tableName, processedData);
      
      // Extraire le succès du résultat
      const success = result.success;
      
      // Vérifier que c'est bien notre opération qui s'est terminée
      if (syncOperationsRef.current[tableName] !== syncOperationId) {
        console.log(`GlobalSyncContext: Une opération plus récente est en cours pour ${tableName}, ignorer le résultat de ${syncOperationId}`);
        
        // Supprimer le verrou uniquement si notre opération l'avait posé
        localStorage.removeItem(lockKey);
        localStorage.removeItem(lockTimeKey);
        
        return false;
      }
      
      // Mettre à jour l'état après la synchronisation
      updateSyncState(tableName, { 
        isSyncing: false,
        lastSynced: result ? new Date() : null,
        syncFailed: !result
      });
      
      // Supprimer le verrou
      localStorage.removeItem(lockKey);
      localStorage.removeItem(lockTimeKey);
      
      if (result) {
        console.log(`GlobalSyncContext: Synchronisation ${tableName} réussie (${syncOperationId})`);
        pendingSyncTablesRef.current.delete(tableName); // Retirer de la liste d'attente
        
        // Sauvegarder la dernière synchronisation réussie
        localStorage.setItem(`last_sync_${tableName}`, JSON.stringify({
          timestamp: new Date().toISOString(),
          count: data.length,
          success: true,
          operationId: syncOperationId
        }));
      } else {
        console.log(`GlobalSyncContext: Synchronisation ${tableName} échouée (${syncOperationId}), marquée pour réessai`);
        pendingSyncTablesRef.current.add(tableName); // Ajouter à la liste d'attente
        
        // Enregistrer l'échec
        localStorage.setItem(`sync_failed_${tableName}`, JSON.stringify({
          timestamp: new Date().toISOString(),
          operationId: syncOperationId
        }));
      }
      
      // Supprimer notre référence d'opération
      delete syncOperationsRef.current[tableName];
      
      return success;
      
    } catch (error) {
      console.error(`GlobalSyncContext: Erreur synchronisation ${tableName} (${syncOperationId}):`, error);
      
      // Supprimer le verrou en cas d'erreur
      localStorage.removeItem(lockKey);
      localStorage.removeItem(lockTimeKey);
      
      updateSyncState(tableName, {
        isSyncing: false,
        syncFailed: true
      });
      
      // Ajouter à la liste d'attente pour réessai
      pendingSyncTablesRef.current.add(tableName);
      
      // Enregistrer l'erreur
      localStorage.setItem(`sync_error_${tableName}`, JSON.stringify({
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Erreur inconnue",
        operationId: syncOperationId
      }));
      
      // Supprimer notre référence d'opération
      delete syncOperationsRef.current[tableName];
      
      return false;
    }
  }, [isOnline, currentUser, updateSyncState]);
  
  // Méthode pour synchroniser toutes les tables
  const syncAll = useCallback(async (): Promise<Record<string, boolean>> => {
    const results: Record<string, boolean> = {};
    
    // Générer un ID de batch pour regrouper les opérations
    const batchId = Date.now();
    console.log(`GlobalSyncContext: Début de synchronisation batch ${batchId}`);
    
    // Vérifier s'il y a des tables en attente de synchronisation
    if (pendingSyncTablesRef.current.size > 0) {
      console.log(`GlobalSyncContext: Synchronisation de ${pendingSyncTablesRef.current.size} tables en attente (batch ${batchId})`);
      
      const tablesArray = Array.from(pendingSyncTablesRef.current);
      
      for (const tableName of tablesArray) {
        try {
          // Récupérer les données depuis localStorage
          const storageKey = `${tableName}_${currentUser || 'default'}`;
          const storedData = localStorage.getItem(storageKey);
          
          if (storedData) {
            const data = JSON.parse(storedData);
            if (data && data.length > 0) {
              console.log(`GlobalSyncContext: Synchronisation ${tableName} avec ${data.length} éléments (batch ${batchId})`);
              
              // Générer un ID d'opération unique pour cette synchronisation
              const operationId = `${tableName}_${batchId}_${Math.random().toString(36).substring(2, 8)}`;
              
              const success = await syncTable(tableName, data, operationId);
              results[tableName] = success;
              
              if (success) {
                pendingSyncTablesRef.current.delete(tableName);
              }
            } else {
              results[tableName] = true; // Rien à synchroniser
              pendingSyncTablesRef.current.delete(tableName);
            }
          } else {
            results[tableName] = true; // Pas de données, considéré comme succès
            pendingSyncTablesRef.current.delete(tableName);
          }
        } catch (error) {
          console.error(`GlobalSyncContext: Erreur lors de la synchronisation de ${tableName} (batch ${batchId}):`, error);
          results[tableName] = false;
        }
      }
      
      console.log(`GlobalSyncContext: Fin de synchronisation batch ${batchId}, résultats:`, results);
    } else {
      console.log(`GlobalSyncContext: Aucune table en attente de synchronisation (batch ${batchId})`);
    }
    
    return results;
  }, [currentUser, syncTable]);
  
  // Détection des changements de connexion réseau pour re-synchroniser
  useEffect(() => {
    const handleOnline = () => {
      console.log("GlobalSyncContext: Connexion réseau rétablie, tentative de synchronisation");
      
      if (syncRetryTimeoutRef.current) {
        clearTimeout(syncRetryTimeoutRef.current);
      }
      
      syncRetryTimeoutRef.current = setTimeout(() => {
        syncAll().catch(error => {
          console.error("GlobalSyncContext: Erreur lors de la synchronisation après reconnexion:", error);
        });
      }, 2000);
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      if (syncRetryTimeoutRef.current) {
        clearTimeout(syncRetryTimeoutRef.current);
      }
    };
  }, [syncAll]);
  
  return (
    <GlobalSyncContext.Provider 
      value={{ 
        syncStates, 
        syncTable, 
        syncAll, 
        updateSyncState, 
        isOnline,
        // Exposer l'état global
        isSyncing: globalSyncState.isSyncing,
        lastSynced: globalSyncState.lastSynced,
        syncFailed: globalSyncState.syncFailed
      }}
    >
      {children}
    </GlobalSyncContext.Provider>
  );
};
