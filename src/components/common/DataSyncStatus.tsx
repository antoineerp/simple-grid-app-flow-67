
import React from 'react';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

interface DataSyncStatusProps {
  status: SyncStatus;
  lastSynced: Date | null;
  lastError: string | null;
  pendingChanges: boolean;
  isOnline: boolean;
  onSync?: () => void;
}

// Composant désactivé pour ne plus montrer d'informations de synchronisation
const DataSyncStatus: React.FC<DataSyncStatusProps> = () => {
  // Ne rien afficher
  return null;
};

export default DataSyncStatus;
