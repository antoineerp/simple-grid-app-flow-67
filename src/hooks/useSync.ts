
/**
 * Hook complètement désactivé - ne fait plus aucune synchronisation
 */

// Version entièrement neutralisée qui ne fait absolument rien
export function useSync(tableName: string) {
  // Retourner une interface compatible mais qui ne fait rien
  return {
    syncAndProcess: async () => ({ success: true, timestamp: new Date() }),
    loadData: async () => [],
    isSyncing: false,
    isOnline: true,
    lastSynced: new Date(),
    syncFailed: false,
    syncError: null
  };
}
