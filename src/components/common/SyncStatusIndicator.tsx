
import React from 'react';
import { CloudOff, CloudSun, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncStatusIndicatorProps {
  isSyncing: boolean;
  isOnline?: boolean;
  lastSynced?: Date;
  syncFailed?: boolean;
  onReset?: () => void;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  isSyncing,
  isOnline = navigator.onLine,
  lastSynced,
  syncFailed = false,
  onReset
}) => {
  return (
    <div className="flex items-center text-sm text-gray-500">
      {isSyncing ? (
        <CloudSun className="h-4 w-4 mr-1 animate-spin" />
      ) : syncFailed ? (
        <CloudOff className="h-4 w-4 mr-1 text-red-500" />
      ) : (
        <CloudSun className={cn("h-4 w-4 mr-1", isOnline ? "text-green-500" : "text-amber-500")} />
      )}
      
      <span className="mr-1">
        {isSyncing ? "Synchronisation..." : 
         syncFailed ? "Échec de la synchronisation" : 
         isOnline ? "Synchronisé" : "Mode hors ligne"}
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

export default SyncStatusIndicator;
