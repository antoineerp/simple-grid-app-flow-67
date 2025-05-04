
/**
 * Gestionnaire de verrouillage pour les opérations de synchronisation
 * Note: Fonctionnalité désactivée pour cette application
 */

export const acquireSyncLock = async (userId: string, operation: string): Promise<boolean> => {
  console.log("Fonctionnalité de verrouillage désactivée");
  return true;
};

export const releaseSyncLock = async (userId: string, operation: string): Promise<boolean> => {
  console.log("Fonctionnalité de verrouillage désactivée");
  return true;
};

export const checkSyncLock = async (userId: string, operation: string): Promise<boolean> => {
  console.log("Fonctionnalité de verrouillage désactivée");
  return false;
};
