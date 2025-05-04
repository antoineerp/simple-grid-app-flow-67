
import React from 'react';

interface SyncIndicatorProps {
  isSyncing?: boolean;
  isOnline?: boolean;
  syncFailed?: boolean;
  lastSynced?: Date | null;
  onSync?: () => void;
  showOnlyErrors?: boolean;
  tableName?: string;
  deviceId?: string | null;
  error?: string | null;
}

// Composant désactivé - ne fait rien
const SyncIndicator: React.FC<SyncIndicatorProps> = () => {
  return null;
};

export default SyncIndicator;
