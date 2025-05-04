
import React from 'react';
import SyncDebugger from '@/features/sync/components/SyncDebugger';

// Composant simplifié - ne fait plus rien de réel
const GlobalSyncManager: React.FC = () => {
  console.log("GlobalSyncManager: Fonctionnalité de synchronisation désactivée");
  
  // Afficher le débogueur uniquement en développement (désactivé)
  return <SyncDebugger enabled={false} />;
};

export default GlobalSyncManager;
