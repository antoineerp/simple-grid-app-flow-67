
// Defines common types for the sync functionality

export interface SyncHookOptions {
  showToasts?: boolean;
  autoSync?: boolean; 
  debounceTime?: number;
  syncKey?: string;
  maxRetries?: number;
}

export interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
  pendingSync: boolean;
  dataChanged: boolean;
}

export interface SyncOperationResult {
  success: boolean;
  message: string;
}
