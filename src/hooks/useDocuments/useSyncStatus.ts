
import { useSyncService } from '@/services/core/syncService';
import { useGlobalSync } from '@/hooks/useGlobalSync';

type UseSyncStatusProps = {
  coreIsSyncing: boolean;
  coreSyncFailed: boolean;
  coreLastSynced: Date | null;
};

export const useSyncStatus = ({
  coreIsSyncing,
  coreSyncFailed,
  coreLastSynced
}: UseSyncStatusProps) => {
  // Use the centralized sync service
  const syncService = useSyncService();
  
  // Use the global sync service
  const globalSync = useGlobalSync({
    autoSyncTypes: ['documents']
  });
  
  // Use the states of the centralized sync service
  const isSyncing = syncService.isSyncing || globalSync.isGlobalSyncing || coreIsSyncing;
  const syncFailed = syncService.syncFailed || coreSyncFailed;
  const lastSynced = syncService.lastSynced || coreLastSynced || globalSync.lastGlobalSync;
  
  return {
    isSyncing,
    syncFailed,
    lastSynced
  };
};
