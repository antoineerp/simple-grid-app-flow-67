
import React from 'react';
import { CloudOff, CloudSun, Check } from 'lucide-react';
import { dataSyncManager } from '@/services/sync/DataSyncManager';

// Définir l'enum SyncStatus à utiliser comme valeur
enum SyncStatusEnum {
  Idle = "Idle",
  Syncing = "Syncing",
  Error = "Error"
}

interface DataSyncStatusProps {
  syncFailed?: boolean;
  onReset?: () => void;
  isSyncing?: boolean;
  lastSynced?: Date;
}

export const DataSyncStatus: React.FC<DataSyncStatusProps> = ({
  syncFailed = false,
  onReset,
  isSyncing = false,
  lastSynced
}) => {
  // Utiliser une fonction pour obtenir le statut plutôt que d'utiliser directement le type
  const status = dataSyncManager.getSyncStatus ? dataSyncManager.getSyncStatus() : SyncStatusEnum.Idle;
  const isOnline = navigator.onLine;

  return (
    <div className="flex items-center text-sm text-gray-500">
      {isSyncing ? (
        <CloudSun className="h-4 w-4 mr-1 animate-spin" />
      ) : syncFailed ? (
        <CloudOff className="h-4 w-4 mr-1 text-red-500" />
      ) : (
        <CloudSun className="h-4 w-4 mr-1" />
      )}
      
      <span className="mr-1">
        {isSyncing ? "Synchronisation..." : 
         syncFailed ? "Échec de la synchronisation" : 
         status === SyncStatusEnum.Idle ? "Synchronisé" : 
         "Prêt"}
      </span>
      
      {lastSynced && !isSyncing && !syncFailed && (
        <span className="text-xs text-gray-400">
          (dernière sync: {lastSynced.toLocaleTimeString()})
        </span>
      )}
      
      {syncFailed && onReset && (
        <button 
          onClick={onReset}
          className="ml-2 text-xs text-blue-500 hover:text-blue-700"
        >
          Réessayer
        </button>
      )}
      
      {!isOnline && (
        <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded">
          Hors ligne
        </span>
      )}
    </div>
  );
};
