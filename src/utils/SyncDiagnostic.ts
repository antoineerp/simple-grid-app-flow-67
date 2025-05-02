
// A simple class to match what's used in SyncManagement.tsx
export class SyncDiagnostic {
  static checkSyncStatus() {
    return {
      pendingSync: [],
      inProgressSync: [],
      syncStates: [],
      tableData: {}
    };
  }
  
  static repairBlockedSyncs() {
    return 0;
  }
  
  static async forceFullSync() {
    return true;
  }
  
  static checkTableStatus(tableName: string) {
    return {
      tableName,
      syncing: false,
      lastSync: null
    };
  }
  
  // Add the missing methods
  static trackAllTables() {
    console.log('Tracking all tables');
    return 0;
  }
  
  static async migrateOldTables() {
    console.log('Migrating old tables');
    return true;
  }
}

export default SyncDiagnostic;
