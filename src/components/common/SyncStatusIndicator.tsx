
import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SyncStatusIndicatorProps {
  syncFailed: boolean;
  onReset: () => Promise<void>;
  isSyncing: boolean;
  isOnline?: boolean;
  lastSynced?: Date;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  syncFailed,
  onReset,
  isSyncing,
  isOnline = true,
  lastSynced
}) => {
  if (isSyncing) {
    return (
      <div className="flex items-center bg-blue-50 p-2 rounded">
        <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
        <span className="text-sm text-blue-500">Synchronisation en cours...</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center bg-gray-50 p-2 rounded">
        <span className="text-sm text-gray-500">Mode hors ligne</span>
      </div>
    );
  }

  if (syncFailed) {
    return (
      <div className="flex items-center bg-red-50 p-2 rounded">
        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
        <span className="text-sm text-red-500 mr-2">Échec de synchronisation</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onReset}
          disabled={isSyncing}
          className="p-1 h-6 text-xs"
        >
          <RotateCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          Réessayer
        </Button>
      </div>
    );
  }

  if (lastSynced) {
    const formattedDate = lastSynced.toLocaleTimeString();
    return (
      <div className="flex items-center bg-green-50 p-2 rounded">
        <span className="text-sm text-green-500">Synchronisé à {formattedDate}</span>
      </div>
    );
  }

  return null;
};

export default SyncStatusIndicator;
