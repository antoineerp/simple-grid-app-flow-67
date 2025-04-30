
import { useState, useCallback, useEffect } from 'react';
import { SyncResult } from '@/services/sync/SyncService';
import { useToast } from '@/components/ui/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSyncContext } from '@/features/sync/hooks/useSyncContext';
import { SyncState } from '@/features/sync/types/syncTypes';
import { safeLocalStorageSet, safeLocalStorageGet } from '@/utils/syncStorageCleaner';

/**
 * Hook pour gérer la synchronisation de données avec le serveur
 */
export const useSync = (tableName: string): SyncState & {
  syncAndProcess: <T>(data: T[], trigger?: "auto" | "manual" | "initial", options?: { userId?: string }) => Promise<SyncResult>;
  resetSyncStatus: () => void;
  isOnline: boolean;
} => {
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { isOnline } = useNetworkStatus();
  const { syncTable, syncStates } = useSyncContext();
  const { toast } = useToast();
  
  // Obtenir l'état de synchronisation à partir du contexte global
  const syncState = syncStates[tableName] || { 
    isSyncing: false, 
    lastSynced: null, 
    syncFailed: false,
    pendingSync: false,
    dataChanged: false
  };
  
  // Extraire les états
  const isSyncing = syncState.isSyncing;
  const syncFailed = syncState.syncFailed;
  const pendingSync = syncState.pendingSync;
  
  // Mise à jour de l'état de synchronisation local à partir du contexte global
  useEffect(() => {
    if (syncState.lastSynced && (!lastSynced || new Date(syncState.lastSynced) > lastSynced)) {
      setLastSynced(new Date(syncState.lastSynced));
    }
  }, [syncState, lastSynced]);

  // Fonction pour synchroniser et traiter les données
  const syncAndProcess = useCallback(async <T>(
    data: T[],
    trigger: "auto" | "manual" | "initial" = "auto",
    options?: { userId?: string }
  ): Promise<SyncResult> => {
    try {
      // Journaliser le début de la synchronisation
      console.log(`useSync: Démarrage de la synchronisation de ${tableName} avec ${data.length} éléments (trigger: ${trigger})`);
      
      // S'assurer qu'il y a des données à synchroniser
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn(`useSync: Aucune donnée à synchroniser pour ${tableName}`);
        return {
          success: false,
          message: `Aucune donnée à synchroniser pour ${tableName}`
        };
      }

      // Utiliser le service central pour la synchronisation
      // Passer seulement les arguments nécessaires
      // Correction: S'assurer que trigger est bien du type attendu
      const validTrigger = (trigger === "auto" || trigger === "manual" || trigger === "initial") 
        ? trigger 
        : "auto";
        
      const result = await syncTable(tableName, data, validTrigger);
      
      if (result.success) {
        // Stocker de manière sécurisée la date de dernière synchronisation
        const syncTimestamp = new Date().toISOString();
        safeLocalStorageSet(`last_synced_${tableName}`, syncTimestamp);
        
        // Si la synchronisation a réussi, mettre à jour l'état local
        setLastSynced(new Date());
        
        // Diffuser un événement pour informer d'autres parties de l'application
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sync-completed', { 
            detail: { tableName, timestamp: syncTimestamp, dataSize: data.length }
          }));
        }
        
        console.log(`useSync: Synchronisation réussie de ${tableName} (${data.length} éléments)`);
        return {
          success: true,
          message: `${tableName} synchronisé avec succès (${data.length} éléments)`
        };
      } else {
        console.error(`useSync: Échec de la synchronisation de ${tableName}:`, result.message);
        
        // Diffuser un événement pour informer d'autres parties de l'application
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sync-failed', { 
            detail: { tableName, message: result.message }
          }));
        }
        
        return {
          success: false,
          message: result.message
        };
      }
    } catch (error) {
      console.error(`useSync: Erreur lors de la synchronisation de ${tableName}:`, error);

      // Diffuser un événement pour informer d'autres parties de l'application
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sync-failed', { 
          detail: { tableName, message: error instanceof Error ? error.message : String(error) }
        }));
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }, [tableName, syncTable]);
  
  // Réinitialiser l'état de synchronisation (compatibilité)
  const resetSyncStatus = useCallback(() => {
    console.log(`useSync: resetSyncStatus appelé pour ${tableName} (no-op)`);
  }, [tableName]);
  
  // Vérifier périodiquement si les données ont été synchronisées récemment
  useEffect(() => {
    if (!isOnline) return;
    
    // Vérifier toutes les minutes si les données ont été synchronisées
    const checkInterval = setInterval(() => {
      try {
        const lastSyncStr = safeLocalStorageGet<string>(`last_synced_${tableName}`, null);
        if (!lastSyncStr) {
          console.log(`useSync: Aucune synchronisation récente détectée pour ${tableName}`);
          return;
        }
        
        const lastSyncDate = new Date(lastSyncStr);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60);
        
        if (diffMinutes > 15) { // Si plus de 15 minutes sans synchronisation
          console.warn(`useSync: La dernière synchronisation pour ${tableName} date de plus de 15 minutes`);
        }
      } catch (error) {
        console.error(`useSync: Erreur lors de la vérification de la dernière synchronisation:`, error);
      }
    }, 60000); // Vérifier chaque minute
    
    return () => clearInterval(checkInterval);
  }, [tableName, isOnline]);

  return {
    isSyncing,
    lastSynced,
    syncFailed,
    pendingSync,
    dataChanged: syncState.dataChanged || false,
    syncAndProcess,
    resetSyncStatus,
    isOnline
  };
};
