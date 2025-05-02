
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
}

export const syncRegistry = new SyncRegistryService();

export const isTableTracked = (tableName: string): boolean => {
  return syncRegistry.isRegistered(tableName);
};
