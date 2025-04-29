
import { useState, useCallback, useEffect } from 'react';
import { syncService, DataTable, SyncResult } from '@/services/sync/SyncService';
import { useToast } from '@/components/ui/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
  syncAndProcess: <T>(table: DataTable<T>, trigger?: "auto" | "manual" | "initial") => Promise<SyncResult>;
  resetSyncStatus: () => void;
  isOnline: boolean;
}

/**
 * Hook pour gérer la synchronisation de données avec le serveur
 */
export const useSync = (tableName: string): SyncState => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(syncService.getLastSynced(tableName));
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  
  // Mise à jour de l'état de synchronisation
  useEffect(() => {
    const syncingState = syncService.isSyncingTable(tableName);
    setIsSyncing(syncingState);
    
    // Mettre à jour la dernière date de synchronisation
    const lastSyncDate = syncService.getLastSynced(tableName);
    if (lastSyncDate && (!lastSynced || lastSyncDate > lastSynced)) {
      setLastSynced(lastSyncDate);
    }
    
    // Vérifier dans le localStorage s'il y a eu un échec de synchronisation
    const lastFailedSync = localStorage.getItem(`sync_failed_${tableName}`);
    if (lastFailedSync) {
      try {
        const failedSync = JSON.parse(lastFailedSync);
        // Considérer comme échoué seulement si la dernière tentative a échoué il y a moins de 24h
        const failedTime = new Date(failedSync.timestamp).getTime();
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
        
        if (now - failedTime < oneDay) {
          setSyncFailed(true);
        } else {
          // Supprimer l'entrée si elle est trop ancienne
          localStorage.removeItem(`sync_failed_${tableName}`);
        }
      } catch (e) {
        console.error(`Erreur lors de la lecture de l'état de synchronisation: ${e}`);
      }
    }
  }, [tableName, lastSynced]);
  
  // Fonction pour synchroniser les données et gérer les erreurs
  const syncAndProcess = useCallback(async <T>(
    table: DataTable<T>, 
    trigger: "auto" | "manual" | "initial" = "auto"
  ): Promise<SyncResult> => {
    if (!isOnline) {
      toast({
        title: "Mode hors ligne",
        description: "La synchronisation n'est pas disponible en mode hors ligne",
        variant: "destructive"
      });
      throw new Error("Mode hors ligne");
    }
    
    if (isSyncing) {
      toast({
        title: "Synchronisation en cours",
        description: "Veuillez attendre la fin de la synchronisation en cours",
      });
      throw new Error("Synchronisation déjà en cours");
    }
    
    setIsSyncing(true);
    
    try {
      // Si c'est une synchronisation automatique, ne pas afficher de toast de début
      if (trigger !== "auto") {
        toast({
          title: "Synchronisation en cours",
          description: "Veuillez patienter pendant la synchronisation..."
        });
      }
      
      const result = await syncService.syncTable(table, null, trigger);
      
      if (result.success) {
        setLastSynced(new Date());
        setSyncFailed(false);
        
        // Supprimer toute trace d'échec précédent
        localStorage.removeItem(`sync_failed_${tableName}`);
        
        // Pour les synchronisations manuelles et initiales, afficher un toast de succès
        if (trigger !== "auto") {
          toast({
            title: "Synchronisation réussie",
            description: result.message || `${tableName} synchronisé avec succès`,
          });
        }
      } else {
        setSyncFailed(true);
        toast({
          title: "Échec de la synchronisation",
          description: result.message || "Une erreur est survenue lors de la synchronisation",
          variant: "destructive"
        });
      }
      
      return result;
    } catch (error) {
      setSyncFailed(true);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      // Sauvegarder l'échec dans le localStorage
      localStorage.setItem(`sync_failed_${tableName}`, JSON.stringify({
        timestamp: new Date().toISOString(),
        error: errorMessage
      }));
      
      toast({
        title: "Erreur de synchronisation",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, tableName, toast]);
  
  // Réinitialiser l'état de synchronisation
  const resetSyncStatus = useCallback(() => {
    setSyncFailed(false);
    localStorage.removeItem(`sync_failed_${tableName}`);
  }, [tableName]);
  
  return {
    isSyncing,
    lastSynced,
    syncFailed,
    syncAndProcess,
    resetSyncStatus,
    isOnline
  };
};
