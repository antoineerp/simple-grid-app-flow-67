
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RefreshCw, AlertTriangle, CheckCircle, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface SyncStatusIndicatorProps {
  syncFailed: boolean;
  onReset: () => void;
  isSyncing: boolean;
  lastSynced?: Date | null;
  isOnline?: boolean;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  syncFailed,
  onReset,
  isSyncing,
  lastSynced,
  isOnline = true
}) => {
  if (isSyncing) {
    return (
      <Alert className="bg-blue-50 border-blue-200 text-blue-800 mb-4">
        <div className="flex items-center">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          <AlertDescription>Synchronisation en cours...</AlertDescription>
        </div>
      </Alert>
    );
  }

  if (!isOnline) {
    return (
      <Alert className="bg-gray-50 border-gray-200 text-gray-800 mb-4">
        <div className="flex items-center">
          <CloudOff className="h-4 w-4 mr-2" />
          <AlertDescription>Mode hors ligne</AlertDescription>
        </div>
      </Alert>
    );
  }

  if (syncFailed) {
    return (
      <Alert className="bg-red-50 border-red-200 text-red-800 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>Échec de la synchronisation</AlertDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReset}
            className="h-8 px-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </Alert>
    );
  }

  if (lastSynced) {
    const formattedDate = format(lastSynced, "dd MMMM à HH:mm", { locale: fr });
    
    return (
      <Alert className="bg-green-50 border-green-200 text-green-800 mb-4">
        <div className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          <AlertDescription>Dernière synchronisation: {formattedDate}</AlertDescription>
        </div>
      </Alert>
    );
  }

  return null;
};

export default SyncStatusIndicator;
