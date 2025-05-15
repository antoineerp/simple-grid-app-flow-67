
// Global type extensions

// Add support for custom events
interface WindowEventMap {
  'syncStarted': CustomEvent<{
    tableName: string;
    operationId: string;
    trigger?: 'auto' | 'manual' | 'initial';
  }>;
  'syncCompleted': CustomEvent<{
    tableName: string;
    operationId: string;
    trigger?: 'auto' | 'manual' | 'initial';
  }>;
  'syncFailed': CustomEvent<{
    tableName: string;
    operationId: string;
    error?: string;
  }>;
  'force-sync-required': CustomEvent;
  'connectivity-restored': CustomEvent;
}
