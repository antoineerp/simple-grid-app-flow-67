
import React from 'react';
import { RefreshCw, CloudOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SyncIndicatorProps {
  isSyncing: boolean;
  isOnline: boolean;
  syncFailed: boolean;
  lastSynced: Date | null;
  onSync: () => Promise<void>;
  showOnlyErrors?: boolean;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  isSyncing = false,
  isOnline = navigator.onLine,
  syncFailed = false,
  lastSynced = null,
  onSync,
  showOnlyErrors = false
}) => {
  // If we're only showing errors and everything is fine, don't show anything
  if (showOnlyErrors && isOnline && !syncFailed) {
    return null;
  }

  // Format the last synced date
  const formatLastSynced = () => {
    if (!lastSynced) return "Jamais";
    
    const now = new Date();
    const diffMs = now.getTime() - lastSynced.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return "Il y a quelques secondes";
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    
    const hours = lastSynced.getHours().toString().padStart(2, '0');
    const minutes = lastSynced.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // If offline, show offline indicator
  if (!isOnline) {
    return (
      <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800">
        <CloudOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>Mode hors ligne. Les modifications seront synchronisées quand la connexion sera rétablie.</div>
        </AlertDescription>
      </Alert>
    );
  }

  // If sync failed, show error indicator
  if (syncFailed) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>Échec de la dernière synchronisation.</div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSync}
            disabled={isSyncing}
            className="ml-4"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Synchronisation...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </>
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // If not showing errors only, show sync status
  if (!showOnlyErrors) {
    if (isSyncing) {
      return (
        <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-700">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>Synchronisation en cours...</AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert variant="default" className="bg-green-50 border-green-200 text-green-700">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>Données synchronisées. Dernière synchronisation : {formatLastSynced()}</div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSync}
            className="ml-4 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Synchroniser
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Default case, don't show anything
  return null;
};

export default SyncIndicator;
