/**
 * Centralised sync context to manage synchronization across the application
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { executeSyncOperation, isSynchronizing } from '../utils/syncOperations';
import { SyncHookOptions, SyncState, SyncOperationResult, SyncMonitorStatus } from '../types/syncTypes';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { syncMonitor } from '../utils/syncMonitor';
import { toast } from '@/components/ui/use-toast';
import { forceSyncQueueProcessing } from '../utils/syncQueue';

interface SyncContextType {
  syncTable: <T>(tableName: string, data: T[], trigger?: "auto" | "manual" | "initial") => Promise<SyncOperationResult>;
  syncAll: () => Promise<Record<string, boolean>>;
  syncStates: Record<string, SyncState>;
  isOnline: boolean;
  monitorStatus: SyncMonitorStatus;
  forceProcessQueue: () => void;
  syncWithServer?: <T>(tableName: string, data: T[]) => Promise<boolean>;
  notifyChanges?: () => void;
}

// Default context value
const defaultContext: SyncContextType = {
  syncTable: async () => ({ success: false, message: "Sync context not initialized" }),
  syncAll: async () => ({}),
  syncStates: {},
  isOnline: navigator.onLine,
  monitorStatus: { 
    activeCount: 0, 
    recentAttempts: [],
    stats: { success: 0, failure: 0 },
    health: 'good',
    lastSync: { time: null, success: false }
  },
  forceProcessQueue: () => {},
  syncWithServer: async () => false,
  notifyChanges: () => {}
};

const SyncContext = createContext<SyncContextType>(defaultContext);

/**
 * Provides synchronization context for the application
 */
