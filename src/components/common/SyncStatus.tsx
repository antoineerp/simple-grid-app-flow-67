
import React from 'react';
import { useSyncContext } from '@/contexts/SyncContext';
import { RefreshCcw } from 'lucide-react';

interface SyncStatusProps {
  tableName?: string;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ tableName }) => {
  const syncContext = useSyncContext();
  const { isOnline } = syncContext;
  
  // Utiliser soit le statut global, soit le statut spécifique à la table
  const isSyncing = tableName 
    ? syncContext.isSyncing[tableName] || false
    : Object.values(syncContext.isSyncing).some(status => status);
  
  const lastSyncTime = tableName 
    ? syncContext.getLastSynced(tableName)
    : Object.values(syncContext.lastSynced).reduce((latest, date) => 
        date && (!latest || date > latest) ? date : latest, null as Date | null);
  
  const hasError = tableName
    ? !!syncContext.getSyncError(tableName)
    : Object.values(syncContext.syncErrors).some(error => !!error);

  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
           aria-label={isOnline ? 'En ligne' : 'Hors ligne'} />
      
      <RefreshCcw 
        className={`h-3 w-3 ${isSyncing ? 'animate-spin text-blue-500' : hasError ? 'text-red-500' : 'text-gray-400'}`}
        aria-label={isSyncing ? 'Synchronisation en cours' : hasError ? 'Erreur de synchronisation' : 'Aucune synchronisation en cours'} 
      />
      
      {lastSyncTime && (
        <span className="text-gray-500" title="Dernière synchronisation">
          {lastSyncTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default SyncStatus;
