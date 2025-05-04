
import React from 'react';

interface SyncStatusIndicatorProps {
  isSyncing: boolean;
  lastSynced: Date | null;
  isOnline: boolean;
  syncFailed: boolean;
  onSyncClick?: () => void;
}

// Indicateur de statut de synchronisation invisible
const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = () => {
  // Ne rien afficher du tout
  return null;
};

export default SyncStatusIndicator;