export const SyncProvider: React.FC<{
  children: React.ReactNode;
  options?: SyncHookOptions;
}> = ({ children, options = {} }) => {
  const { isOnline } = useNetworkStatus();
  
  // Track sync state for each table
  const [syncStates, setSyncStates] = useState<Record<string, SyncState>>({});
  
  // Track monitor status
  const [monitorStatus, setMonitorStatus] = useState<SyncMonitorStatus>(syncMonitor.getStatus());
  
  // Current user reference
  const currentUserRef = useRef<string>(getDatabaseConnectionCurrentUser() || 'default');
  
  // Keep track of tables that have been synced
  const syncedTablesRef = useRef<Set<string>>(new Set());
  
  // Tables that require synchronization
  const pendingSyncsRef = useRef<Map<string, number>>(new Map());
  
  // Monitor for recovery attempts after network issues
  const recoveryAttemptsRef = useRef<number>(0);
  const MAX_RECOVERY_ATTEMPTS = 3;
  
  // Update sync state for a table
  const updateTableSyncState = useCallback((
    tableName: string, 
    updates: Partial<SyncState>
  ) => {
    setSyncStates(prev => {
      const current = prev[tableName] || {
        isSyncing: false,
        lastSynced: null,
        syncFailed: false,
        pendingSync: false,
        dataChanged: false
      };
      
      return { 
        ...prev, 
        [tableName]: { ...current, ...updates } 
      };
    });
  }, []);

  // Sync a specific table
  const syncTable = useCallback(async <T,>(
    tableName: string, 
    data: T[],
    trigger: "auto" | "manual" | "initial" = "auto"
  ): Promise<SyncOperationResult> => {
    console.log(`useSyncContext: Demande de synchronisation de ${tableName} (déclencheur: ${trigger})`);
    
    // Skip if there's no data to sync
    if (!data || data.length === 0) {
      console.log(`useSyncContext: Pas de données à synchroniser pour ${tableName}`);
      return { success: false, message: "No data to synchronize" };
    }
    
    // Mark as syncing
    updateTableSyncState(tableName, { isSyncing: true });
    
    // Vérifier si la synchronisation est possible maintenant
    if (!isOnline) {
      console.log(`useSyncContext: Mode hors ligne, synchronisation impossible pour ${tableName}`);
      
      // Simuler un délai pour éviter les rebonds et donner l'impression de traitement
      await new Promise(r => setTimeout(r, 500));
      
      // En mode silencieux, ne pas afficher de toast pour les synchronisations automatiques
      if (trigger !== "auto" && !options.hideIndicators) {
        toast({
          title: "Mode hors ligne",
          description: "Les données sont sauvegardées localement uniquement.",
          variant: "destructive"
        });
      }
      
      // Mark as not syncing but with pending sync
      updateTableSyncState(tableName, { 
        isSyncing: false,
        syncFailed: false,
        pendingSync: true
      });
      
      // Store the timestamp for later synchronization
      pendingSyncsRef.current.set(tableName, Date.now());
      
      return { success: false, message: "Offline mode, saved locally" };
    }
    
    try {
      // Get current user
      const currentUser = getDatabaseConnectionCurrentUser() || 'default';
      
      // Perform the actual synchronization
      const result = await executeSyncOperation(
        tableName, 
        data, 
        // This function actually performs the sync with the server
        async (name: string, tableData: T[], opId: string) => {
          console.log(`useSyncContext: Exécution de la synchronisation ${opId} pour ${name}`);
          
          try {
            // Simuler une synchronisation avec le serveur
            // Dans un cas réel, vous appelleriez votre API/serveur ici
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000)); // Simuler la latence réseau
            
            // Enregistrer localement les données
            localStorage.setItem(`${name}_${currentUser}`, JSON.stringify(tableData));
            
            // Pour cette démo, on considère que 90% des synchronisations réussissent
            const success = Math.random() > 0.1;
            
            if (success) {
              // Enregistrer l'horodatage de la dernière synchronisation
              const timestamp = new Date().toISOString();
              localStorage.setItem(`last_synced_${name}`, timestamp);
              
              return true;
            } else {
              console.error(`useSyncContext: Échec simulé de la synchronisation pour ${name} (opération ${opId})`);
              return false;
            }
          } catch (error) {
            console.error(`useSyncContext: Erreur lors de la synchronisation de ${name}:`, error);
            return false;
          }
        },
        `${currentUser}_${tableName}`, // Optional sync key for storage
        trigger
      );
      
      // Handle the result
      if (result.success) {
        console.log(`useSyncContext: Synchronisation réussie pour ${tableName}`);
        
        // Mark as synced
        updateTableSyncState(tableName, {
          isSyncing: false,
          lastSynced: new Date(),
          syncFailed: false,
          pendingSync: false
        });
        
        // Add to synced tables
        syncedTablesRef.current.add(tableName);
        
        // Remove from pending syncs
        pendingSyncsRef.current.delete(tableName);
        
        // Show success toast for manual syncs if configured
        if (trigger === "manual" && options.showToasts && !options.hideIndicators) {
          toast({
            title: "Synchronisation réussie",
            description: `Les données de ${tableName} ont été synchronisées avec succès.`
          });
        }
        
        return result;
      } else {
        console.error(`useSyncContext: Échec synchronisation de ${tableName} (opération ${result.message})`);
        
        // Mark as failed
        updateTableSyncState(tableName, {
          isSyncing: false,
          syncFailed: true,
          pendingSync: true
        });
        
        // Add to pending syncs
        pendingSyncsRef.current.set(tableName, Date.now());
        
        // Show error toast for manual syncs if configured
        if (trigger === "manual" && options.showToasts && !options.hideIndicators) {
          toast({
            title: "Échec de la synchronisation",
            description: `La synchronisation de ${tableName} a échoué. Réessayez ultérieurement.`,
            variant: "destructive"
          });
        }
        
        return result;
      }
    } catch (error) {
      console.error(`useSyncContext: Erreur lors de la synchronisation de ${tableName}:`, error);
      
      // Mark as failed
      updateTableSyncState(tableName, {
        isSyncing: false,
        syncFailed: true,
        pendingSync: true
      });
      
      // Show error toast for manual syncs if configured
      if (trigger === "manual" && options.showToasts && !options.hideIndicators) {
        toast({
          title: "Erreur de synchronisation",
          description: `Une erreur est survenue lors de la synchronisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          variant: "destructive"
        });
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }, [isOnline, options.hideIndicators, options.showToasts, updateTableSyncState]);

  // Sync all tables that have been previously synced
  const syncAll = useCallback(async (): Promise<Record<string, boolean>> => {
    console.log(`useSyncContext: Synchronisation globale demandée`);
    
    // Don't attempt sync if offline
    if (!isOnline) {
      console.log("useSyncContext: Mode hors ligne, synchronisation globale impossible");
      return {};
    }
    
    // Result tracking
    const results: Record<string, boolean> = {};
    
    // Get list of tables that need synchronization
    const tablesToSync = new Set<string>([
      ...Array.from(syncedTablesRef.current),
      ...Array.from(pendingSyncsRef.current.keys())
    ]);
    
    if (tablesToSync.size === 0) {
      console.log("useSyncContext: Aucune table à synchroniser");
      return results;
    }
    
    console.log(`useSyncContext: Synchronisation de ${tablesToSync.size} tables`);
    
    // Sync each table sequentially to prevent race conditions
    for (const tableName of tablesToSync) {
      try {
        // Load data from local storage
        const currentUser = getDatabaseConnectionCurrentUser() || 'default';
        const storedData = localStorage.getItem(`${tableName}_${currentUser}`);
        
        if (!storedData) {
          console.log(`useSyncContext: Pas de données locales pour ${tableName}`);
          results[tableName] = true; // Consider it synced if no data
          continue;
        }
        
        const data = JSON.parse(storedData);
        
        // Don't sync empty data
        if (!data || (Array.isArray(data) && data.length === 0)) {
          console.log(`useSyncContext: Données vides pour ${tableName}, ignoré`);
          results[tableName] = true;
          continue;
        }
        
        // Perform the sync
        const result = await syncTable(tableName, data, "initial");
        results[tableName] = result.success;
        
        // Wait a short period between syncs
        await new Promise(r => setTimeout(r, 1000));
      } catch (error) {
        console.error(`useSyncContext: Erreur lors de la synchronisation de ${tableName}:`, error);
        results[tableName] = false;
      }
    }
    
    console.log("useSyncContext: Résultats de la synchronisation globale:", results);
    return results;
  }, [isOnline, syncTable]);
  
  // Implementing the missing methods that other components use
  const syncWithServer = useCallback(async <T,>(tableName: string, data: T[]): Promise<boolean> => {
    try {
      const result = await syncTable(tableName, data, "manual");
      return result.success;
    } catch (error) {
      console.error(`useSyncContext: Error in syncWithServer for ${tableName}:`, error);
      return false;
    }
  }, [syncTable]);

  // Notify about changes to sync data
  const notifyChanges = useCallback(() => {
    // Implement a basic change notification mechanism
    console.log("useSyncContext: Data changes detected");
    
    // Dispatch event for other parts of the app to react to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync-data-changed', {
        detail: { timestamp: Date.now() }
      }));
    }
  }, []);
  
  // Watch for online status changes to trigger sync
  useEffect(() => {
    if (isOnline && pendingSyncsRef.current.size > 0) {
      console.log(`useSyncContext: ${pendingSyncsRef.current.size} synchronisations en attente après reconnexion`);
      
      // Wait a bit to ensure connection is stable
      const timeoutId = setTimeout(() => {
        syncAll()
          .then(results => {
            // Count successes
            const successCount = Object.values(results).filter(r => r).length;
            if (successCount > 0 && !options.hideIndicators) {
              toast({
                title: "Synchronisation automatique",
                description: `${successCount} tables ont été synchronisées après reconnexion.`
              });
            }
          })
          .catch(error => {
            console.error("useSyncContext: Erreur lors de la synchronisation après reconnexion:", error);
          });
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, syncAll, options.hideIndicators]);

  // Update monitor status periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      setMonitorStatus(syncMonitor.getStatus());
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Handle user changes
  useEffect(() => {
    const handleUserChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent?.detail?.user) {
        currentUserRef.current = customEvent.detail.user;
        console.log(`useSyncContext: Changement d'utilisateur - ${customEvent.detail.user}`);
        
        // Clear synced tables for the new user
        syncedTablesRef.current.clear();
      }
    };
    
    window.addEventListener('database-user-changed', handleUserChange);
    return () => {
      window.removeEventListener('database-user-changed', handleUserChange);
    };
  }, []);
  
  // Force processing the queue if needed
  const forceProcessQueue = useCallback(() => {
    console.log("useSyncContext: Forçage du traitement de la file d'attente");
    forceSyncQueueProcessing();
  }, []);

  return (
    <SyncContext.Provider value={{
      syncTable,
      syncAll,
      syncStates,
      isOnline,
      monitorStatus,
      forceProcessQueue,
      syncWithServer,
      notifyChanges
    }}>
      {children}
    </SyncContext.Provider>
  );
};

// Hook to use the sync context
export const useSyncContext = () => useContext(SyncContext);

// For backward compatibility
export * from '../types/syncTypes';
