
import { useState, useCallback, useEffect } from 'react';
import { syncService, DataTable, SyncResult } from '@/services/sync/SyncService';
import { useToast } from '@/components/ui/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

export interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
  syncAndProcess: <T>(tableName: string, data: T[], trigger?: "auto" | "manual" | "initial") => Promise<SyncResult>;
  resetSyncStatus: () => void;
  isOnline: boolean;
}

/**
 * Hook pour gérer la synchronisation de données avec le serveur Infomaniak
 */
export const useSync = (tableName: string): SyncState => {
  const { syncTable, syncStates, isOnline } = useGlobalSync();
  const [lastSynced, setLastSynced] = useState<Date | null>(syncService.getLastSynced(tableName));
  const { toast } = useToast();
  
  // Obtenir l'état de synchronisation à partir du contexte global
  const syncState = syncStates[tableName] || { 
    isSyncing: false, 
    lastSynced: null, 
    syncFailed: false 
  };
  const isSyncing = syncState.isSyncing;
  const syncFailed = syncState.syncFailed;
  
  // Mise à jour de l'état de synchronisation local à partir du contexte global
  useEffect(() => {
    if (syncState.lastSynced && (!lastSynced || syncState.lastSynced > lastSynced)) {
      setLastSynced(syncState.lastSynced);
    }
  }, [syncState, lastSynced]);
  
  // Fonction pour synchroniser les données et gérer les erreurs
  const syncAndProcess = useCallback(async <T>(
    tableName: string, 
    data: T[],
    trigger: "auto" | "manual" | "initial" = "auto"
  ): Promise<SyncResult> => {
    if (!isOnline) {
      console.log(`useSync: Tentative de synchronisation de ${tableName} en mode hors ligne`);
      const result: SyncResult = {
        success: false,
        message: "Mode hors ligne - Données sauvegardées localement"
      };
      
      if (trigger !== "auto") {
        toast({
          title: "Mode hors ligne",
          description: "La synchronisation avec Infomaniak n'est pas disponible en mode hors ligne. Les données sont sauvegardées localement.",
          variant: "destructive"
        });
      }
      
      return result;
    }
    
    console.log(`useSync: Synchronisation de ${tableName} (déclencheur: ${trigger})`);
    
    // Si déjà en cours de synchronisation, éviter les appels redondants
    if (isSyncing) {
      return {
        success: false,
        message: "Synchronisation déjà en cours"
      };
    }
    
    try {
      // Si ce n'est pas une synchronisation automatique, afficher un toast
      if (trigger !== "auto") {
        toast({
          title: "Synchronisation en cours",
          description: "Veuillez patienter pendant la synchronisation avec Infomaniak..."
        });
      }
      
      // Appeler directement le service de synchronisation global
      const result = await syncTable(tableName, data);
      
      if (result) {
        setLastSynced(new Date());
        
        // Pour les synchronisations manuelles et initiales, afficher un toast de succès
        if (trigger !== "auto") {
          toast({
            title: "Synchronisation réussie",
            description: `${tableName} synchronisé avec succès avec Infomaniak`,
          });
        }
        
        return {
          success: true,
          message: `${tableName} synchronisé avec succès avec Infomaniak`
        };
      } else {
        if (trigger !== "auto") {
          toast({
            title: "Échec de la synchronisation",
            description: "Une erreur est survenue lors de la synchronisation avec Infomaniak. Les données sont sauvegardées localement.",
            variant: "destructive"
          });
        }
        
        return {
          success: false,
          message: "Échec de la synchronisation avec Infomaniak. Données sauvegardées localement."
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      if (trigger !== "auto") {
        toast({
          title: "Erreur de synchronisation",
          description: `${errorMessage}. Les données sont sauvegardées localement.`,
          variant: "destructive"
        });
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [isOnline, tableName, toast, syncTable, isSyncing]);
  
  // Réinitialiser l'état de synchronisation
  const resetSyncStatus = useCallback(() => {
    // Cette fonction n'est plus nécessaire avec le contexte global,
    // mais est conservée pour la compatibilité avec le code existant
  }, []);
  
  return {
    isSyncing,
    lastSynced,
    syncFailed,
    syncAndProcess,
    resetSyncStatus,
    isOnline
  };
};
