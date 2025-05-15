
/**
 * Service for syncing data with the server
 */
export const triggerSync = async (tableName: string): Promise<boolean> => {
  try {
    console.log(`Syncing table ${tableName}...`);
    // In a real application, this would make an API call to sync data
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    console.log(`Sync complete for ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Error syncing ${tableName}:`, error);
    return false;
  }
};

export const triggerTableSync = async (tableName: string): Promise<boolean> => {
  return triggerSync(tableName);
};
