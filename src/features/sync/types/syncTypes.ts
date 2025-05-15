
export interface SyncContext {
  storage: {
    getItems: <T>(key: string) => Promise<T[]>;
    setItems: <T>(key: string, items: T[]) => Promise<void>;
    getItem: <T>(key: string) => Promise<T | null>;
    setItem: <T>(key: string, item: T) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  };
  network: {
    isOnline: boolean;
    fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
  };
  user: {
    id: string | null;
    token: string | null;
  };
}

export interface SyncOptions {
  autoSync?: boolean;
  syncInterval?: number;
  retryAttempts?: number;
}

export interface SyncJob {
  id: string;
  table: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
}

export interface SyncState {
  isSyncing: boolean;
  lastSynced: string | null;
  pendingOperations: number;
  error: string | null;
}
