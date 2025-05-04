
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, AlertCircle, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import SyncToolbar from './SyncToolbar';

interface SyncIndicatorProps {
  isSyncing: boolean;
  isOnline: boolean;
  syncFailed: boolean;
  lastSynced: Date | null;
  onSync: () => void;
  showOnlyErrors?: boolean;
  tableName: string;
  deviceId?: string | null;
  error?: string | null;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  isSyncing,
  isOnline,
  syncFailed,
  lastSynced,
  onSync,
  showOnlyErrors = false,
  tableName,
  deviceId,
  error
}) => {
  if (!isOnline) {
    return (
      <Alert variant="warning" className="flex items-center justify-between">
        <div className="flex items-center">
          <WifiOff className="h-4 w-4 mr-2" />
          <AlertDescription>
            Mode hors-ligne activé. Les modifications seront synchronisées quand la connexion sera rétablie.
          </AlertDescription>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">
            {deviceId && `Appareil: ${deviceId}`}
          </span>
        </div>
      </Alert>
    );
  }

  if (syncFailed) {
    return (
      <>
        <Alert variant="destructive" className="flex items-center justify-between mb-2">
          <AlertDescription className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Échec de la synchronisation. 
            {error && ` ${error}`}
          </AlertDescription>
        </Alert>
        <SyncToolbar
          onSync={onSync}
          lastSynced={lastSynced}
          isLoading={isSyncing}
          error={error || "Échec de la synchronisation"}
          tableName={tableName}
        />
      </>
    );
  }

  if (showOnlyErrors) {
    return null;
  }

  return (
    <SyncToolbar
      onSync={onSync}
      lastSynced={lastSynced}
      isLoading={isSyncing}
      error={error}
      tableName={tableName}
    />
  );
};

export default SyncIndicator;
