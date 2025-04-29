
import { useCallback, useEffect, useState } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { useToast } from '@/hooks/use-toast';
import { triggerSync } from '@/services/sync/triggerSync';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

interface SyncHookOptions {
  showToasts?: boolean;
  autoSync?: boolean; // Option pour synchroniser automatiquement au chargement
}

/**
 * Hook réutilisable pour la synchronisation dans n'importe quelle page
 * qui fournit une interface cohérente pour toutes les tables
 */
export function useSyncContext<T>(tableName: string, data: T[], options: SyncHookOptions = {}) {
  const { syncStates, syncTable, isOnline } = useGlobalSync();
  const { toast } = useToast();
  const { showToasts = true, autoSync = false } = options;
  const [dataChanged, setDataChanged] = useState(false);

  // Obtenir l'état de synchronisation pour cette table
  const syncState = syncStates[tableName] || {
    isSyncing: false,
    lastSynced: null,
    syncFailed: false
  };
  
  // Effet pour synchroniser automatiquement si autoSync est activé
  useEffect(() => {
    if (autoSync && isOnline && data.length > 0 && !syncState.isSyncing) {
      console.log(`useSyncContext: Auto-synchronisation activée pour ${tableName}`);
      
      // Notifier seulement, ne pas synchroniser immédiatement
      triggerSync.notifyDataChange(tableName, data);
    }
  }, [autoSync, isOnline, data, tableName, syncState.isSyncing]);
  
  // Effet pour sauvegarder les données localement quand elles changent
  useEffect(() => {
    if (data.length > 0) {
      // Sauvegarder avec l'ID utilisateur pour éviter les conflits
      const userId = getCurrentUser() || 'default';
      localStorage.setItem(`${tableName}_${userId}`, JSON.stringify(data));
      setDataChanged(true);
    }
  }, [data, tableName]);

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

    try {
      console.log(`Synchronisation de ${tableName} initiée avec ${data.length} éléments`);
      
      // Utiliser l'ID utilisateur actuel
      const userId = getCurrentUser() || 'default';
      
      // Appeler la synchronisation avec des données explicitement spécifiées
      const result = await syncTable(tableName, data, userId);
      
      if (result) {
        setDataChanged(false);
        console.log(`Synchronisation de ${tableName} réussie`);
        
        if (showToasts) {
          toast({
            title: "Synchronisation réussie",
            description: `Les données de ${tableName} ont été synchronisées`
          });
        }
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
  }, [isOnline, syncTable, tableName, data, showToasts, toast]);
  
  // Méthode pour notifier seulement les changements (sauvegarde locale)
  const notifyChanges = useCallback(() => {
    triggerSync.notifyDataChange(tableName, data);
    setDataChanged(true);
  }, [tableName, data]);

  return {
    isSyncing: syncState.isSyncing,
    lastSynced: syncState.lastSynced,
    syncFailed: syncState.syncFailed,
    isOnline,
    syncWithServer,
    notifyChanges,
    dataChanged
  };
}
