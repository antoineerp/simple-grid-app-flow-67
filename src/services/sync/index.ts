
/**
 * Point d'entrée principal pour les services de synchronisation
 */

// Exporter le service unifié
export * from './UnifiedSyncService';

// Exporter les gestionnaires
export * from './UnifiedStorageManager';
export * from './NetworkManager';

// Exporter les hooks
export { useUnifiedSync } from '@/hooks/useUnifiedSync';
export { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Exporter les composants
export { default as SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator';
export { default as SyncDashboard } from '@/components/sync/SyncDashboard';

// Exporter l'instance par défaut
import { unifiedSync } from './UnifiedSyncService';
export { unifiedSync };
export default unifiedSync;
