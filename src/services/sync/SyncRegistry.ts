
class SyncRegistryService {
  normalizeTableName(tableName: string): string {
    // Remove any prefixes or suffixes, standardize the name
    return tableName.replace(/^(user_)?(.+?)(_\w+)?$/, '$2').toLowerCase();
  }

  getEndpoint(tableName: string): string {
    const normalizedName = this.normalizeTableName(tableName);
    return `${normalizedName}-sync.php`;
  }

  isRegistered(tableName: string): boolean {
    return true; // For now, assume all tables can be registered
  }

  // Adding missing methods
  getFullTableName(tableName: string, userId: string): string {
    return `${tableName}_${userId}`;
  }

  getTable(tableName: string): { tableName: string; tracked: boolean } | undefined {
    // Simple implementation for now
    return { tableName, tracked: this.isRegistered(tableName) };
  }

  getAllTables(): Array<{ tableName: string; tracked: boolean }> {
    // Return list of known tables
    const knownTables = ['documents', 'membres', 'collaboration'];
    return knownTables.map(tableName => ({
      tableName,
      tracked: this.isRegistered(tableName)
    }));
  }

  trackTable(tableName: string): boolean {
    // Implementation to track a table
    console.log(`Table ${tableName} is now tracked`);
    localStorage.setItem(`sync_track_${tableName}`, 'true');
    return true;
  }

  untrackTable(tableName: string): boolean {
    // Implementation to untrack a table
    console.log(`Table ${tableName} is no longer tracked`);
    localStorage.setItem(`sync_track_${tableName}`, 'false');
    return true;
  }

  migrateTable(oldTable: string, newTable: string, userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        console.log(`Migrating data from ${oldTable} to ${newTable} for user ${userId}`);
        
        // Get data from old table
        const oldData = localStorage.getItem(`${oldTable}_${userId}`);
        
        if (!oldData) {
          console.log(`No data found for ${oldTable}_${userId}`);
          resolve(true);
          return;
        }
        
        // Store in new table
        localStorage.setItem(`${newTable}_${userId}`, oldData);
        console.log(`Migration from ${oldTable} to ${newTable} completed successfully`);
        
        resolve(true);
      } catch (error) {
        console.error(`Error during migration from ${oldTable} to ${newTable}:`, error);
        resolve(false);
      }
    });
  }
}

export const syncRegistry = new SyncRegistryService();

export const isTableTracked = (tableName: string): boolean => {
  return syncRegistry.isRegistered(tableName);
};
