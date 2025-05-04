
/**
 * Moniteur de synchronisation pour les opérations de synchronisation
 * Note: Fonctionnalité désactivée pour cette application
 */

// Création d'un objet syncMonitor avec les méthodes nécessaires
export const syncMonitor = {
  recordSyncStart: (params: { attemptId: string; tableName: string; operation: string }): void => {
    console.log("Fonctionnalité de monitoring désactivée - recordSyncStart");
  },
  
  recordSyncEnd: (operationId: string, success: boolean, errorMessage?: string): void => {
    console.log("Fonctionnalité de monitoring désactivée - recordSyncEnd");
  },
  
  hasActiveSync: (tableName: string): boolean => {
    console.log("Fonctionnalité de monitoring désactivée - hasActiveSync");
    return false;
  },
  
  getStatus: () => {
    return {
      activeCount: 0,
      recentAttempts: [],
      stats: { success: 0, failure: 0 },
      health: 'good' as 'good' | 'warning' | 'critical',
      lastSync: { time: null, success: false }
    };
  }
};

export const startSyncMonitoring = (userId: string, operation: string): string => {
  console.log("Fonctionnalité de monitoring désactivée");
  return "";
};

export const stopSyncMonitoring = (monitorId: string): void => {
  console.log("Fonctionnalité de monitoring désactivée");
};

export const reportSyncProgress = (monitorId: string, progress: number, message: string): void => {
  console.log("Fonctionnalité de reporting désactivée");
};
