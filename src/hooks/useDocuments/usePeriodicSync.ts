
import { useEffect } from 'react';
import { Document } from '@/types/documents';
import { useSyncService, SYNC_CONFIG } from '@/services/core/syncService';

type UsePeriodicSyncProps = {
  userId: string | null;
  isOnline: boolean;
  syncFailed: boolean;
  isSyncing: boolean;
  documents: Document[];
  handleSyncWithServer: () => Promise<boolean>;
};

export const usePeriodicSync = ({
  userId,
  isOnline,
  syncFailed,
  isSyncing,
  documents,
  handleSyncWithServer
}: UsePeriodicSyncProps) => {
  const syncService = useSyncService();
  
  // Set up periodic synchronization
  useEffect(() => {
    let cleanupSync: (() => void) | undefined;
    
    if (userId && isOnline) {
      cleanupSync = syncService.setupPeriodicSync(() => {
        if (isOnline && !syncFailed && !isSyncing && userId && documents.length > 0) {
          console.log(`Synchronisation périodique des documents (${documents.length})`);
          return handleSyncWithServer();
        }
        return Promise.resolve(false);
      }, SYNC_CONFIG.intervalSeconds);
    }
    
    return () => {
      if (cleanupSync) cleanupSync();
    };
  }, [userId, isOnline, documents.length, syncService, syncFailed, isSyncing, handleSyncWithServer]);
};
