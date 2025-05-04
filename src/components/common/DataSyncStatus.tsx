
import React from 'react';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

interface DataSyncStatusProps {
  status?: SyncStatus;
  lastSynced?: Date | null;
  lastError?: string | null;
  pendingChanges?: boolean;
  isOnline?: boolean;
  onSync?: () => void;
}

// Composant désactivé - ne fait rien
const DataSyncStatus: React.FC<DataSyncStatusProps> = () => {
  return null;
};

export default DataSyncStatus;
